import React, { useState, useRef } from 'react';
import './AddChildModal.css';

export default function AddChildModal({ isOpen, onRequestClose, onChildAdded }) {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newChild = {
      id: Date.now(),
      name: childName,
      age: childAge,
      fileName: fileName || null,
    };
    if (onChildAdded) onChildAdded(newChild);
    // Reset form
    setChildName('');
    setChildAge('');
    setFileName('');
    onRequestClose();
  };

  return (
    <div className="modal-overlay" onClick={onRequestClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Prepare the Ground</h2>
        <p className="modal-subtitle">
          Just a few details to help us cultivate a personalized experience for your child.
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="childName" className="modal-label">Child's First Name</label>
          <input
            type="text"
            id="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required
            className="modal-input"
            placeholder="Enter first name"
          />

          <label htmlFor="childAge" className="modal-label">Age (years)</label>
          <div className="modal-age-wrapper">
            <span className="modal-age-icon" aria-hidden="true">🎂</span>
            <input
              type="number"
              id="childAge"
              min="1"
              max="18"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              required
              className="modal-input modal-input--age"
              placeholder="e.g. 7"
            />
          </div>

          <label className="modal-label">Share a piece of their writing</label>
          <div
            className={`modal-upload ${dragActive ? 'modal-upload--active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {fileName ? (
              <p className="modal-upload-filename">{fileName}</p>
            ) : (
              <>
                <p className="modal-upload-text">
                  Tap to upload or drag photo
                </p>
                <p className="modal-upload-hint">Supports JPG, PNG (Max 5MB)</p>
              </>
            )}
          </div>

          <button type="submit" className="modal-submit">
            Enter the World →
          </button>
        </form>
      </div>
    </div>
  );
}
