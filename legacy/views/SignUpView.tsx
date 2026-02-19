import React, { useState, useEffect } from 'react';
import { Leaf, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';

interface SignUpViewProps {
  onSignUp: () => void;
  onLoginClick: () => void;
}

const SignUpView: React.FC<SignUpViewProps> = ({ onSignUp, onLoginClick }) => {
  const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Verification State
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Mock "sent" code
  const MOCK_CODE = '1234';

  // Initialize Google and Apple Sign-In
  useEffect(() => {
    // Google
    const handleGoogleResponse = (response: any) => {
      console.log("Google ID Token:", response.credential);
      onSignUp();
    };

    if (step === 'FORM' && (window as any).google) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID",
          callback: handleGoogleResponse
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleSignUpBtn"),
          { 
            theme: "outline", 
            size: "large", 
            width: "165", 
            text: "signup_with",
            logo_alignment: "center"
          }
        );
      } catch (e) {
        console.error("Google Sign-In initialization failed", e);
      }
    }

    // Apple
    if (step === 'FORM' && (window as any).AppleID) {
        try {
            (window as any).AppleID.auth.init({
                clientId : 'com.happypause.service', 
                scope : 'name email',
                redirectURI : 'https://happypause.com/auth/apple/callback', 
                state : 'origin:web',
                usePopup : true
            });
        } catch (e) {
            console.error("Apple Sign-In initialization failed", e);
        }
    }
  }, [step, onSignUp]);

  const handleAppleLogin = async () => {
    try {
        if ((window as any).AppleID) {
            const response = await (window as any).AppleID.auth.signIn();
            console.log("Apple Sign-In response:", response);
            onSignUp();
        } else {
            console.warn("Apple Sign-In script not loaded yet");
            onSignUp(); 
        }
    } catch (error) {
        console.error("Apple Sign-In error:", error);
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }

    // Simulate sending email
    alert(`Verification code sent to ${email}: ${MOCK_CODE}`);
    setStep('VERIFY');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === MOCK_CODE) {
        onSignUp();
    } else {
        setError('Invalid code. Please check your email and try again.');
    }
  };

  return (
    <div className="bg-charcoal text-offWhite min-h-screen flex flex-col items-center p-6 font-display overflow-y-auto relative">
      
      {/* Back Button for Verify Step */}
      {step === 'VERIFY' && (
        <button 
            onClick={() => { setStep('FORM'); setError(''); setVerificationCode(''); }}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 z-10"
        >
            <ArrowLeft size={20} />
        </button>
      )}

      {/* Header */}
      <div className="w-full max-w-sm flex flex-col items-center pt-8 mb-8">
        <div className="w-16 h-16 bg-sage/20 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/20">
             <Leaf className="text-sage w-8 h-8" fill="currentColor" fillOpacity={0.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-offWhite">
            {step === 'FORM' ? 'Join HappyPause' : 'Verify Email'}
        </h1>
        {step === 'VERIFY' && (
            <p className="text-sage/70 text-sm mt-2 text-center">
                Enter the code sent to <br/><span className="text-offWhite font-bold">{email}</span>
            </p>
        )}
      </div>

      {/* Content */}
      <div className="w-full max-w-sm space-y-5 flex-1">
        
        {step === 'FORM' ? (
            /* --- SIGN UP FORM --- */
            <form onSubmit={handleCreateAccount} className="space-y-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-offWhite ml-1">Email Address</label>
                    <input 
                        type="email" 
                        placeholder="name@example.com"
                        className="w-full h-12 bg-[#444148] border-none rounded-xl px-4 text-offWhite placeholder:text-sage/40 focus:ring-2 focus:ring-sage/50 outline-none transition-all duration-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-offWhite ml-1">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full h-12 bg-[#444148] border-none rounded-xl px-4 text-offWhite placeholder:text-sage/40 focus:ring-2 focus:ring-sage/50 outline-none transition-all duration-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-sage hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-offWhite ml-1">Confirm Password</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full h-12 bg-[#444148] border-none rounded-xl px-4 text-offWhite placeholder:text-sage/40 focus:ring-2 focus:ring-sage/50 outline-none transition-all duration-300"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-sage hover:text-white transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-offWhite ml-1">(Optional) Phone Number</label>
                    <input 
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full h-12 bg-[#444148] border-none rounded-xl px-4 text-offWhite placeholder:text-sage/40 focus:ring-2 focus:ring-sage/50 outline-none transition-all duration-300"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                
                {error && <p className="text-red-400 text-sm font-bold text-center">{error}</p>}

                <button 
                    type="submit"
                    className="w-full h-14 bg-sage text-charcoal font-bold text-lg rounded-xl shadow-lg shadow-black/20 hover:opacity-95 active:scale-[0.98] transition-all mt-4"
                >
                    Create Account
                </button>
            </form>
        ) : (
            /* --- VERIFICATION FORM --- */
            <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-offWhite ml-1 text-center">Verification Code</label>
                    <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={20} />
                         <input 
                            autoFocus
                            type="text" 
                            placeholder="Enter 4-digit code"
                            className="w-full h-14 bg-[#444148] border-none rounded-xl pl-12 pr-4 text-offWhite placeholder:text-sage/40 focus:ring-2 focus:ring-sage/50 outline-none transition-all duration-300 text-lg tracking-widest"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            maxLength={4}
                        />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm font-bold text-center animate-pulse">{error}</p>}

                <div className="space-y-3">
                    <button 
                        type="submit"
                        className="w-full h-14 bg-sage text-charcoal font-bold text-lg rounded-xl shadow-lg shadow-black/20 hover:opacity-95 active:scale-[0.98] transition-all"
                    >
                        Verify & Create
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => alert(`Resent code to ${email}: ${MOCK_CODE}`)}
                        className="w-full py-2 text-sage text-sm font-semibold hover:text-white transition-colors"
                    >
                        Resend Code
                    </button>
                </div>
            </form>
        )}

        {step === 'FORM' && (
            <>
                <div className="flex items-center gap-4 py-4">
                    <div className="h-[1px] flex-1 bg-sage/20"></div>
                    <span className="text-xs font-semibold text-sage/60 uppercase tracking-widest whitespace-nowrap">Sign up with:</span>
                    <div className="h-[1px] flex-1 bg-sage/20"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                    {/* Google Button Container for Signup */}
                    <div id="googleSignUpBtn" className="flex justify-center w-full overflow-hidden rounded-xl"></div>

                    <button onClick={handleAppleLogin} className="flex items-center justify-center gap-2 w-full h-[40px] bg-black text-white font-semibold rounded-md hover:bg-zinc-900 transition-colors border border-white/10">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.8-42.3 0-82.7 24.3-104.7 62.7-45.4 79-11.6 190.3 33.4 254.4 21 30.1 46.1 63.6 77.3 62.4 31.3-1.2 43.2-20.3 81.4-20.3 38.2 0 49.1 20.3 81.9 19.7 33.4-.6 54.7-30.5 75.9-61.2 24.2-35.1 34.2-69 34.4-70.7-1.1-.3-66.3-24.7-66.7-101zM285.2 79.9c15.5-18.9 25.5-45.1 22.6-71.1-22.1 1.1-48.8 15.1-64.6 33.5-14.3 16.6-26.7 43.1-23.4 68.7 24.1 1.8 49.2-12.2 65.4-31.1z"></path>
                        </svg>
                        <span className="text-sm">Apple</span>
                    </button>
                </div>
            </>
        )}
      </div>

      <div className="w-full max-w-sm pt-8 pb-4">
        {step === 'FORM' && (
            <div className="text-center">
                <p className="text-sage text-sm">
                    Already have an account? 
                    <button onClick={onLoginClick} className="text-brightGreen font-bold ml-1 hover:underline">Log In</button>
                </p>
            </div>
        )}
      </div>
      
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-64 h-64 bg-sage/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-80 h-80 bg-brightGreen/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default SignUpView;