import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { handleRedirectResult } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage
    return localStorage.getItem('authToken');
  });

  useEffect(() => {
    const checkAuthState = () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken === 'demo-token') {
        // Simulate a user object for demo mode
        const mockUser = {
          uid: 'demo-user-123',
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: null,
          emailVerified: true,
          getIdToken: async () => storedToken
        } as User;
        
        setUser(mockUser);
        setToken(storedToken);
        setLoading(false);
      } else {
        // Real Firebase auth would go here
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            const idToken = await firebaseUser.getIdToken();
            setToken(idToken);
          } else {
            setUser(null);
            setToken(null);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      }
    };

    // Initial check
    checkAuthState();

    // Listen for storage changes (for demo mode)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}
