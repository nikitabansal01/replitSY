import { signInWithRedirect, GoogleAuthProvider, getRedirectResult, signOut, User } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Get Firebase ID token for backend authentication
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}
