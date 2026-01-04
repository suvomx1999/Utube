import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const { signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Failed to login", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-gray-50 dark:bg-[#0f0f0f] transition-colors duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">Sign in to Utube</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Upload videos, subscribe to channels, and more.</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-800 py-3 px-4 rounded-full font-medium hover:bg-gray-50 transition-colors"
        >
          <FcGoogle size={24} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
