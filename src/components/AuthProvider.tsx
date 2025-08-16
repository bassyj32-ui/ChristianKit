import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { cloudDataService } from '../services/cloudDataService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isProUser: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [cloudUnsubscribers, setCloudUnsubscribers] = useState<(() => void)[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)
      
      if (user) {
        try {
          // Initialize user in cloud
          await cloudDataService.initializeUser(user)
          
          // Perform initial sync
          await cloudDataService.syncLocalDataToCloud(user)
          
          // Set up real-time listeners
          const unsubscribePrayer = cloudDataService.subscribeToPrayerSessions(user, (sessions) => {
            // Update local storage with cloud data
            localStorage.setItem('prayerSessions', JSON.stringify(sessions))
          })
          
          const unsubscribeBible = cloudDataService.subscribeToBibleReadings(user, (readings) => {
            // Update local storage with cloud data
            localStorage.setItem('bibleReadings', JSON.stringify(readings))
          })
          
          const unsubscribeCommunity = cloudDataService.subscribeToCommunityPosts((posts) => {
            // Update local storage with cloud data
            localStorage.setItem('communityPosts', JSON.stringify(posts))
          })
          
          // Store unsubscribe functions for cleanup
          setCloudUnsubscribers([unsubscribePrayer, unsubscribeBible, unsubscribeCommunity])
          
          console.log('Cloud sync initialized for user:', user.email)
        } catch (error) {
          console.error('Error initializing cloud sync:', error)
        }
      } else {
        // Clean up cloud listeners when user signs out
        if (cloudUnsubscribers.length > 0) {
          cloudUnsubscribers.forEach(unsubscribe => unsubscribe())
          setCloudUnsubscribers([])
        }
        cloudDataService.unsubscribeAll()
      }
    })

    return () => {
      unsubscribe()
      // Clean up cloud listeners
      if (cloudUnsubscribers.length > 0) {
        cloudUnsubscribers.forEach(unsubscribe => unsubscribe())
      }
      cloudDataService.unsubscribeAll()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Sync data to cloud before logout
      if (user) {
        await cloudDataService.syncLocalDataToCloud(user)
      }
      
      // Clean up cloud listeners
      if (cloudUnsubscribers.length > 0) {
        cloudUnsubscribers.forEach(unsubscribe => unsubscribe())
        setCloudUnsubscribers([])
      }
      cloudDataService.unsubscribeAll()
      
      await signOut(auth)
    } catch (error) {
      console.error('Error during logout:', error)
      // Still sign out even if sync fails
      await signOut(auth)
    }
  };

  const value = {
    user,
    loading,
    error,
    isProUser,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
