import base64, os
import cv2, numpy as np, tensorflow as tf
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from tensorflow.keras import layers
from dotenv import load_dotenv

load_dotenv()

IMG_SIZE = 64
CLASS_NAMES = ["Corrected", "Normal", "Reversal"]   # from the Kaggle print
REV = CLASS_NAMES.index("Reversal")
DATASET_DARK_INK = False                              # from the Kaggle print
CONF_MIN, THRESHOLD, MIN_CHARS, LINE_HEIGHT = 0.60, 0.25, 5, 320

# ---------- model + Grad-CAM graph ----------
model = tf.keras.models.load_model("char_model.keras")
last_conv = [l for l in model.layers if isinstance(l, layers.Conv2D)][-1]
_in = tf.keras.Input((IMG_SIZE, IMG_SIZE, 1)); _t, conv_out = _in, None
for l in model.layers:
    if isinstance(l, tf.keras.Sequential):           # skip the augmentation block
        continue
    _t = l(_t)
    if l is last_conv:
        conv_out = _t
grad_model = tf.keras.Model(_in, [conv_out, _t])

def gradcam(crop):
    x = tf.convert_to_tensor(crop[None, ..., None].astype("float32"))
    with tf.GradientTape() as tape:
        co, preds = grad_model(x, training=False)
        score = preds[:, int(tf.argmax(preds[0]))]
    grads = tape.gradient(score, co)
    w = tf.reduce_mean(grads, axis=(1, 2))
    cam = tf.nn.relu(tf.reduce_sum(co * w[:, None, None, :], axis=-1))[0].numpy()
    cam = cv2.resize(cam, (IMG_SIZE, IMG_SIZE))
    return (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

# ---------- image handling ----------
def data_url(bgr):
    ok, buf = cv2.imencode(".png", bgr)
    return "data:image/png;base64," + base64.b64encode(buf).decode()

def prepare_line(arr):
    """Page photo/scan -> clean ink mask of just the handwriting (ink = 255), or None."""
    H, W = arr.shape
    bw = cv2.adaptiveThreshold(cv2.GaussianBlur(arr, (5, 5), 0), 255,
                               cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 12)
    # 1) remove long horizontal rules (ruled paper, top/bottom edges of the frame)
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (max(W // 8, 15), 1))
    rules = cv2.morphologyEx(cv2.dilate(bw, np.ones((1, 15), np.uint8)), cv2.MORPH_OPEN, hk)
    bw = cv2.subtract(bw, rules)
    # 2) remove the page frame: anything huge, touching the image edge, or a tiny speck
    n, lab, st, _ = cv2.connectedComponentsWithStats(bw)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        touches_edge = x <= 0.02 * W or y <= 0.02 * H or x + w >= 0.98 * W or y + h >= 0.98 * H
        if touches_edge or h > 0.6 * H or w > 0.6 * W or a < 25:
            bw[lab == i] = 0
    # 3) crop to the writing and normalise its size
    ys, xs = np.where(bw > 0)
    if len(xs) == 0:
        return None
    pad = 12
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, H)
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, W)
    bw = bw[y0:y1, x0:x1]
    s = float(np.clip(LINE_HEIGHT / bw.shape[0], 0.6, 3.0))
    bw = cv2.resize(bw, None, fx=s, fy=s, interpolation=cv2.INTER_LINEAR)
    _, bw = cv2.threshold(bw, 127, 255, cv2.THRESH_BINARY)
    # 4) reconnect strokes cut by the rule removal, drop specks
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 15)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(bw)
    for i in range(1, n):
        if st[i][4] < 150:
            bw[lab == i] = 0
    return bw

def split_wide(ink, boxes):
    """Heuristic: cut boxes much wider than the median at their thinnest columns."""
    if len(boxes) < 3:
        return boxes
    med = float(np.median([b[2] for b in boxes])); out = []
    for (x, y, w, h) in boxes:
        if w < 2.2 * med:
            out.append((x, y, w, h)); continue
        col = np.convolve(ink[y:y+h, x:x+w].sum(axis=0).astype(float), np.ones(9) / 9, mode="same")
        parts = max(int(round(w / med)), 2); cuts = [0]
        for k in range(1, parts):
            c, r = int(k * w / parts), int(0.4 * med)
            lo, hi = max(c - r, cuts[-1] + 5), min(c + r, w - 5)
            cuts.append(lo + int(np.argmin(col[lo:hi])) if hi > lo else c)
        cuts.append(w)
        out += [(x + a, y, b - a, h) for a, b in zip(cuts[:-1], cuts[1:]) if b - a > 5]
    return sorted(out)

def to_crop(ink, box):
    x, y, w, h = box
    s = max(w, h) + 8
    sq = np.zeros((s, s), np.uint8)
    sq[(s-h)//2:(s-h)//2+h, (s-w)//2:(s-w)//2+w] = ink[y:y+h, x:x+w]
    c = cv2.resize(sq, (IMG_SIZE, IMG_SIZE))
    return 255 - c if DATASET_DARK_INK else c

def overlay(crop, cam):
    base = cv2.cvtColor(255 - crop if DATASET_DARK_INK else crop, cv2.COLOR_GRAY2BGR)
    heat = cv2.applyColorMap((cam * 255).astype(np.uint8), cv2.COLORMAP_JET)
    return data_url(cv2.resize(cv2.addWeighted(base, 0.55, heat, 0.45, 0), (128, 128),
                               interpolation=cv2.INTER_NEAREST))
def risk_band(rate, n_used, age):
    if n_used < MIN_CHARS:
        return "insufficient_data"
    level = "low" if rate < 0.15 else ("moderate" if rate <= 0.30 else "elevated")
    if age is not None and age < 8 and level == "elevated":
        level = "moderate"          # letter reversals are common at this age
    return level

def run_pipeline(raw_bytes, age=None):
    arr = cv2.imdecode(np.frombuffer(raw_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
    if arr is None:
        raise HTTPException(400, "Unreadable image")
    empty = {"risk_level": "no_characters", "n_detected": 0, "n_used": 0,
             "n_flagged": 0, "reversal_rate": 0.0, "characters": []}
    ink = prepare_line(arr)
    if ink is None:
        return empty
    # cv2.imwrite("debug_ink.png", 255 - ink)   # uncomment to see what the pipeline sees

    n, _, st, _ = cv2.connectedComponentsWithStats(ink)
    boxes = [tuple(int(v) for v in st[i][:4]) for i in range(1, n) if st[i][4] >= 300]
    if boxes:
        tall = max(b[3] for b in boxes)
        boxes = [b for b in boxes if b[3] >= 0.2 * tall
                 and b[3] / max(b[2], 1) < 12 and b[2] / max(b[3], 1) < 3.0]
    boxes = split_wide(ink, sorted(boxes))
    if not boxes:
        return empty

    crops = np.array([to_crop(ink, b) for b in boxes])
    P = model.predict(crops[..., None].astype("float32"), verbose=0)
    PF = model.predict(np.ascontiguousarray(crops[:, :, ::-1])[..., None].astype("float32"), verbose=0)

    vis = cv2.cvtColor(255 - ink, cv2.COLOR_GRAY2BGR); chars = []
    for i, (b, c) in enumerate(zip(boxes, crops)):
        pred = int(P[i].argmax()); unsure = bool(P[i][pred] < CONF_MIN)
        col = (150, 150, 150) if unsure else ((0, 0, 255) if pred == REV else (0, 160, 0))
        cv2.rectangle(vis, (b[0], b[1]), (b[0] + b[2], b[1] + b[3]), col, 2)
        cv2.putText(vis, str(i + 1), (b[0], max(14, b[1] - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, col, 2)
        chars.append({"index": i + 1, "box": list(b), "label": CLASS_NAMES[pred],
                      "confidence": float(P[i][pred]), "uncertain": unsure,
                      "p_reversal": float(P[i][REV]), "p_reversal_mirrored": float(PF[i][REV]),
                      "mirrored_label": CLASS_NAMES[int(PF[i].argmax())],
                      "gradcam": overlay(c, gradcam(c))})

    sure = [c for c in chars if not c["uncertain"]]
    flagged = [c for c in sure if c["label"] == "Reversal"]
    rate = len(flagged) / max(len(sure), 1)
    return {"risk_level": risk_band(rate, len(sure), age), "n_detected": len(chars),
            "n_used": len(sure), "n_flagged": len(flagged), "reversal_rate": rate,
            "annotated": data_url(vis), "characters": chars}

from typing import Optional

class Req(BaseModel):
    path: str
    age: Optional[int] = None

# ---------- API ----------
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=[os.environ["FRONTEND_ORIGIN"]],
                   allow_methods=["POST", "GET"], allow_headers=["*"])
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze")
def analyze(req: Req, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        user = sb.auth.get_user(authorization.split(" ", 1)[1]).user
    except Exception:
        raise HTTPException(401, "Invalid token")
    if user is None:
        raise HTTPException(401, "Invalid token")
    if not req.path.startswith(f"{user.id}/"):
        raise HTTPException(403, "Not your file")
    try:
        data = sb.storage.from_("handwriting").download(req.path)
        return run_pipeline(data, req.age)
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, f"Analysis error: {e}")