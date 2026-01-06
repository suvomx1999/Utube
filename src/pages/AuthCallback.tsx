import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const checkCount = useRef(0);

  useEffect(() => {
    // If we are already logged in according to context, go home
    if (currentUser) {
        console.log("AuthCallback: CurrentUser detected, redirecting to home.");
        navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("AuthCallback: Checking session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          console.log("AuthCallback: Session found via getSession:", session.user.email);
          // We found a session, but we wait for currentUser to update in the other useEffect
          // Just in case it doesn't update quickly, we force a reload/check after a delay
          setTimeout(() => {
             if (!currentUser) {
                 console.warn("AuthCallback: Session exists but Context not updated. Force redirecting...");
                 navigate('/', { replace: true });
             }
          }, 2000);
        } else {
            // Fallback: Check hash manually
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                console.log("AuthCallback: Hash found, waiting for Supabase processing...");
                // Supabase client should pick this up automatically.
                // We'll give it a moment.
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 2000);
            } else {
                console.log("AuthCallback: No session and no hash. Redirecting to login.");
                // Give it a grace period just in case
                setTimeout(() => navigate('/login', { replace: true }), 1000);
            }
        }
      } catch (error) {
        console.error('AuthCallback Error:', error);
        navigate('/login', { replace: true });
      }
    };

    if (!currentUser) {
        handleAuthCallback();
    }
  }, [navigate, currentUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;