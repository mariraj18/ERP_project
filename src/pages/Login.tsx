import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Shield, BookOpen, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('superadmin');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const containerRef = useRef(null);

  useEffect(() => {
    return () => clearError();
  }, []); // Empty dependency array - only run on mount/unmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      await login(email, password);
      // Only set transitioning state after successful login
      setIsTransitioning(true);
      // Add a small delay to show the transition animation
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      setIsTransitioning(false);
      // Error is handled in AuthContext
    }
  };

  const quickLogin = (userType: string, loginEmail: string, loginPassword: string) => {
    setEmail(loginEmail);
    setPassword(loginPassword);
    setActiveTab(userType);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    clearError();
  };

  const getTabConfig = () => {
    const baseClasses = "flex-1 py-3 px-4 text-center font-medium rounded-t-lg transition-all duration-300 relative overflow-hidden";
    
    return {
      superadmin: {
        bgColor: "from-purple-900 to-purple-980",
        containerBg: "bg-purple-50",
        buttonBg: "bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-900",
        ringColor: "focus:ring-purple-500",
        borderColor: "border-purple-200",
        tabClass: `${baseClasses} ${
          activeTab === 'superadmin' 
          ? 'text-purple-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-200'
        }`
      },
      
      staff: {
        bgColor: "from-emerald-800 to-emerald-980",
        containerBg: "bg-emerald-50",
        buttonBg: "bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-900",
        ringColor: "focus:ring-emerald-500",
        borderColor: "border-emerald-200",
        tabClass: `${baseClasses} ${
          activeTab === 'staff' 
          ? 'text-emerald-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-200'
        }`
      },
      student: {
        bgColor: "from-amber-800 to-amber-980",
        containerBg: "bg-amber-50",
        buttonBg: "bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-900",
        ringColor: "focus:ring-amber-500",
        borderColor: "border-amber-200",
        tabClass: `${baseClasses} ${
          activeTab === 'student' 
          ? 'text-amber-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-200'
        }`
      }
    };
  };

  const config = getTabConfig()[activeTab as keyof ReturnType<typeof getTabConfig>];

  const tabVariants = {
    superadmin: {
      background: "linear-gradient(135deg, rgb(126 34 206) 0%, rgb(88 28 135) 100%)",
      color: "#7c3aed"
    },
    staff: {
      background: "linear-gradient(135deg, rgb(16 185 129) 0%, rgb(4 120 87) 100%)",
      color: "#059669"
    },
    student: {
      background: "linear-gradient(135deg, rgb(245 158 11) 0%, rgb(180 83 9) 100%)",
      color: "#d97706"
    }
  };

  const formVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.95,
      rotateX: -5,
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      rotateX: 0,
      y: 0
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      rotateX: 5,
      y: -20
    }
  };


  const tabContent = {
    superadmin: {
      title: "Super Admin Login",
      description: "Full system access and administrative controls"
    },
    staff: {
      title: "Staff Member Login",
      description: "Faculty and staff attendance management"
    },
    student: {
      title: "Student Login",
      description: "Student portal and attendance tracking"
    }
  };

 if (isTransitioning) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "300px" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-2 bg-gray-600 rounded-full mb-6 mx-auto overflow-hidden"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 1, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-1/2"
          />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-4"
        >
          <GraduationCap className="h-16 w-16 text-white mx-auto" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Welcome Back!
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-300"
        >
          Loading your personalized dashboard...
        </motion.p>
      </motion.div>
    </div>
  );
}
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4"
    >
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.9, opacity: 0, rotateY: 10 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="max-w-4xl w-full flex rounded-2xl overflow-hidden shadow-2xl"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        {/* Left Panel - Branding */}
        <motion.div 
          className={`hidden md:flex md:w-2/5 bg-gradient-to-br ${config.bgColor} p-8 flex-col justify-between text-white`}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div>
            <div className="flex items-center mb-8">
              <motion.div 
                className="bg-white/20 p-2 rounded-lg"
                whileHover={{ scale: 1.05, rotateY: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GraduationCap className="h-8 w-8" />
              </motion.div>
              <h1 className="text-2xl font-bold ml-3">ERPSystem</h1>
            </div>
            
            <h2 className="text-2xl font-bold mt-16 mb-4">College Attendance System</h2>
            <p className="text-opacity-80">Streamlined attendance tracking for educational institutions</p>
          </div>
          
          <div className="flex space-x-4">
            <motion.div 
              className="bg-white/10 p-3 rounded-lg"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Shield className="h-5 w-5" />
            </motion.div>
            <motion.div 
              className="bg-white/10 p-3 rounded-lg"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <BookOpen className="h-5 w-5" />
            </motion.div>
            <motion.div 
              className="bg-white/10 p-3 rounded-lg"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <User className="h-5 w-5" />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Right Panel - Login Form */}
        <motion.div 
          className={`w-full md:w-3/5 ${config.containerBg} p-8 md:p-10 flex flex-col justify-center relative overflow-hidden`}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={tabVariants[activeTab as keyof typeof tabVariants]}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          
          <div className="text-center mb-8 md:hidden">
            <motion.div 
              className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <User className="h-6 w-6 text-white" />
            </motion.div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              College Attendance System
            </h2>
          </div>
          
          {/* Role Tabs with 3D Animation */}
          <div className="mb-6 relative z-10">
            <div className="flex border-b border-gray-200 relative">
              {/* Animated slider background */}
              <motion.div
                className={`absolute top-0 h-full rounded-t-lg ${
                  activeTab === 'superadmin' ? 'bg-purple-100' : 
                  activeTab === 'staff' ? 'bg-emerald-100' : 'bg-amber-100'
                }`}
                initial={false}
                animate={{
                  width: "33.333%",
                  x: activeTab === 'superadmin' ? '0%' : activeTab === 'staff' ? '100%' : '200%',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ transform: 'translateX(-100%)' }}
              />
              
              <motion.button
                type="button"
                onClick={() => handleTabChange('superadmin')}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={getTabConfig().superadmin.tabClass}
              >
                <span className="relative z-10">Super Admin</span>
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => handleTabChange('staff')}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={getTabConfig().staff.tabClass}
              >
                <span className="relative z-10">Staff Member</span>
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => handleTabChange('student')}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={getTabConfig().student.tabClass}
              >
                <span className="relative z-10">Student</span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10"
            >
              <motion.h3 
                className="text-xl font-semibold text-center text-gray-800 mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {tabContent[activeTab as keyof typeof tabContent].title}
              </motion.h3>
              <motion.p 
                className="text-center text-gray-600 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {tabContent[activeTab as keyof typeof tabContent].description}
              </motion.p>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-100 border border-red-200 rounded-lg p-4"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <motion.input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <motion.input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      whileFocus={{ scale: 1.02 }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 pr-12"
                      placeholder="Enter your password"
                    />
                    <motion.button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className={`w-full py-3 px-4 ${config.buttonBg} text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.ringColor} disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center relative overflow-hidden`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        Sign In
                      </motion.span>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Quick Login Buttons */}
          <motion.div 
            className="mt-8 pt-8 border-t border-gray-200 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-gray-500 text-center mb-4">Quick Login (Demo)</p>
            <div className="grid grid-cols-1 gap-3">
              {activeTab === 'superadmin' && (
                <motion.button
                  type="button"
                  onClick={() => quickLogin('superadmin', 'admin@college.com', 'Admin@123')}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs py-2 px-3 bg-purple-200 text-gray-900 rounded-lg hover:bg-purple-300 transition-colors duration-200 font-medium"
                >
                  Super Admin Demo Credentials
                </motion.button>
              )}
              {activeTab === 'staff' && (
                <motion.button
                  type="button"
                  onClick={() => quickLogin('staff', 'rajesh.kumar@college.com', 'Staff@123')}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs py-2 px-3 bg-emerald-200 text-gray-900 rounded-lg hover:bg-emerald-300 transition-colors duration-200 font-medium"
                >
                  Staff Member Demo Credentials
                </motion.button>
              )}
              {activeTab === 'student' && (
                <motion.button
                  type="button"
                  onClick={() => quickLogin('student', 'cxndy.mee@gmail.com', 'Student@123')}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs py-2 px-3 bg-amber-200 text-gray-900 rounded-lg hover:bg-amber-300 transition-colors duration-200 font-medium"
                >
                  Student Member Demo Credentials
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}