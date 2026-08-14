import { supabase } from "../config/supabase";

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:5173/",
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}