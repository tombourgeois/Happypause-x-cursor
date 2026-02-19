import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Leaf } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
  onSignUpClick: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSignUpClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Initialize Google and Apple Sign-In
  useEffect(() => {
    // Google Init
    const handleGoogleResponse = (response: any) => {
      console.log("Google ID Token:", response.credential);
      onLogin();
    };

    if ((window as any).google) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID", // Replace with actual Client ID
          callback: handleGoogleResponse
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleSignInBtn"),
          { 
            theme: "outline", 
            size: "large", 
            width: "340", 
            text: "continue_with"
          }
        );
      } catch (e) {
        console.error("Google Sign-In initialization failed", e);
      }
    }

    // Apple Init
    // Note: In a real environment, verify AppleID script is loaded.
    if ((window as any).AppleID) {
        try {
            (window as any).AppleID.auth.init({
                clientId : 'com.happypause.service', // Replace with your Service ID
                scope : 'name email',
                redirectURI : 'https://happypause.com/auth/apple/callback', // Replace with your Redirect URI
                state : 'origin:web',
                usePopup : true
            });
        } catch (e) {
            console.error("Apple Sign-In initialization failed", e);
        }
    }
  }, [onLogin]);

  const handleAppleLogin = async () => {
    try {
        if ((window as any).AppleID) {
            const response = await (window as any).AppleID.auth.signIn();
            console.log("Apple Sign-In response:", response);
            // Verify token with backend
            onLogin();
        } else {
            console.warn("Apple Sign-In script not loaded yet");
            // Fallback/Simulate for demo if script fails or is blocked
            onLogin(); 
        }
    } catch (error) {
        console.error("Apple Sign-In error:", error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onLogin();
  };

  return (
    <div className="bg-charcoal text-offWhite min-h-screen flex flex-col items-center justify-between p-6 font-display overflow-y-auto">
      {/* Header / Logo */}
      <div className="w-full max-w-sm flex flex-col items-center pt-12">
        <div className="w-20 h-20 bg-sage/20 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/20">
            <Leaf className="text-sage w-10 h-10" fill="currentColor" fillOpacity={0.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-offWhite mb-2">HappyPause</h1>
        <p className="text-sage font-medium text-sm">Take a breath. Reconnect.</p>
      </div>

      {/* Form Area */}
      <div className="w-full max-w-sm space-y-6 flex-1 flex flex-col justify-center py-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-offWhite ml-1">Email</label>
            <div className="relative group">
              <input 
                className="w-full h-14 bg-[#444148] border-none rounded-xl px-4 text-offWhite placeholder:text-sage/50 focus:ring-2 focus:ring-sage/50 focus:outline-none transition-all duration-300" 
                placeholder="hello@happypause.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-offWhite ml-1">Password</label>
            <div className="relative flex items-center">
              <input 
                className="w-full h-14 bg-[#444148] border-none rounded-xl px-4 text-offWhite placeholder:text-sage/50 focus:ring-2 focus:ring-sage/50 focus:outline-none transition-all duration-300" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-sage hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-xs font-medium text-brightGreen hover:brightness-110 transition-colors">Forgot Password?</button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-sage text-charcoal font-bold text-lg rounded-xl shadow-lg shadow-black/20 hover:opacity-95 active:scale-[0.98] transition-all mt-6"
          >
            Sign In
          </button>
        </form>

        <div className="flex items-center gap-4 py-2">
          <div className="h-[1px] flex-1 bg-sage/20"></div>
          <span className="text-xs font-bold text-sage/60 uppercase tracking-widest">OR</span>
          <div className="h-[1px] flex-1 bg-sage/20"></div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Google Button Container */}
          <div id="googleSignInBtn" className="flex justify-center w-full"></div>
          
          <button onClick={handleAppleLogin} className="flex items-center justify-center gap-3 w-full h-14 bg-black text-white font-semibold rounded-xl hover:bg-zinc-900 transition-colors border border-white/10">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.8-42.3 0-82.7 24.3-104.7 62.7-45.4 79-11.6 190.3 33.4 254.4 21 30.1 46.1 63.6 77.3 62.4 31.3-1.2 43.2-20.3 81.4-20.3 38.2 0 49.1 20.3 81.9 19.7 33.4-.6 54.7-30.5 75.9-61.2 24.2-35.1 34.2-69 34.4-70.7-1.1-.3-66.3-24.7-66.7-101zM285.2 79.9c15.5-18.9 25.5-45.1 22.6-71.1-22.1 1.1-48.8 15.1-64.6 33.5-14.3 16.6-26.7 43.1-23.4 68.7 24.1 1.8 49.2-12.2 65.4-31.1z"></path>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>
      </div>

      {/* Footer Area */}
      <div className="w-full max-w-sm pt-4 pb-4">
        <div className="h-[1px] w-full bg-sage/10 mb-6"></div>
        <div className="text-center">
            <p className="text-sage text-sm">
                Don't have an account? 
                <button type="button" onClick={onSignUpClick} className="text-brightGreen font-bold ml-1 hover:underline">Sign Up</button>
            </p>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-64 h-64 bg-sage/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-80 h-80 bg-brightGreen/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default LoginView;