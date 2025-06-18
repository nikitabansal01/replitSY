// Simple token verification without Firebase Admin SDK
// In production, you would use Firebase Admin SDK with proper service account credentials

export interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
  aud: string;
  iss: string;
}

export const auth = {
  async verifyIdToken(token: string): Promise<DecodedToken> {
    // For now, we'll validate the token format and extract basic info
    // In production, use Firebase Admin SDK for proper verification
    
    if (!token || token === 'demo-token') {
      throw new Error('Invalid token');
    }

    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode payload (base64)
      const payload = JSON.parse(atob(parts[1]));
      
      // Basic validation of Firebase token structure
      if (!payload.aud || !payload.iss || !payload.sub) {
        throw new Error('Invalid Firebase token');
      }

      // Verify audience matches Firebase project
      if (!payload.aud.includes(process.env.FIREBASE_PROJECT_ID || '')) {
        throw new Error('Invalid token audience');
      }

      return {
        uid: payload.sub,
        email: payload.email,
        name: payload.name,
        aud: payload.aud,
        iss: payload.iss
      };
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }
};