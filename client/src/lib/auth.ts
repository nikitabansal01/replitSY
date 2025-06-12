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
    console.log("Starting sign out process...");
    
    // Call server logout endpoint to clear chat history for privacy
    const token = localStorage.getItem('authToken');
    console.log("Current token:", token ? "exists" : "not found");
    
    if (token && token !== 'demo-token') {
      try {
        console.log("Calling server logout endpoint...");
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log("Server logout response:", response.status);
      } catch (error) {
        console.error("Error clearing server data:", error);
      }
    }
    
    // Sign out from Firebase (only if not demo token)
    if (token !== 'demo-token') {
      console.log("Signing out from Firebase...");
      await signOut(auth);
    }
    
    // Clear local storage
    console.log("Clearing local storage...");
    localStorage.removeItem('authToken');
    
    // Force page reload to clear all state
    console.log("Redirecting to login page...");
    window.location.href = '/';
  } catch (error) {
    console.error("Error signing out:", error);
    // Even if signout fails, clear local state and redirect
    localStorage.removeItem('authToken');
    window.location.href = '/';
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
