
import { supabase } from "./supabase";

// Get the currently logged-in parent's children
export async function getChildren() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) throw userError;
  if (!userData.user) throw new Error("Please log in first.");

  const { data, error } = await supabase
    .from("children")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

// Get a single child by ID
export async function getChildById(childId) {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();

  if (error) throw error;
  return data;
}

// Add a child profile
export async function addChild(child) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) throw userError;
  if (!userData.user) throw new Error("Please log in first.");

  const userId = userData.user.id;

  let handwritingPath = null;

  if (child.handwriting instanceof File) {
    const file = child.handwriting;

    const extension = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("handwriting")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("HANDWRITING UPLOAD ERROR:", uploadError);
      throw uploadError;
    }

    handwritingPath = filePath;
  }

  const { data, error } = await supabase
    .from("children")
    .insert({
      parent_id: userId,
      name: child.name,
      age: child.age ? Number(child.age) : null,
      date_of_birth: child.dateOfBirth || null,
      grade: child.grade || null,
      preferred_language: child.preferredLanguage || "English",
      handwriting: handwritingPath,
    })
    .select()
    .single();

  if (error) {
    console.error("CHILD INSERT ERROR:", error);
    throw error;
  }

  return data;
}

// Update an existing child
export async function updateChild(childId, updates) {
  const { data, error } = await supabase
    .from("children")
    .update({
      name: updates.name,
      age: updates.age ? Number(updates.age) : null,
      grade: updates.grade || null,
      preferred_language: updates.preferredLanguage || "English",
      updated_at: new Date().toISOString(),
    })
    .eq("id", childId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Delete a child
export async function deleteChild(childId) {
  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", childId);

  if (error) throw error;
}