import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';


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
    let mounted = true;

    // Check for existing demo token first
    const existingToken = localStorage.getItem('authToken');
    if (existingToken === 'demo-token') {
      if (mounted) {
        setToken('demo-token');
        setUser({ uid: 'demo', email: 'demo@example.com' } as User);
        setLoading(false);
      }
      return;
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (mounted) {
            localStorage.setItem('authToken', idToken);
            setUser(firebaseUser);
            setToken(idToken);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error getting token:', error);
          if (mounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            setLoading(false);
          }
        }
      } else {
        // Set demo token for development
        const demoToken = 'demo-token';
        if (mounted) {
          localStorage.setItem('authToken', demoToken);
          setToken(demoToken);
          setUser({ uid: 'demo', email: 'demo@example.com' } as User);
          setLoading(false);
        }
      }
    });
    
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}
