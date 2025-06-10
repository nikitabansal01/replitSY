import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    
    // Get Firebase ID token for backend authentication
    const token = await result.user.getIdToken();
    localStorage.setItem('authToken', token);
    
    return result.user;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Get Firebase ID token for backend authentication
    const token = await result.user.getIdToken();
    localStorage.setItem('authToken', token);
    
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get Firebase ID token for backend authentication
    const token = await result.user.getIdToken();
    localStorage.setItem('authToken', token);
    
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
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

export async function getAuthToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error("Error getting auth token:", error);
    return localStorage.getItem('authToken');
  }
}
