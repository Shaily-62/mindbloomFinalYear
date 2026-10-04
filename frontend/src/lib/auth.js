import { supabase } from "./supabase";

// Register a parent
export async function signUpParent({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  return data;
}

// Log in an existing parent
export async function signInParent({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

// Log out the current parent
export async function signOutParent() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

// Get the currently authenticated user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
}
