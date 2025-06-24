import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from '@/lib/queryClient';
import type { OnboardingData } from '@shared/schema';

interface ProfileData {
  user: {
    id: number;
    name: string;
    email: string;
  };
  onboarding: OnboardingData | null;
}

interface ProfileContextType {
  profile: ProfileData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<OnboardingData>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, token, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!token || authLoading) return;
    
    try {
      setLoading(true);
      console.log('Attempting to load profile with token:', token.substring(0, 20) + '...');
      const response = await apiRequest('GET', '/api/profile');
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        console.log('Profile loaded successfully:', data);
      } else {
        console.log('Profile request failed with status:', response.status);
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const updateProfile = async (data: Partial<OnboardingData>) => {
    if (!profile?.user.id) return;
    
    try {
      const response = await apiRequest('POST', '/api/onboarding', {
        ...data,
        userId: profile.user.id,
      });
      
      if (response.ok) {
        await loadProfile(); // Refresh profile data
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // Load profile when user logs in
  useEffect(() => {
    if (!authLoading && user && token) {
      loadProfile();
    } else if (!user) {
      setProfile(null);
      setLoading(false);
    }
  }, [user, token, authLoading]);

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      loading: loading || authLoading, 
      refreshProfile, 
      updateProfile 
    }}>
      {children}
    </ProfileContext.Provider>
  );
} 