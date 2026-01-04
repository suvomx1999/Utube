import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          console.log("Session successfully established:", session.user.email);
          // Small delay to ensure state propagates
          setTimeout(() => navigate('/', { replace: true }), 100);
        } else {
            // Fallback: Check hash manually if getSession fails immediately
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                console.log("Hash found in callback, waiting for Supabase...");
                // Just wait, the onAuthStateChange in AuthContext will likely pick it up
                // redirecting too early here might break it
                setTimeout(() => navigate('/', { replace: true }), 2000);
            } else {
                 navigate('/login', { replace: true });
            }
        }
      } catch (error) {
        console.error('Error during auth callback:', error);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

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