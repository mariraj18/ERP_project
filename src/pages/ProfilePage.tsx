import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  CreditCard, 
  Building2, 
  Users, 
  GraduationCap, 
  MapPin, 
  Shield, 
  Crown,
  BookOpen,
  Calendar,
  Award,
  ArrowLeft,
  Edit,
  Phone,
  MapPinIcon,
  Clock,
  UserCheck,
  Settings,
  Star,
  Activity,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useRoleTheme } from '../hooks/useRoleTheme';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'STAFF' | 'SUPER_ADMIN';
  rollNumber?: string;
  parentEmail?: string;
  classId?: number;
  departmentId?: number;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  class?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
    description?: string;
    head?: {
      id: number;
      name: string;
      email: string;
    };
    studentCount?: number;
    staffCount?: number;
    classCount?: number;
  };
  managedClasses?: Array<{
    id: number;
    name: string;
    studentCount: number;
  }>;
  assignedClasses?: Array<{
    id: number;
    name: string;
    studentCount?: number;
  }>;
  stats?: {
    attendance?: number;
    performance?: number;
    messages?: number;
  };
}

const ProfilePage: React.FC = () => {
  const { userId, userType } = useParams<{ userId: string; userType: 'student' | 'staff' }>();
  const navigate = useNavigate();
  const { getRoleCardClass, isDark } = useRoleTheme();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStat, setActiveStat] = useState(0);

  useEffect(() => {
    if (userId && userType) {
      loadProfile();
    }
  }, [userId, userType, currentUser]);

  // Auto-rotate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      if (userType === 'student') {
        endpoint = `/users/students/${userId}/profile`;
      } else if (userType === 'staff') {
        endpoint = `/users/staff/${userId}/profile`;
      }

      const response = await api.get(endpoint);
      setProfile(response.data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return Crown;
      case 'STAFF': return Shield;
      case 'STUDENT': return GraduationCap;
      default: return User;
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': 
        return 'from-violet-600 via-purple-600 to-fuchsia-600';
      case 'STAFF': 
        return 'from-emerald-600 via-teal-600 to-cyan-600';
      case 'STUDENT': 
        return 'from-amber-600 via-orange-500 to-red-500';
      default: 
        return 'from-gray-600 via-gray-700 to-gray-800';
    }
  };

  const getRoleLightGradient = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': 
        return 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20';
      case 'STAFF': 
        return 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20';
      case 'STUDENT': 
        return 'from-amber-500/20 via-orange-500/20 to-red-500/20';
      default: 
        return 'from-gray-500/20 via-gray-600/20 to-gray-700/20';
    }
  };

  const getRoleGlow = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'shadow-2xl shadow-violet-500/30';
      case 'STAFF': return 'shadow-2xl shadow-emerald-500/30';
      case 'STUDENT': return 'shadow-2xl shadow-amber-500/30';
      default: return 'shadow-2xl shadow-gray-500/30';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrator';
      case 'STAFF': return 'Staff Member';
      case 'STUDENT': return 'Student';
      default: return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.92, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "backOut"
      }
    },
    hover: {
      scale: 1.03,
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const statVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "backOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: -10,
      transition: {
        duration: 0.3
      }
    }
  };

  const floatingAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
          className="relative"
        >
          <div className="w-20 h-20 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full" />
          <motion.div
            animate={floatingAnimation}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-transparent border-t-amber-500 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (error || !profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          <motion.div
            animate={floatingAnimation}
            className="text-6xl mb-6"
          >
            😔
          </motion.div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Profile Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {error || 'The requested profile could not be found. Please check the URL and try again.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Return to Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const RoleIcon = getRoleIcon(profile.role);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Navigation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ x: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 mb-6 group"
          >
            <motion.div
              whileHover={{ x: -3 }}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:text-violet-500 transition-colors" />
              <span className="font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Back to Dashboard
              </span>
            </motion.div>
          </motion.button>
          
          <div className="flex items-center justify-between">
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent"
            >
              Profile Overview
            </motion.h1>
          </div>
        </motion.div>

        {/* Enhanced Profile Header Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className={`relative rounded-3xl shadow-2xl overflow-hidden mb-8 ${getRoleGlow(profile.role)} border border-white/20`}
        >
          {/* Animated Background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${getRoleGradient(profile.role)}`}>
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent bg-[length:200%_200%]"
            />
            {/* Floating particles */}
            <motion.div
              animate={floatingAnimation}
              className="absolute top-4 right-4 w-3 h-3 bg-white/30 rounded-full"
            />
            <motion.div
              animate={{
                ...floatingAnimation,
                y: [0, -12, 0],
                transition: { ...floatingAnimation.transition, delay: 1 }
              }}
              className="absolute bottom-6 left-6 w-2 h-2 bg-white/40 rounded-full"
            />
          </div>
          
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <motion.div
                  whileHover={{ 
                    scale: 1.15,
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    rotate: { duration: 0.3 }
                  }}
                  className="bg-white/20 p-5 rounded-3xl backdrop-blur-xl border border-white/30 shadow-2xl"
                >
                  <RoleIcon className="h-16 w-16" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl font-bold mb-3 text-white drop-shadow-2xl"
                  >
                    {profile.name}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-white/90 mb-4 flex items-center space-x-3"
                  >
                    <span>{getRoleLabel(profile.role)}</span>
                    <motion.span
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="text-2xl"
                    >
                      {profile.role === 'SUPER_ADMIN' && '👑'}
                      {profile.role === 'STAFF' && '🛡️'}
                      {profile.role === 'STUDENT' && '🎓'}
                    </motion.span>
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center space-x-4"
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, y: -2 }}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-semibold backdrop-blur-sm border-2 ${
                        profile.isActive 
                          ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50 shadow-lg shadow-emerald-500/25' 
                          : 'bg-red-500/30 text-red-100 border-red-400/50 shadow-lg shadow-red-500/25'
                      }`}
                    >
                      {profile.isActive ? '🟢 Active Account' : '🔴 Account Inactive'}
                    </motion.span>
                    {profile.lastLogin && (
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="text-white/90 text-sm bg-black/30 px-4 py-2.5 rounded-2xl border border-white/25 backdrop-blur-sm"
                      >
                        📅 Last login: {formatDateTime(profile.lastLogin)}
                      </motion.span>
                    )}
                  </motion.div>
                </div>
              </div>
              
              {/* Enhanced Animated Stats */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-right"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStat}
                    variants={statVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/25 shadow-2xl min-w-[140px]"
                  >
                    {activeStat === 0 && (
                      <div className="text-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-3xl mb-2"
                        >
                          ⚡
                        </motion.div>
                        <div className="text-lg font-bold">Active</div>
                        <div className="text-sm opacity-90">Status</div>
                      </div>
                    )}
                    {activeStat === 1 && profile.stats?.attendance && (
                      <div className="text-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-2xl font-bold mb-2"
                        >
                          {profile.stats.attendance}%
                        </motion.div>
                        <div className="text-lg font-semibold">Attendance</div>
                        <div className="text-sm opacity-90">Rate</div>
                      </div>
                    )}
                    {activeStat === 2 && (
                      <div className="text-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-3xl mb-2"
                        >
                          {profile.role === 'STUDENT' ? '🎓' : profile.role === 'STAFF' ? '👨‍🏫' : '⚡'}
                        </motion.div>
                        <div className="text-lg font-semibold">
                          {profile.role === 'STUDENT' ? 'Student' : profile.role === 'STAFF' ? 'Staff' : 'Admin'}
                        </div>
                        <div className="text-sm opacity-90">Role</div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Enhanced Personal Information Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className={`relative rounded-3xl p-7 shadow-2xl border-2 backdrop-blur-xl overflow-hidden ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/50' 
                : 'bg-white/90 border-white/40'
            }`}
          >
            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getRoleLightGradient(profile.role)}`} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
            
            <div className="relative">
              <motion.h3
                whileHover={{ x: 5 }}
                className="text-2xl font-bold flex items-center mb-8 text-gray-800 dark:text-white"
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg mr-4"
                >
                  <User className="h-6 w-6 text-white" />
                </motion.div>
                Personal Information
              </motion.h3>
              
              <div className="space-y-5">
                <motion.div
                  whileHover={{ x: 6, scale: 1.02 }}
                  className="flex items-center p-5 rounded-2xl transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                >
                  <Mail className="h-7 w-7 mr-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Email Address</p>
                    <p className="text-gray-800 dark:text-white font-medium">{profile.email}</p>
                  </div>
                </motion.div>
                
                {profile.rollNumber && (
                  <motion.div
                    whileHover={{ x: 6, scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                  >
                    <CreditCard className="h-7 w-7 mr-4 text-emerald-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Roll Number</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profile.rollNumber}</p>
                    </div>
                  </motion.div>
                )}

                {profile.parentEmail && (
                  <motion.div
                    whileHover={{ x: 6, scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                  >
                    <UserCheck className="h-7 w-7 mr-4 text-violet-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Parent Email</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profile.parentEmail}</p>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ x: 6, scale: 1.02 }}
                  className="flex items-center p-5 rounded-2xl transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                >
                  <Calendar className="h-7 w-7 mr-4 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Member Since</p>
                    <p className="text-gray-800 dark:text-white font-medium">{formatDate(profile.createdAt)}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Academic Information Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className={`relative rounded-3xl p-7 shadow-2xl border-2 backdrop-blur-xl overflow-hidden ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/50' 
                : 'bg-white/90 border-white/40'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-teal-500/15" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-400/10 to-transparent rounded-full transform -translate-x-20 translate-y-20" />
            
            <div className="relative">
              <motion.h3
                whileHover={{ x: 5 }}
                className="text-2xl font-bold flex items-center mb-8 text-gray-800 dark:text-white"
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg mr-4"
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </motion.div>
                Academic Information
              </motion.h3>
              
              <div className="space-y-5">
                {profile.class && (
                  <motion.div
                    whileHover={{ x: 6, scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                  >
                    <Users className="h-7 w-7 mr-4 text-emerald-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Class</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profile.class.name}</p>
                    </div>
                  </motion.div>
                )}
                
                {profile.department && (
                  <motion.div
                    whileHover={{ x: 6, scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/50 dark:border-slate-600/50"
                  >
                    <Building2 className="h-7 w-7 mr-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Department</p>
                      <p className="text-gray-800 dark:text-white font-medium">{profile.department.name}</p>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Assigned Classes for Staff */}
                {profile.assignedClasses && profile.assignedClasses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center mb-4">
                      <BookOpen className="h-6 w-6 mr-3 text-violet-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Assigned Classes</p>
                    </div>
                    <div className="space-y-3">
                      {profile.assignedClasses.map((cls, index) => (
                        <motion.div
                          key={cls.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ scale: 1.03, x: 4 }}
                          className={`p-4 rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
                            isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-gradient-to-r from-violet-50/80 to-purple-50/80 border-violet-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="text-gray-800 dark:text-white font-semibold">{cls.name}</p>
                            {cls.studentCount && (
                              <motion.span
                                whileHover={{ scale: 1.1 }}
                                className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                                  isDark 
                                    ? 'bg-violet-800 text-violet-200' 
                                    : 'bg-violet-100 text-violet-700'
                                }`}
                              >
                                👥 {cls.studentCount}
                              </motion.span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Enhanced Department Details Card */}
          {profile.department && (
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className={`relative rounded-3xl p-7 shadow-2xl border-2 backdrop-blur-xl overflow-hidden ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700/50' 
                  : 'bg-white/90 border-white/40'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 to-purple-500/15" />
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-full transform -translate-x-12 -translate-y-12" />
              
              <div className="relative">
                <motion.h3
                  whileHover={{ x: 5 }}
                  className="text-2xl font-bold flex items-center mb-8 text-gray-800 dark:text-white"
                >
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg mr-4"
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </motion.div>
                  Department Details
                </motion.h3>
                
                <div className="space-y-5">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-5 rounded-2xl backdrop-blur-sm border ${
                      isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-indigo-200'
                    }`}
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">Description</p>
                    <p className="text-gray-800 dark:text-white">
                      {profile.department.description || 'No description available'}
                    </p>
                  </motion.div>

                  {profile.department.head && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`p-5 rounded-2xl backdrop-blur-sm border ${
                        isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border-blue-200'
                      }`}
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">Department Head</p>
                      <p className="text-gray-800 dark:text-white font-semibold text-lg">{profile.department.head.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.department.head.email}</p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-300/50 dark:border-slate-600/50"
                  >
                    {profile.department.studentCount !== undefined && (
                      <motion.div
                        whileHover={{ scale: 1.08, y: -4 }}
                        className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-300/30 dark:border-emerald-600/30 backdrop-blur-sm"
                      >
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{profile.department.studentCount}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">🎓 Students</p>
                      </motion.div>
                    )}
                    
                    {profile.department.staffCount !== undefined && (
                      <motion.div
                        whileHover={{ scale: 1.08, y: -4 }}
                        className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-300/30 dark:border-blue-600/30 backdrop-blur-sm"
                      >
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{profile.department.staffCount}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">👨‍🏫 Staff</p>
                      </motion.div>
                    )}
                    
                    {profile.department.classCount !== undefined && (
                      <motion.div
                        whileHover={{ scale: 1.08, y: -4 }}
                        className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-300/30 dark:border-purple-600/30 backdrop-blur-sm"
                      >
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{profile.department.classCount}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">📚 Classes</p>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Managed Classes Section */}
        {profile.managedClasses && profile.managedClasses.length > 0 && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`relative rounded-3xl p-7 shadow-2xl border-2 backdrop-blur-xl mt-6 overflow-hidden ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/50' 
                : 'bg-white/90 border-white/40'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-full transform translate-x-20 -translate-y-20" />
            
            <div className="relative">
              <motion.h3
                whileHover={{ x: 5 }}
                className="text-2xl font-bold flex items-center mb-8 text-gray-800 dark:text-white"
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg mr-4"
                >
                  <BookOpen className="h-6 w-6 text-white" />
                </motion.div>
                Managed Classes
              </motion.h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {profile.managedClasses.map((classInfo, index) => (
                  <motion.div
                    key={classInfo.id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -6,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm ${
                      isDark 
                        ? 'bg-slate-700/60 border-emerald-500/40 hover:border-emerald-400/60 hover:bg-slate-700/80' 
                        : 'bg-gradient-to-br from-white to-emerald-50/80 border-emerald-300 hover:border-emerald-400 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-gray-800 dark:text-white">{classInfo.name}</h4>
                      <motion.span
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className={`text-sm px-3 py-1.5 rounded-full font-bold shadow-lg ${
                          isDark 
                            ? 'bg-emerald-800 text-emerald-200' 
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                        }`}
                      >
                        {classInfo.studentCount} 👥
                      </motion.span>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 1 + index * 0.1, duration: 1 }}
                      className={`h-2 rounded-full ${
                        isDark ? 'bg-emerald-900/50' : 'bg-emerald-200'
                      }`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min((classInfo.studentCount / 50) * 100, 100)}%` 
                        }}
                        transition={{ delay: 1.2 + index * 0.1, duration: 1.5, ease: "backOut" }}
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
                      />
                    </motion.div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-medium">
                      Capacity: {classInfo.studentCount}/50 students
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ProfilePage;