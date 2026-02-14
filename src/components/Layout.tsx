import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, BarChart3, GraduationCap, Users, Shield, Moon, Sun, X, Mail, Phone, Calendar, MapPin, Download, Share2, Settings, ChevronRight, Sparkles, Zap, Crown, Award, Clock, Building2, BookOpen, CreditCard, Menu } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

// Create and export the context
export const LayoutContext = createContext<{
  setShowUserDetails: (show: boolean) => void;
}>({
  setShowUserDetails: () => {},
});

// Create a hook for easier usage
export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Enhanced mouse position tracking for parallax effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const smoothX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  const rotateX = useTransform(smoothY, [0, window.innerHeight], [5, -5]);
  const rotateY = useTransform(smoothX, [0, window.innerWidth], [-5, 5]);

  const handleMouseMove = (event: React.MouseEvent) => {
    mouseX.set(event.clientX);
    mouseY.set(event.clientY);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showUserDetails) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Add styles to prevent background scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showUserDetails]);

  const getRoleConfig = (role: string) => {
    const baseConfigs = {
      'SUPER_ADMIN': {
        light: {
          gradient: 'from-purple-900 via-violet-800 to-fuchsia-700',
          lightBg: 'bg-gradient-to-br from-purple-50/80 to-violet-100/60',
          badge: 'bg-gradient-to-r from-purple-800 to-fuchsia-600 text-white',
          button: 'bg-gradient-to-r from-purple-600 to-fuchsia-800 hover:from-purple-700 hover:to-fuchsia-700',
          iconBg: 'bg-gradient-to-br from-purple-600 to-fuchsia-900',
          wave: 'from-purple-400/30 via-violet-400/20 to-fuchsia-400/30',
          modalGradient: 'from-purple-500/20 via-violet-500/15 to-fuchsia-500/20',
          accent: 'text-purple-600',
          particle: 'bg-purple-500/40',
          glow: 'shadow-purple-500/25',
          neon: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]',
          navbar: 'bg-gradient-to-r from-purple-600/95 via-violet-600/95 to-fuchsia-600/95',
          glass: 'bg-purple-500/20',
          border: 'border-purple-500/30',
          text: 'text-purple-100'
        },
        dark: {
          gradient: 'from-purple-950 via-violet-900 to-fuchsia-900',
          lightBg: 'bg-gradient-to-br from-slate-900/80 to-purple-900/40',
          badge: 'bg-gradient-to-r from-purple-800 to-fuchsia-500 text-white',
          button: 'bg-gradient-to-r from-purple-600 to-fuchsia-800 hover:from-purple-500 hover:to-fuchsia-500',
          iconBg: 'bg-gradient-to-br from-purple-900 to-fuchsia-600',
          wave: 'from-purple-500/15 via-violet-500/10 to-fuchsia-500/15',
          modalGradient: 'from-purple-600/10 via-violet-600/8 to-fuchsia-600/10',
          accent: 'text-purple-400',
          particle: 'bg-purple-400/20',
          glow: 'shadow-purple-500/20',
          neon: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
          navbar: 'bg-gradient-to-r from-purple-900/95 via-violet-900/95 to-fuchsia-900/95',
          glass: 'bg-purple-400/15',
          border: 'border-purple-400/20',
          text: 'text-purple-50'
        }
      },
      'STAFF': {
        light: {
          gradient: 'from-emerald-900 via-teal-800 to-cyan-700',
          lightBg: 'bg-gradient-to-br from-emerald-50/80 to-cyan-100/60',
          badge: 'bg-gradient-to-r from-emerald-500 to-cyan-900 text-white',
          button: 'bg-gradient-to-r from-emerald-900 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600',
          iconBg: 'bg-gradient-to-br from-emerald-900 to-cyan-500',
          wave: 'from-emerald-400/30 via-teal-400/20 to-cyan-400/30',
          modalGradient: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/20',
          accent: 'text-emerald-600',
          particle: 'bg-emerald-400/40',
          glow: 'shadow-emerald-500/25',
          neon: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
          navbar: 'bg-gradient-to-r from-emerald-600/95 via-teal-600/95 to-cyan-600/95',
          glass: 'bg-emerald-500/20',
          border: 'border-emerald-500/30',
          text: 'text-emerald-100'
        },
        dark: {
          gradient: 'from-emerald-950 via-teal-900 to-cyan-900',
          lightBg: 'bg-gradient-to-br from-slate-900/80 to-emerald-900/40',
          badge: 'bg-gradient-to-r from-emerald-400 to-cyan-900 text-white',
          button: 'bg-gradient-to-r from-emerald-900 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400',
          iconBg: 'bg-gradient-to-br from-emerald-900 to-cyan-400',
          wave: 'from-emerald-500/15 via-teal-500/10 to-cyan-500/15',
          modalGradient: 'from-emerald-600/10 via-teal-600/8 to-cyan-600/10',
          accent: 'text-emerald-400',
          particle: 'bg-emerald-400/20',
          glow: 'shadow-emerald-500/20',
          neon: 'shadow-[0_0_40px_rgba(16,185,129,0.3)]',
          navbar: 'bg-gradient-to-r from-emerald-900/95 via-teal-900/95 to-cyan-900/95',
          glass: 'bg-emerald-400/15',
          border: 'border-emerald-400/20',
          text: 'text-emerald-50'
        }
      },
      'STUDENT': {
        light: {
          gradient: 'from-amber-900 via-orange-800 to-red-700',
          lightBg: 'bg-gradient-to-br from-amber-50/80 to-orange-100/60',
          badge: 'bg-gradient-to-r from-amber-500 to-orange-900 text-white',
          button: 'bg-gradient-to-r from-amber-900 to-orange-500 hover:from-amber-600 hover:to-orange-600',
          iconBg: 'bg-gradient-to-br from-amber-900 to-orange-500',
          wave: 'from-amber-400/30 via-orange-400/20 to-red-400/30',
          modalGradient: 'from-amber-500/20 via-orange-500/15 to-red-500/20',
          accent: 'text-amber-600',
          particle: 'bg-amber-400/40',
          glow: 'shadow-amber-500/25',
          neon: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
          navbar: 'bg-gradient-to-r from-amber-600/95 via-orange-600/95 to-red-600/95',
          glass: 'bg-amber-500/20',
          border: 'border-amber-500/30',
          text: 'text-amber-100'
        },
        dark: {
          gradient: 'from-amber-950 via-orange-900 to-red-900',
          lightBg: 'bg-gradient-to-br from-slate-900/80 to-amber-900/40',
          badge: 'bg-gradient-to-r from-amber-400 to-orange-900 text-white',
          button: 'bg-gradient-to-r from-amber-900 to-orange-500 hover:from-amber-400 hover:to-orange-400',
          iconBg: 'bg-gradient-to-br from-amber-900 to-orange-400',
          wave: 'from-amber-500/15 via-orange-500/10 to-red-500/15',
          modalGradient: 'from-amber-600/10 via-orange-600/8 to-red-600/10',
          accent: 'text-amber-600',
          particle: 'bg-amber-400/20',
          glow: 'shadow-amber-500/20',
          neon: 'shadow-[0_0_40px_rgba(245,158,11,0.3)]',
          navbar: 'bg-gradient-to-r from-amber-900/95 via-orange-900/95 to-red-900/95',
          glass: 'bg-amber-400/15',
          border: 'border-amber-400/20',
          text: 'text-amber-50'
        }
      }
    };

    const themeKey = isDark ? 'dark' : 'light';
    const roleConfig = baseConfigs[role as keyof typeof baseConfigs];
    
    if (roleConfig) {
      return roleConfig[themeKey];
    }

    // Default fallback
    return isDark ? {
      gradient: 'from-slate-950 via-gray-900 to-slate-900',
      lightBg: 'bg-gradient-to-br from-slate-900/80 to-gray-900/60',
      badge: 'bg-gradient-to-r from-slate-600 to-gray-600 text-slate-200',
      button: 'bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-500 hover:to-gray-500',
      iconBg: 'bg-gradient-to-br from-slate-600 to-gray-600',
      wave: 'from-slate-500/15 via-gray-500/10 to-slate-500/15',
      modalGradient: 'from-slate-600/10 via-gray-600/8 to-slate-600/10',
      accent: 'text-slate-400',
      particle: 'bg-slate-400/20',
      glow: 'shadow-slate-500/20',
      neon: 'shadow-[0_0_30px_rgba(100,116,139,0.3)]',
      navbar: 'bg-gradient-to-r from-slate-800/95 via-gray-800/95 to-slate-800/95',
      glass: 'bg-slate-400/10',
      border: 'border-slate-400/20',
      text: 'text-slate-200'
    } : {
      gradient: 'from-gray-900 via-gray-800 to-gray-700',
      lightBg: 'bg-gradient-to-br from-gray-50/80 to-slate-100/60',
      badge: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      button: 'bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600',
      iconBg: 'bg-gradient-to-br from-gray-500 to-slate-500',
      wave: 'from-gray-400/30 via-slate-400/20 to-gray-400/30',
      modalGradient: 'from-gray-400/20 via-slate-400/15 to-gray-400/20',
      accent: 'text-gray-600',
      particle: 'bg-gray-400/30',
      glow: 'shadow-gray-500/25',
      neon: 'shadow-[0_0_25px_rgba(100,116,139,0.3)]',
      navbar: 'bg-gradient-to-r from-gray-600/95 via-slate-600/95 to-gray-600/95',
      glass: 'bg-gray-400/15',
      border: 'border-gray-400/30',
      text: 'text-gray-100'
    };
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrator';
      case 'STAFF': return 'Staff Member';
      case 'STUDENT': return 'Student';
      default: return role;
    }
  };

 const getRoleIcon = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return Crown;
    case 'STAFF': return Users;
    case 'STUDENT': return GraduationCap;
    default: return User;
  }
};

  // Mock data for profile details - replace with actual data from your context/API
  const getProfileData = () => {
    const baseData = {
      id: user?.id || 0,
      name: user?.name || 'Unknown User',
      email: user?.email || 'No email',
      role: user?.role || 'STUDENT',
      rollNumber: user?.rollNumber,
      classId: user?.classId,
      departmentId: user?.departmentId,
      class: user?.class,
      department: user?.department
    };

    // Add mock department data for demonstration
    const departmentData = {
      id: 1,
      name: "Computer Science",
      description: "Department focused on computer science and information technology education",
      head: {
        id: 101,
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@college.edu"
      },
      studentCount: 450,
      staffCount: 25,
      classCount: 18
    };

    // Add mock managed classes for staff
    const managedClassesData = user?.role === 'STAFF' ? [
      { id: 1, name: "CS101 - Introduction to Programming", studentCount: 45 },
      { id: 2, name: "CS301 - Data Structures", studentCount: 38 },
      { id: 3, name: "CS401 - Algorithms", studentCount: 32 }
    ] : [];

    return {
      user: baseData,
      department: departmentData,
      managedClasses: managedClassesData
    };
  };

  const profileData = getProfileData();
  const config = getRoleConfig(user?.role || '');

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15
      }
    }
  };

  const staggerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const floatingVariants = {
    float: {
      y: [0, -15, 0],
      transition: {
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const slideInVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const scaleInVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.75,
      rotateX: 5,
      transition: { duration: 0.4 }
    },
    visible: { 
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      rotateX: -5,
      transition: { duration: 0.3 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const hologramVariants = {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%'],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  // Mobile menu variants
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

   const EnhancedProfileModal = () => {
    const { user: profileUser, department } = profileData;
    const RoleIcon = getRoleIcon(profileUser.role);

    return (
      <AnimatePresence>
        {showUserDetails && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          >
            {/* Enhanced Backdrop */}
            <motion.div
              variants={backdropVariants}
              className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
              onClick={() => setShowUserDetails(false)}
            />
            
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -100, 0],
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 15 + i * 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 2
                  }}
                  className={`absolute rounded-full ${
                    isDark ? 'bg-white/3' : 'bg-black/3'
                  } backdrop-blur-sm`}
                  style={{
                    width: Math.random() * 200 + 50,
                    height: Math.random() * 200 + 50,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Modal Content */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full max-w-6xl mx-auto rounded-3xl ${config.glow} backdrop-blur-2xl border ${
                isDark 
                  ? 'bg-slate-900/95 border-white/10' 
                  : 'bg-white/95 border-white/20'
              } overflow-hidden`}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Holographic Header */}
              <motion.div
                variants={hologramVariants}
                animate="animate"
                className={`px-8 py-6 border-b ${
                  isDark 
                    ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-white/5' 
                    : 'bg-gradient-to-r from-gray-50/80 to-blue-50/60 border-white/20'
                } relative overflow-hidden`}
                style={{
                  backgroundSize: '200% 200%',
                  backgroundImage: isDark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 75%, rgba(255,255,255,0.8) 100%)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`p-4 rounded-2xl ${config.iconBg} ${config.glow} backdrop-blur-sm`}
                    >
                      {React.createElement(RoleIcon, { className: "h-8 w-8 text-white" })}
                    </motion.div>
                    <div>
                      <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`text-2xl font-bold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        User Profile
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={isDark ? 'text-slate-300' : 'text-gray-600'}
                      >
                        Complete account information and statistics
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowUserDetails(false)}
                    className={`p-3 rounded-xl transition-all ${
                      isDark 
                        ? 'hover:bg-white/10 text-slate-300' 
                        : 'hover:bg-black/10 text-gray-500'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Modal Body */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Enhanced User Profile Section - Single Row */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className={`p-8 rounded-3xl border backdrop-blur-2xl relative overflow-hidden ${
                    isDark 
                      ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-white/10' 
                      : 'bg-gradient-to-br from-white/80 to-blue-50/60 border-white/20'
                  }`}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 opacity-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"
                    />
                  </div>

                  <div className="relative z-10 flex items-center gap-8">
                    {/* Enhanced Avatar with Ring Animation */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-lg"
                      />
                      <div className={`relative w-32 h-32 rounded-2xl flex items-center justify-center text-4xl font-bold ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-600 text-white' 
                          : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'
                      } shadow-2xl border-2 ${
                        isDark ? 'border-white/10' : 'border-white/50'
                      }`}>
                        {profileUser.name?.charAt(0)?.toUpperCase() || 'U'}
                        
                        {/* Animated Status Ring */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-green-400"
                        />
                      </div>
                      
                      {/* Online Status */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-2xl"
                      />
                    </motion.div>
                    
                    {/* User Information */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <motion.h2
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                          className={`text-4xl font-bold bg-gradient-to-r ${
                            isDark ? 'from-white to-slate-300' : 'from-gray-900 to-gray-700'
                          } bg-clip-text text-transparent`}
                        >
                          {profileUser.name}
                        </motion.h2>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-center gap-4 mt-2"
                        >
                          <span className={`flex items-center gap-2 text-lg ${
                            isDark ? 'text-slate-400' : 'text-gray-600'
                          }`}>
                            <Mail className="w-5 h-5" />
                            {profileUser.email}
                          </span>
                        </motion.div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${config.badge} backdrop-blur-sm`}
                        >
                          {getRoleDisplayName(profileUser.role)}
                        </motion.span>
                        
                        {profileUser.rollNumber && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`px-4 py-2 rounded-xl ${
                              isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                            } backdrop-blur-sm`}
                          >
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Roll Number
                            </p>
                            <p className="font-mono text-lg font-bold">
                              {profileUser.rollNumber}
                            </p>
                          </motion.div>
                        )}

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`px-4 py-2 rounded-xl ${
                            isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                          } backdrop-blur-sm`}
                        >
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            User ID
                          </p>
                          <p className="font-mono text-lg font-bold">
                            {profileUser.id}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Info Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="grid lg:grid-cols-2 gap-8"
                >
                  {/* Department Details Card */}
                  {department && (
                    <motion.div
                      whileHover={{ 
                        scale: 1.02, 
                        y: -5,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                      className={`p-8 rounded-3xl border backdrop-blur-2xl relative overflow-hidden group ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-white/10' 
                          : 'bg-gradient-to-br from-white/80 to-blue-50/60 border-white/20'
                      }`}
                    >
                      {/* Animated Background */}
                      <div className="absolute inset-0 opacity-5">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500"
                        />
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 360 }}
                            className={`p-4 rounded-2xl ${
                              isDark 
                                ? 'bg-green-500/20 border border-green-500/30' 
                                : 'bg-green-100 border border-green-200'
                            } backdrop-blur-sm`}
                          >
                            <Building2 className="w-8 h-8" />
                          </motion.div>
                          <div>
                            <h4 className={`font-bold text-2xl ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              Department Details
                            </h4>
                            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                              Academic department information
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className={`p-6 rounded-2xl ${
                            isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                          } backdrop-blur-sm`}>
                            <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                              Department Name
                            </p>
                            <p className={`text-2xl font-bold mt-2 ${
                              isDark ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {department.name}
                            </p>
                          </div>
                          
                          {department.description && (
                            <div className={`p-6 rounded-2xl ${
                              isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                            } backdrop-blur-sm`}>
                              <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                                Description
                              </p>
                              <p className="text-lg mt-2 text-gray-600 dark:text-gray-400">
                                {department.description}
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-3 gap-4">
                            {department.studentCount !== undefined && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`text-center p-4 rounded-2xl ${
                                  isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                                } backdrop-blur-sm`}
                              >
                                <p className="text-3xl font-bold text-green-500">{department.studentCount}</p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Students</p>
                              </motion.div>
                            )}
                            
                            {department.staffCount !== undefined && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`text-center p-4 rounded-2xl ${
                                  isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                                } backdrop-blur-sm`}
                              >
                                <p className="text-3xl font-bold text-blue-500">{department.staffCount}</p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Staff</p>
                              </motion.div>
                            )}
                            
                            {department.classCount !== undefined && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`text-center p-4 rounded-2xl ${
                                  isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                                } backdrop-blur-sm`}
                              >
                                <p className="text-3xl font-bold text-purple-500">{department.classCount}</p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Classes</p>
                              </motion.div>
                            )}
                          </div>

                          {department.head && (
                            <div className={`p-6 rounded-2xl ${
                              isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                            } backdrop-blur-sm`}>
                              <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                                Department Head
                              </p>
                              <p className="text-xl font-semibold mt-2 text-gray-600 dark:text-gray-400">
                                {department.head.name}
                              </p>
                              <p className="text-lg text-gray-500">{department.head.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* System Statistics Card */}
                  <motion.div
                    whileHover={{ 
                      scale: 1.02, 
                      y: -5,
                      transition: { type: "spring", stiffness: 300 }
                    }}
                    className={`p-8 rounded-3xl border backdrop-blur-2xl relative overflow-hidden group ${
                      isDark 
                        ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-white/10' 
                        : 'bg-gradient-to-br from-white/80 to-blue-50/60 border-white/20'
                    }`}
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-5">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          className={`p-4 rounded-2xl ${
                            isDark 
                              ? 'bg-purple-500/20 border border-purple-500/30' 
                              : 'bg-purple-100 border border-purple-200'
                          } backdrop-blur-sm`}
                        >
                          <BarChart3 className="w-8 h-8" />
                        </motion.div>
                        <div>
                          <h4 className={`font-bold text-2xl ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            System Analytics
                          </h4>
                          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                            Platform performance metrics
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`p-6 rounded-2xl text-center ${
                            isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                          } backdrop-blur-sm`}
                        >
                          <p className="text-4xl font-bold text-green-500">98%</p>
                          <p className="text-lg font-medium mt-2 text-gray-600 dark:text-gray-400">Attendance Rate</p>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`p-6 rounded-2xl text-center ${
                            isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                          } backdrop-blur-sm`}
                        >
                          <p className="text-4xl font-bold text-blue-500">24/7</p>
                          <p className="text-lg font-medium mt-2 text-gray-600 dark:text-gray-400">System Uptime</p>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`p-6 rounded-2xl text-center ${
                            isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                          } backdrop-blur-sm`}
                        >
                          <p className="text-4xl font-bold text-purple-500">99.9%</p>
                          <p className="text-lg font-medium mt-2 text-gray-600 dark:text-gray-400">Reliability</p>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`p-6 rounded-2xl text-center ${
                            isDark ? 'bg-slate-700/50' : 'bg-gray-100/50'
                          } backdrop-blur-sm`}
                        >
                          <p className="text-4xl font-bold text-orange-500">1.2s</p>
                          <p className="text-lg font-medium mt-2 text-gray-600 dark:text-gray-400">Avg Response</p>
                        </motion.div>
                      </div>

                      {/* Additional Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Platform Health</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">All systems operational</p>
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-4 h-4 bg-green-500 rounded-full"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="flex gap-4 pt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserDetails(false)}
                    className={`flex-1 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700 text-white hover:bg-slate-600' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } backdrop-blur-sm`}
                  >
                    Close Panel
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <LayoutContext.Provider value={{ setShowUserDetails }}>
            <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="min-h-screen relative overflow-x-hidden" 
        onMouseMove={handleMouseMove}
        style={{
          background: isDark 
            ? 'radial-gradient(ellipse at top, #1e293b, #0f172a), radial-gradient(ellipse at bottom, #334155, #0f172a)'
            : 'radial-gradient(ellipse at top, #f8fafc, #e2e8f0), radial-gradient(ellipse at bottom, #cbd5e1, #f1f5f9)'
        }}
      >
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated Gradient Mesh */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 left-0 w-full h-full opacity-30"
            style={{
              background: isDark
                ? `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
                   radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)`
                : `radial-gradient(circle at 20% 80%, rgba(167, 139, 250, 0.2) 0%, transparent 50%),
                   radial-gradient(circle at 80% 20%, rgba(253, 186, 116, 0.15) 0%, transparent 50%),
                   radial-gradient(circle at 40% 40%, rgba(110, 231, 183, 0.15) 0%, transparent 50%)`
            }}
          />

          {/* Floating Geometric Shapes */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              variants={floatingVariants}
              animate="float"
              className={`absolute rounded-lg ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              } backdrop-blur-sm border ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}
              style={{
                width: Math.random() * 120 + 40,
                height: Math.random() * 120 + 40,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                rotate: Math.random() * 360,
              }}
            />
          ))}

          {/* Animated Grid */}
          <motion.div
            animate={{
              backgroundPosition: ['0px 0px', '80px 80px'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className={`absolute inset-0 opacity-30 ${
              isDark
                ? 'bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:80px_80px]'
                : 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:80px_80px]'
            }`}
          />

          {/* Pulse Orbs */}
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${
              isDark ? 'bg-purple-600/20' : 'bg-purple-400/20'
            }`}
          />
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            transition={{ delay: 1 }}
            className={`absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl ${
              isDark ? 'bg-blue-600/15' : 'bg-blue-400/15'
            }`}
          />
        </div>

        {/* NEW ENHANCED NAVBAR DESIGN */}
        <motion.header
          ref={headerRef}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 20,
            duration: 0.8 
          }}
          className={`relative ${config.navbar} backdrop-blur-2xl sticky top-0 z-50 transition-all duration-500 ${
            isScrolled ? 'py-3 shadow-2xl' : 'py-4'
          }`}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className={`w-full h-full ${
              isDark
                ? 'bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:20px_20px]'
                : 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.2)_1px,transparent_0)] bg-[size:20px_20px]'
            }`} />
          </div>

          {/* Animated Border Bottom */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />

          <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Logo Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4"
              >
                {/* Enhanced Logo Container */}
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    rotate: [0, -5, 0],
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative p-3 rounded-2xl ${config.glass} backdrop-blur-lg border ${config.border} group overflow-hidden`}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                  <BarChart3 className="h-6 w-6 text-white relative z-10" />
                </motion.div>

                {/* Title */}
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    College ERP System
                  </h1>
                  <p className="text-white/70 text-xs font-medium">
                    Intelligent Platform
                  </p>
                </div>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl ${config.glass} backdrop-blur-lg border ${config.border} text-white`}
              >
                <Menu className="h-5 w-5" />
              </motion.button>

              {/* Desktop Navigation */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="hidden lg:flex items-center gap-6"
              >
                {/* User Profile */}
                <motion.div
                  whileHover="hover"
                  className={`flex items-center gap-3 ${
                    user?.role === 'SUPER_ADMIN' ? 'cursor-pointer group' : 'cursor-default'
                  }`}
                  onClick={() => user?.role === 'SUPER_ADMIN' && setShowUserDetails(true)}
                  onHoverStart={() => user?.role === 'SUPER_ADMIN' && setActiveHover('profile')}
                  onHoverEnd={() => user?.role === 'SUPER_ADMIN' && setActiveHover(null)}
                >
                  <motion.div
                    variants={{
                      hover: { 
                        scale: 1.1,
                        rotate: 5,
                      }
                    }}
                    className="relative"
                  >
                    <div className={`p-2 rounded-xl ${config.glass} backdrop-blur-lg border ${config.border} ${
                      user?.role === 'SUPER_ADMIN' ? 'group-hover:border-white/50 transition-all duration-300' : ''
                    }`}>
                      {React.createElement(getRoleIcon(user?.role || ''), { className: "h-4 w-4 text-white" })}
                    </div>
                    
                    {/* Active Indicator - Only for SUPER_ADMIN */}
                    {user?.role === 'SUPER_ADMIN' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: activeHover === 'profile' ? 1 : 0 }}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"
                      />
                    )}
                  </motion.div>
                  
                  <div className="text-left">
                    <p className="font-semibold text-white text-sm">
                      {user?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${config.badge} backdrop-blur-sm`}>
                        {getRoleDisplayName(user?.role || '')}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Theme Toggle */}
                  <motion.button
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 180,
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className={`p-2 rounded-xl ${config.glass} backdrop-blur-lg border ${config.border} text-white transition-all duration-300`}
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </motion.button>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ 
                      scale: 1.05,
                      x: 2,
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white ${config.button} backdrop-blur-lg border ${config.border} transition-all duration-300 group`}
                  >
                    <motion.div
                      animate={{ x: [0, 2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <LogOut className="h-4 w-4" />
                    </motion.div>
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  variants={mobileMenuVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className={`lg:hidden mt-4 p-4 rounded-2xl ${config.glass} backdrop-blur-2xl border ${config.border} overflow-hidden`}
                >
                  {/* User Info */}
                  <motion.div
                    variants={staggerVariants}
                    className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
                  >
                    <div className={`p-2 rounded-xl ${config.glass} border ${config.border}`}>
                      {React.createElement(getRoleIcon(user?.role || ''), { className: "h-4 w-4 text-white" })}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{user?.name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${config.badge}`}>
                        {getRoleDisplayName(user?.role || '')}
                      </span>
                    </div>
                  </motion.div>

                  {/* Mobile Actions */}
                  <motion.div
                    variants={staggerVariants}
                    className="flex flex-col gap-2"
                  >
                    <motion.button
                      variants={staggerVariants}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleTheme}
                      className={`flex items-center gap-3 p-3 rounded-xl text-white ${config.glass} backdrop-blur-lg border ${config.border} transition-all duration-300`}
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      <span className="text-sm font-medium">
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                      </span>
                    </motion.button>

                    {user?.role === 'SUPER_ADMIN' && (
                      <motion.button
                        variants={staggerVariants}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowUserDetails(true)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-white ${config.glass} backdrop-blur-lg border ${config.border} transition-all duration-300`}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Profile</span>
                      </motion.button>
                    )}

                    <motion.button
                      variants={staggerVariants}
                      whileTap={{ scale: 0.95 }}
                      onClick={logout}
                      className={`flex items-center gap-3 p-3 rounded-xl text-white ${config.button} backdrop-blur-lg border ${config.border} transition-all duration-300`}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.7, 
              delay: 0.7,
              type: "spring",
              stiffness: 100
            }}
            className={`rounded-3xl ${config.lightBg} ${config.glow} backdrop-blur-xl border ${
              isDark 
                ? 'border-white/10 shadow-2xl' 
                : 'border-white/50 shadow-2xl'
            } overflow-hidden`}
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <motion.div
                animate={{ 
                  backgroundPosition: ['0px 0px', '100px 100px'] 
                }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className={`w-full h-full ${
                  isDark
                    ? 'bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0)] bg-[size:40px_40px]'
                    : 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[size:40px_40px]'
                }`}
              />
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="relative p-8"
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.main>

        {/* Render Enhanced Profile Modal */}
        <EnhancedProfileModal />
      </motion.div>
    </LayoutContext.Provider>
  );
}