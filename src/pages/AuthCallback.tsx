import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { currentUser, refreshSession } = useAuth();
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
        
        // 1. Force a session refresh first to ensure Context is up to date
        const session = await refreshSession();
        
        if (session) {
          console.log("AuthCallback: Session confirmed via refreshSession:", session.user.email);
          // Wait for the context to reflect this change (handled by first useEffect)
        } else {
            // Fallback: Check hash manually if getSession/refreshSession fails
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                console.log("AuthCallback: Hash found, waiting for Supabase processing...");
                
                // Set a timeout to try refreshing again
                setTimeout(async () => {
                    console.log("AuthCallback: Retrying refresh...");
                    await refreshSession();
                }, 1000);
                
                setTimeout(async () => {
                     // Final attempt before redirect
                     const finalSession = await refreshSession();
                     if (!finalSession) {
                         navigate('/', { replace: true });
                     }
                }, 3000);

            } else {
                console.log("AuthCallback: No session and no hash. Redirecting to login.");
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
  }, [navigate, currentUser, refreshSession]);

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