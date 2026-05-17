import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight, ArrowLeft, Loader2, Building, BadgeCheck, Fingerprint, ShieldAlert } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    role: '',
    email: '',
    empId: '',
    password: '',
    fullName: '',
    department: '',
    designation: '',
    confirmPassword: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  };

  const handleNextStep = () => {
    if (signupStep === 1) {
      if (!formData.fullName || !formData.email || !formData.empId) {
        return toast.error('Please fill all fields in step 1');
      }
      // Simple email validation
      if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        return toast.error('Please enter a valid email address');
      }
      setSignupStep(2);
    } else if (signupStep === 2) {
      if (!formData.role || !formData.department || !formData.designation) {
        return toast.error('Please fill all fields in step 2');
      }
      setSignupStep(3);
    }
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    setSignupStep(1);
    setFormData({
      role: '',
      email: '',
      empId: '',
      password: '',
      fullName: '',
      department: '',
      designation: '',
      confirmPassword: '',
      rememberMe: false
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!isLogin) {
      if (formData.password.length <= 8) {
        return toast.error('Password must be more than 8 characters');
      }
    }

    if (isLogin && (!formData.role || !formData.empId)) {
      return toast.error('Please select role and enter employee ID');
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? 'https://zenthra-dm3x.onrender.com/api/auth/login' : 'https://zenthra-dm3x.onrender.com/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(isLogin ? 'Successfully signed in!' : 'Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071426] flex text-white font-sans overflow-hidden selection:bg-[#4F46E5]">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0f213d', color: '#fff', border: '1px solid #1e3a5f' } }} />

      {/* LEFT: Background Image */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden border-r border-[#1e3a5f]/50">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 1, -1, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90 origin-center"
          style={{ backgroundImage: 'url(/cracked_bg.png)' }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#071426]/40 via-transparent to-[#071426]/80"></div>
        </motion.div>

        <div className="relative z-20 p-12 text-center w-full">
          <div className="bg-[#071426]/60 backdrop-blur-md p-8 rounded-3xl inline-block border border-white/10 shadow-2xl">
            <img src="/public/logo_full.png" alt="Zenthra" className="h-28 w-auto mx-auto mb-6 object-contain mix-blend-screen contrast-[1.5] brightness-[1.2]" />
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#FFC107]">Zenthra</span>
            </h2>
            <p className="text-gray-300 text-lg max-w-sm mx-auto drop-shadow-md">
              The intelligent enterprise portal for Atomberg teams to align, track, and achieve greatness together.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="w-full max-w-md relative z-10 overflow-y-auto max-h-screen py-8 custom-scrollbar">
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#0f213d]/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-[#1e3a5f] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-extrabold text-white mb-2">{isLogin ? 'Sign In to Portal' : 'Create Account'}</h3>
              <p className="text-sm text-gray-400">
                {isLogin ? 'Enter your enterprise credentials below' : 'Join the Zenthra ecosystem'}
              </p>
            </div>

            {!isLogin && (
              <div className="mb-8">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#1e3a5f] -z-10 rounded-full"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#4F46E5] -z-10 rounded-full transition-all duration-500" style={{ width: `${((signupStep - 1) / 2) * 100}%` }}></div>

                  {[1, 2, 3].map((step) => (
                    <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${signupStep >= step ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-[#0f213d] border-[#1e3a5f] text-gray-500'}`}>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#FFC107] transition-colors">
                        <ShieldAlert size={18} />
                      </div>
                      <select name="role" required value={formData.role} onChange={handleChange} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all appearance-none cursor-pointer">
                        <option value="">Select Role</option>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5] transition-colors">
                        <Fingerprint size={18} />
                      </div>
                      <input name="empId" type="text" required value={formData.empId} onChange={handleChange} placeholder="User ID / Employee ID" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all placeholder-gray-500" />
                    </div>

                    <p className="text-xs text-gray-400">
                      Demo employee login: select Employee and enter EMP1001.
                    </p>




                  </motion.div>
                ) : (
                  <motion.div key="signup" className="space-y-5">
                    {signupStep === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5]">
                            <User size={18} />
                          </div>
                          <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]" />
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5]">
                            <Mail size={18} />
                          </div>
                          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enterprise Email" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]" />
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5]">
                            <Fingerprint size={18} />
                          </div>
                          <input name="empId" type="text" value={formData.empId} onChange={handleChange} placeholder="Employee ID" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]" />
                        </div>
                        <button type="button" onClick={handleNextStep} className="w-full bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-2">
                          Next Step <ArrowRight size={18} />
                        </button>
                      </motion.div>
                    )}

                    {signupStep === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#FFC107]">
                            <ShieldAlert size={18} />
                          </div>
                          <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5] appearance-none">
                            <option value="">Select Role</option>
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5]">
                            <Building size={18} />
                          </div>
                          <input name="department" type="text" value={formData.department} onChange={handleChange} placeholder="Department (e.g. Engineering)" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5]" />
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5]">
                            <BadgeCheck size={18} />
                          </div>
                          <input name="designation" type="text" value={formData.designation} onChange={handleChange} placeholder="Designation (e.g. Sr. Developer)" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5]" />
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setSignupStep(1)} className="w-1/3 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center">
                            <ArrowLeft size={18} />
                          </button>
                          <button type="button" onClick={handleNextStep} className="w-2/3 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-2">
                            Next Step <ArrowRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {signupStep === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#4F46E5]">
                            <Lock size={18} />
                          </div>
                          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Secure Password" className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#4F46E5]" />
                        </div>
                        <p className="text-xs text-gray-400 -mt-2">
                          Use any password with more than 8 characters.
                        </p>

                        <div className="flex gap-4">
                          <button type="button" onClick={() => setSignupStep(2)} className="w-1/3 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center">
                            <ArrowLeft size={18} />
                          </button>
                          <button type="submit" disabled={isLoading} className="w-2/3 bg-gradient-to-r from-[#4F46E5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4F46E5] text-white py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isLogin && (
                <button type="submit" disabled={isLoading} className="w-full mt-4 bg-gradient-to-r from-[#4F46E5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4F46E5] text-white py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2 group">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              )}
            </form>

            <div className="mt-8 text-center pt-6 border-t border-[#1e3a5f]">
              <p className="text-gray-400 text-sm">
                {isLogin ? "Don't have an enterprise account? " : "Already have an account? "}
                <button onClick={switchAuthMode} className="text-[#FFC107] hover:text-white font-semibold transition-colors">
                  {isLogin ? 'Request Access' : 'Sign In'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
