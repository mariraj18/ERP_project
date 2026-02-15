import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, TrendingUp, Download, FileText, CheckCircle, User, BarChart3, Bell, BookOpen, Clock, Eye, EyeOff, Award, Shield, Users, MessageSquare, Crown, PieChart, Activity, Target, RefreshCcw, LucideRefreshCcwDot, Building2, X } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useRoleTheme } from '../hooks/useRoleTheme';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string;
  staff: {
    name: string;
  };
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

interface Message {
  id: number;
  content: string;
  fileName: string | null;
  filePath: string | null;
  isRead: boolean;
  messageType?: 'INDIVIDUAL' | 'CLASS' | 'ALL_STUDENTS';
  isAnnouncement?: boolean;
  staff: {
    name: string;
    role?: 'STAFF' | 'SUPER_ADMIN';
  };
  class?: {
    name: string;
  } | null;
  createdAt: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getRoleCardClass, getRoleTabClass, getRoleColors, isDark } = useRoleTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'messages'>('overview');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    percentage: 0
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [userDepartment, setUserDepartment] = useState<any>(null);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePagination, setAttendancePagination] = useState<any>(null);
  const attendancePageSize = 8;
  
  // New messaging system state
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageForm, setMessageForm] = useState({
    staffId: '',
    content: '',
    messageType: 'question',
    file: null as File | null
  });
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [staffReplies, setStaffReplies] = useState<any[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    loadAttendance();
    loadMessages();
    loadUserDepartment();
    loadAssignedStaff();
    loadSentMessages();
  }, []);

  const loadUserDepartment = async () => {
    try {
      console.log('Loading user department for user:', user);
      if (user?.departmentId) {
        console.log('Making API call for department ID:', user.departmentId);
        try {
          const response = await api.get(`/departments/${user.departmentId}`);
          console.log('Department API response:', response.data);
          setUserDepartment(response.data);
        } catch (departmentError: any) {
          // Handle 403 or other permission errors gracefully
          if (departmentError.response?.status === 403) {
            console.log('No permission to access department details, using basic info');
            // Set basic department info from user data if available
            setUserDepartment({
              id: user.departmentId,
              name: user.department?.name || 'Department',
              description: 'Department information not available'
            });
          } else {
            throw departmentError;
          }
        }
      } else {
        console.log('No departmentId found for user:', user);
      }
    } catch (error) {
      console.error('Failed to load user department:', error);
      setUserDepartment(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendance(attendancePage);
    } else if (activeTab === 'messages') {
      loadMessages();
    }
  }, [activeTab]);
  
  // Reset page when switching to attendance tab
  useEffect(() => {
    if (activeTab === 'attendance') {
      setAttendancePage(1);
    }
  }, [activeTab]);

  const loadAttendance = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/my-attendance?page=${page}&pageSize=${attendancePageSize}`);
      setAttendance(response.data.attendance);
      setAttendanceSummary(response.data.summary);
      setAttendancePagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance([]);
      setAttendanceSummary({ totalDays: 0, presentDays: 0, absentDays: 0, percentage: 0 });
      setAttendancePagination(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/received');
      
      // Handle different response structures
      let messagesData = [];
      if (Array.isArray(response.data)) {
        messagesData = response.data;
      } else if (response.data && Array.isArray(response.data.messages)) {
        messagesData = response.data.messages;
      } else if (response.data && Array.isArray(response.data.rows)) {
        messagesData = response.data.rows;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find an array property in the response
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          messagesData = possibleArrays[0] as Message[];
        }
      }
      
      setMessages(messagesData || []);
      const unreadMessages = (messagesData || []).filter((msg: Message) => !msg.isRead);
      setHasNewMessages(unreadMessages.length > 0);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
      setHasNewMessages(false);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await api.put(`/messages/${messageId}/read`);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const loadAssignedStaff = async () => {
    try {
      const response = await api.get('/messages/assigned-staff');
      setAssignedStaff(response.data.assignedStaff || []);
    } catch (error) {
      console.error('Failed to load assigned staff:', error);
      setAssignedStaff([]);
    }
  };

  const loadSentMessages = async () => {
    try {
      const response = await api.get('/messages/sent-to-staff');
      setSentMessages(response.data.rows || []);
    } catch (error) {
      console.error('Failed to load sent messages:', error);
      setSentMessages([]);
    }
  };

  const sendMessageToStaff = async () => {
    if (!messageForm.staffId || !messageForm.content.trim()) {
      alert('Please select a staff member and enter a message');
      return;
    }

    try {
      setMessageLoading(true);
      
      const formData = new FormData();
      formData.append('staffId', messageForm.staffId);
      formData.append('content', messageForm.content);
      formData.append('messageType', messageForm.messageType);
      
      if (messageForm.file) {
        formData.append('file', messageForm.file);
      }

      await api.post('/messages/student-to-staff', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form and refresh data
      setMessageForm({
        staffId: '',
        content: '',
        messageType: 'question',
        file: null
      });
      setShowMessageForm(false);
      await loadSentMessages();
      
      alert('Message sent successfully!');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  const downloadFile = async (messageId: number, fileName: string) => {
    try {
      const response = await api.get(`/messages/download/${messageId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAttendanceBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (percentage >= 70) return 'bg-gradient-to-r from-amber-500 to-amber-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getAttendanceStatusColor = (status: string) => {
    return status === 'PRESENT' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  // Helper variables and functions for messages tab


  const getMessageLabel = (message: Message) => {
    if (message.isAnnouncement) {
      return { 
        text: 'ANNOUNCEMENT', 
        color: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
        icon: Bell
      };
    }

    switch (message.messageType) {
      case 'ALL_STUDENTS':
        return { 
          text: 'ANNOUNCEMENT', 
          color: 'bg-gradient-to-r from-red-500 to-red-800 text-white',
          icon: Bell
        };
      case 'CLASS':
        return { 
          text: message.class?.name || 'CLASS MESSAGE', 
          color: 'bg-gradient-to-r from-indigo-500 to-indigo-800 text-white',
          icon: Users
        };
      case 'INDIVIDUAL':
        return { 
          text: 'PERSONAL', 
          color: 'bg-gradient-to-r from-emerald-500 to-emerald-800 text-white',
          icon: MessageSquare
        };
      default:
        return { 
          text: 'MESSAGE', 
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
          icon: MessageSquare
        };
    }
  };

  const getSenderInfo = (message: Message) => {
    const isAdmin = message.staff?.role === 'SUPER_ADMIN';
    return {
      icon: isAdmin ? Crown : Shield,
      label: isAdmin ? 'Super Admin' : 'Staff',
      color: isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400',
      bgColor: isAdmin ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
    };
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  // Enhanced dark mode classes
  const darkCardClass = isDark ? 'dark:bg-slate-800/50 dark:border-slate-700' : '';
  const darkTextClass = isDark ? 'dark:text-white' : '';
  const darkSubtextClass = isDark ? 'dark:text-slate-300' : '';
  const darkBgClass = isDark ? 'dark:bg-slate-900' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`min-h-screen w-full ${darkBgClass}`}
    >
      {/* Header */}
      {/* Header - Responsive */}
<motion.div
  initial={{ y: -50, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.6 }}
  className={`text-white p-4 sm:p-6 rounded-t-2xl shadow-2xl w-full transition-all duration-300 ${
    isDark 
      ? 'bg-gradient-to-r from-amber-800 to-slate-800' 
      : 'bg-gradient-to-r from-amber-800 to-amber-920'
  }`}
>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full max-w-[95rem] mx-auto">
    <div className="flex items-center w-full sm:w-auto">
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-amber-700 p-2 sm:p-3 rounded-xl sm:rounded-2xl mr-3 sm:mr-4 shadow-lg cursor-pointer flex-shrink-0"
        onClick={() => navigate(`/profile/student/${user?.id}`)}
      >
        <User className="h-6 w-6 sm:h-8 sm:w-8" />
      </motion.div>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/profile/student/${user?.id}`)}>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl sm:text-2xl lg:text-3xl font-bold hover:text-amber-100 transition-colors truncate"
        >
          Student Portal {user?.class?.name ? `- ${user.class.name}` : ''}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs sm:text-sm lg:text-base text-amber-100 truncate"
        >
          {userDepartment?.name || 'Department: Not assigned'} • View your attendance
        </motion.p>
      </div>
    </div>
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center bg-amber-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl backdrop-blur-sm shadow-lg"
      >
        <Calendar className="h-4 w-4 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
        <span className="text-xs sm:text-sm lg:text-base font-semibold">{new Date().toLocaleDateString()}</span>
      </motion.div>
    </div>
  </div>
</motion.div>

      {/* Enhanced Analytics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 w-full max-w-[95rem] mx-auto space-y-6"
      >
        {/* Primary Stats Row */}
        {/* Primary Stats Row - Responsive */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
  {[
    { 
      label: 'Total Classes', 
      value: attendanceSummary.totalDays, 
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: isDark ? 'from-blue-900/20 to-blue-800/20' : 'from-blue-50 to-blue-100',
      icon: Calendar,
      change: 'This semester',
      trend: 'neutral'
    },
    { 
      label: 'Present Days', 
      value: attendanceSummary.presentDays, 
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: isDark ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100',
      icon: CheckCircle,
      change: 'Good attendance',
      trend: 'up'
    },
    { 
      label: 'Absent Days', 
      value: attendanceSummary.absentDays, 
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      bgGradient: isDark ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100',
      icon: Clock,
      change: attendanceSummary.absentDays > 5 ? 'High' : 'Normal',
      trend: attendanceSummary.absentDays > 5 ? 'down' : 'up'
    },
    { 
      label: 'Attendance Rate', 
      value: `${attendanceSummary.percentage}%`, 
      color: attendanceSummary.percentage >= 80 ? 'green' : attendanceSummary.percentage >= 70 ? 'amber' : 'red',
      gradient: attendanceSummary.percentage >= 80 ? 'from-green-500 to-green-600' : 
               attendanceSummary.percentage >= 70 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600',
      bgGradient: attendanceSummary.percentage >= 80 ? 
                 (isDark ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100') : 
                 attendanceSummary.percentage >= 70 ? 
                 (isDark ? 'from-amber-900/20 to-amber-800/20' : 'from-amber-50 to-amber-100') : 
                 (isDark ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100'),
      icon: TrendingUp,
      change: attendanceSummary.percentage >= 80 ? 'Excellent' : 
             attendanceSummary.percentage >= 70 ? 'Good' : 'Needs Improvement',
      trend: attendanceSummary.percentage >= 75 ? 'up' : 'down',
      special: true 
    }
  ].map((stat, index) => (
    <motion.div
      key={stat.label}
      variants={itemVariants}
      whileHover={{ 
        scale: 1.03, 
        y: -8,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      className={`rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border backdrop-blur-sm relative overflow-hidden w-full bg-gradient-to-br ${stat.bgGradient} ${
        isDark ? 'border-slate-700' : 'border-white'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
      <div className="relative">
        <div className="flex justify-between items-start mb-2 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
            <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className={`flex items-center text-xs font-medium px-1.5 sm:px-2 py-1 rounded-full ${
            stat.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
            stat.trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : stat.trend === 'neutral' ? 'rotate-90' : ''}`} />
            <span className="hidden xs:inline">{stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}</span>
          </div>
        </div>
        <div>
          <p className={`text-xs sm:text-sm font-medium mb-1 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}>{stat.label}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 transition-colors duration-300 ${
            stat.special ? getAttendanceColor(attendanceSummary.percentage) : 
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {stat.value}
          </p>
          <p className={`text-xs font-medium transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-gray-600'
          }`}>{stat.change}</p>
        </div>
      </div>
    </motion.div>
  ))}
</div>

        {/* Analytics Overview Cards */}
        {/* Analytics Overview Cards - Responsive */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
  {[
    {
      title: 'Overall Attendance',
      value: `${attendanceSummary.percentage}%`,
      description: 'Based on your records',
      icon: BarChart3,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: isDark ? 'from-emerald-900/20 to-emerald-800/20' : 'from-emerald-50 to-emerald-100'
    },
    {
      title: 'Messages Received',
      value: messages.length,
      description: `${messages.filter(m => !m.isRead).length} unread messages`,
      icon: Mail,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: isDark ? 'from-blue-900/20 to-blue-800/20' : 'from-blue-50 to-blue-100'
    },
    {
      title: 'Class Ranking',
      value: '#3',
      description: 'Out of 45 students',
      icon: Award,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: isDark ? 'from-yellow-900/20 to-yellow-800/20' : 'from-yellow-50 to-yellow-100'
    }
  ].map((card, index) => (
    <motion.div
      key={card.title}
      variants={itemVariants}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { type: "spring", stiffness: 400 }
      }}
      className={`bg-gradient-to-br ${card.bgGradient} rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-5 border backdrop-blur-sm w-full ${
        isDark ? 'border-slate-700' : 'border-white/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`p-2 sm:p-2.5 rounded-lg bg-gradient-to-r ${card.gradient} shadow-md`}>
          <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <div className="text-right">
          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
        </div>
      </div>
      <div>
        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{card.title}</p>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{card.description}</p>
      </div>
    </motion.div>
  ))}
</div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="p-6 w-full max-w-[95rem] mx-auto"
      >
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className={`rounded-2xl shadow-2xl overflow-hidden border w-full ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Enhanced Tabs */}
          {/* Enhanced Tabs - Responsive */}
<div className={`border-b w-full transition-all duration-300 ${
  isDark 
    ? 'border-slate-600 bg-gradient-to-r from-amber-900/20 to-slate-800/50' 
    : 'border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100'
}`}>
  {/* Desktop Tabs - Hidden on Mobile */}
  <nav className="hidden md:flex w-full">
    {[
      { key: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
      { key: 'attendance', label: 'Attendance Record', icon: Calendar, badge: attendance.length },
      { key: 'messages', label: 'Messages', icon: Mail, badge: messages.filter(m => !m.isRead).length, hasNotification: hasNewMessages }
    ].map((tab) => (
      <motion.button
        key={tab.key}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setActiveTab(tab.key as 'overview' | 'attendance' | 'messages')}
        className={`flex items-center justify-center px-4 py-5 text-sm font-medium border-b-2 transition-all duration-300 flex-1 relative ${
          activeTab === tab.key
            ? isDark 
              ? 'border-amber-400 text-amber-300 bg-slate-800/50 shadow-sm'
              : 'border-amber-500 text-amber-700 bg-white shadow-sm'
            : isDark
              ? 'border-transparent text-slate-400 hover:text-amber-300 hover:border-amber-400/50'
              : 'border-transparent text-gray-600 hover:text-amber-600 hover:border-amber-300'
        }`}
      >
        <tab.icon className="h-5 w-5 mr-2" />
        <span className="whitespace-nowrap">{tab.label}</span>
        {tab.badge !== undefined && tab.badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`ml-2 px-2 py-1 text-xs rounded-full font-semibold transition-colors duration-300 ${
              activeTab === tab.key
                ? isDark 
                  ? 'bg-amber-900/30 text-amber-300 border border-amber-700/50'
                  : 'bg-amber-100 text-amber-800'
                : isDark
                  ? 'bg-slate-700/50 text-slate-300'
                  : 'bg-amber-500 text-white'
            }`}
          >
            {tab.badge}
          </motion.span>
        )}
      </motion.button>
    ))}
  </nav>

  {/* Mobile Bottom Navigation - Visible only on Mobile */}
  <div className="md:hidden">
    <div className="flex items-center justify-around p-2">
      {[
        { key: 'overview', label: 'Home', icon: BarChart3 },
        { key: 'attendance', label: 'Attendance', icon: Calendar, badge: attendance.length },
        { key: 'messages', label: 'Messages', icon: Mail, badge: messages.filter(m => !m.isRead).length, hasNotification: hasNewMessages }
      ].map((tab) => (
        <motion.button
          key={tab.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(tab.key as 'overview' | 'attendance' | 'messages')}
          className={`relative flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-300 ${
            activeTab === tab.key
              ? isDark
                ? 'bg-amber-900/30 text-amber-300'
                : 'bg-amber-100 text-amber-700'
              : isDark
                ? 'text-slate-400'
                : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <tab.icon className="h-5 w-5" />
            {tab.hasNotification && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-xs mt-1 font-medium">{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && activeTab !== tab.key && (
            <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full ${
              isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {tab.badge}
            </span>
          )}
          {activeTab === tab.key && (
            <motion.div
              layoutId="activeMobileTab"
              className={`absolute -bottom-1 w-8 h-0.5 rounded-full ${
                isDark ? 'bg-amber-400' : 'bg-amber-500'
              }`}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  </div>
</div>

          <div className="p-8 w-full">
            <AnimatePresence mode="wait">
              {/* Enhanced Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8 w-full"
                >
                  {/* Department Information Card - Enhanced like Staff Dashboard */}
                  
{userDepartment && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border ${
      isDark 
        ? 'bg-slate-800/60 border-slate-700' 
        : 'bg-white/80 border-blue-100'
    } shadow-lg hover:shadow-xl transition-shadow`}
  >
    {/* Subtle animated gradient overlay */}
    <motion.div
      animate={{
        background: [
          'linear-gradient(45deg, rgba(59,130,246,0.05) 0%, rgba(168,85,247,0.05) 100%)',
          'linear-gradient(45deg, rgba(168,85,247,0.05) 0%, rgba(59,130,246,0.05) 100%)'
        ]
      }}
      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      className="absolute inset-0 rounded-xl sm:rounded-2xl"
    />
    
    <div className="relative">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${
              isDark 
                ? 'bg-blue-600/20 border border-blue-500/30' 
                : 'bg-blue-500/10 border border-blue-400/30'
            }`}
          >
            <Building2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <motion.h3
              whileHover={{ x: 2 }}
              className={`font-semibold text-base sm:text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {userDepartment.name}
            </motion.h3>
            <motion.p
              whileHover={{ x: 2 }}
              className={`text-xs sm:text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}
            >
              Academic Department
            </motion.p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/profile/student/${user?.id}`)}
          className={`w-full sm:w-auto px-3 sm:px-4 py-2 text-xs font-medium rounded-lg sm:rounded-xl border backdrop-blur-sm ${
            isDark 
              ? 'bg-slate-700/50 text-blue-300 border-slate-600 hover:bg-slate-600/50' 
              : 'bg-white/50 text-blue-600 border-blue-200 hover:bg-white'
          } transition-colors`}
        >
          View Profile
        </motion.button>
      </div>

      {/* Description */}
      {userDepartment.description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2 sm:line-clamp-none ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}
        >
          {userDepartment.description}
        </motion.p>
      )}

      {/* Minimal Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-between pt-4 border-t border-gray-200 dark:border-slate-700 gap-3"
      >
        {user?.class && (
          <div className="text-center flex-1">
            <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {user.class.name}
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Class
            </p>
          </div>
        )}
        
        {userDepartment.head && (
          <div className="text-center flex-1">
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {userDepartment.head.name}
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Dept Head
            </p>
          </div>
        )}
      </motion.div>
    </div>
  </motion.div>
)}

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Attendance Progress Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`lg:col-span-2 rounded-2xl p-6 border shadow-xl ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`text-xl font-bold ${darkTextClass}`}>Attendance Progress</h3>
                          <p className={`text-sm ${darkSubtextClass}`}>Your current attendance performance</p>
                        </div>
                        <div className={`p-3 rounded-xl ${
                          isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                        }`}>
                          <Target className={`h-6 w-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`text-center p-4 rounded-xl ${
                          isDark ? 'bg-green-900/20' : 'bg-green-50'
                        }`}>
                          <p className={`text-2xl font-bold text-green-600 ${darkTextClass}`}>{attendanceSummary.presentDays}</p>
                          <p className={`text-sm ${darkSubtextClass}`}>Present</p>
                        </div>
                        <div className={`text-center p-4 rounded-xl ${
                          isDark ? 'bg-red-900/20' : 'bg-red-50'
                        }`}>
                          <p className={`text-2xl font-bold text-red-600 ${darkTextClass}`}>{attendanceSummary.absentDays}</p>
                          <p className={`text-sm ${darkSubtextClass}`}>Absent</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${darkTextClass}`}>Overall Attendance Rate</span>
                          <span className={`text-2xl font-bold ${getAttendanceColor(attendanceSummary.percentage)}`}>
                            {attendanceSummary.percentage}%
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-4 ${
                          isDark ? 'bg-slate-700' : 'bg-gray-200'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${attendanceSummary.percentage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-4 rounded-full shadow-lg ${getAttendanceBarColor(attendanceSummary.percentage)}`}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={darkSubtextClass}>0%</span>
                          <span className={darkSubtextClass}>100%</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Messages Overview Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-2xl p-6 border shadow-xl ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`text-xl font-bold ${darkTextClass}`}>Messages</h3>
                          <p className={`text-sm ${darkSubtextClass}`}>Communication overview</p>
                        </div>
                        <div className={`p-3 rounded-xl relative ${
                          isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                        }`}>
                          <Mail className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          {hasNewMessages && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                          <span className="font-semibold">Total Messages</span>
                          <span className="text-2xl font-bold">{messages.length}</span>
                        </div>
                        
                        <div className={`p-4 rounded-xl ${
                          isDark ? 'bg-amber-900/20' : 'bg-amber-50'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium ${darkTextClass}`}>Unread Messages</span>
                            <span className={`text-lg font-bold ${
                              unreadCount > 0 ? 'text-red-600' : darkTextClass
                            }`}>
                              {unreadCount}
                            </span>
                          </div>
                          {unreadCount > 0 && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setActiveTab('messages')}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-xl font-medium transition-colors mt-2"
                            >
                              View Messages
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Recent Activity & Quick Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-2xl p-6 border shadow-xl ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}
                    >
                      <h3 className={`text-lg font-bold mb-4 ${darkTextClass}`}>Recent Activity</h3>
                      <div className="space-y-3">
                        {attendance.slice(0, 3).map((record, index) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-3 ${
                                record.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className={`text-sm font-medium ${darkTextClass}`}>
                                {formatDate(record.date)}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              record.status === 'PRESENT' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {record.status}
                            </span>
                          </motion.div>
                        ))}
                        {attendance.length === 0 && (
                          <p className={`text-center py-4 ${darkSubtextClass}`}>No recent activity</p>
                        )}
                      </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-2xl p-6 border shadow-xl ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}
                    >
                      <h3 className={`text-lg font-bold mb-4 ${darkTextClass}`}>Performance Insights</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
                          <span>Best Attendance Streak</span>
                          <span className="font-bold">7 days</span>
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-xl ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkTextClass}>Class Average</span>
                          <span className={`font-bold ${darkTextClass}`}>85%</span>
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-xl ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkTextClass}>Your Rank</span>
                          <span className={`font-bold ${darkTextClass}`}>#3/45</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Attendance Tab */}
              {activeTab === 'attendance' && (
                <motion.div
                  key="attendance"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 w-full"
                >
                  {/* Enhanced Attendance Header */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`lg:col-span-2 rounded-2xl p-6 border shadow-xl ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className={`text-xl font-bold ${darkTextClass}`}>Attendance Analytics</h3>
                          <p className={`text-sm ${darkSubtextClass}`}>Detailed overview of your attendance pattern</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAttendanceDetails(!showAttendanceDetails)}
                          className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                            isDark 
                              ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/30' 
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {showAttendanceDetails ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show All Records
                            </>
                          )}
                        </motion.button>
                      </div>

                      {/* Attendance Chart */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-xl text-center ${
                          isDark ? 'bg-green-900/20' : 'bg-green-50'
                        }`}>
                          <div className="text-2xl font-bold text-green-600">{attendanceSummary.presentDays}</div>
                          <div className={`text-sm ${darkSubtextClass}`}>Present Days</div>
                        </div>
                        <div className={`p-4 rounded-xl text-center ${
                          isDark ? 'bg-red-900/20' : 'bg-red-50'
                        }`}>
                          <div className="text-2xl font-bold text-red-600">{attendanceSummary.absentDays}</div>
                          <div className={`text-sm ${darkSubtextClass}`}>Absent Days</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${darkTextClass}`}>Current Rate</span>
                          <span className={`text-2xl font-bold ${getAttendanceColor(attendanceSummary.percentage)}`}>
                            {attendanceSummary.percentage}%
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-3 ${
                          isDark ? 'bg-slate-700' : 'bg-gray-200'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${attendanceSummary.percentage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-3 rounded-full shadow-lg ${getAttendanceBarColor(attendanceSummary.percentage)}`}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-2xl p-6 border shadow-xl ${
                        isDark 
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}
                    >
                      <h3 className={`text-lg font-bold mb-4 ${darkTextClass}`}>Attendance Stats</h3>
                      <div className="space-y-3">
                        <div className={`flex justify-between items-center p-3 rounded-xl ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkTextClass}>Total Classes</span>
                          <span className="font-bold text-blue-600">{attendanceSummary.totalDays}</span>
                        </div>
                        <div className={`flex justify-between items-center p-3 rounded-xl ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkTextClass}>Attendance Rate</span>
                          <span className={`font-bold ${getAttendanceColor(attendanceSummary.percentage)}`}>
                            {attendanceSummary.percentage}%
                          </span>
                        </div>
                        <div className={`flex justify-between items-center p-3 rounded-xl ${
                          isDark ? 'bg-slate-700' : 'bg-gray-100'
                        }`}>
                          <span className={darkTextClass}>Required Minimum</span>
                          <span className="font-bold text-amber-600">75%</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Attendance Details */}
                  <AnimatePresence>
                    {showAttendanceDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4 w-full"
                      >
                        <h3 className={`text-lg font-semibold ${darkTextClass}`}>Detailed Attendance Records</h3>
                        {loading ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 w-full"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"
                            />
                            <p className={`font-medium ${darkSubtextClass}`}>Loading attendance data...</p>
                          </motion.div>
                        ) : attendance.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-center py-12 rounded-2xl border-2 border-dashed ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-600' 
                                : 'bg-amber-50 border-amber-300'
                            }`}
                          >
                            <Calendar className={`h-16 w-16 mx-auto mb-4 ${
                              isDark ? 'text-slate-500' : 'text-amber-400'
                            }`} />
                            <p className={`font-medium text-lg ${
                              isDark ? 'text-slate-400' : 'text-amber-700'
                            }`}>No attendance records found</p>
                            <p className={`mt-1 ${
                              isDark ? 'text-slate-500' : 'text-amber-600'
                            }`}>Your attendance records will appear here</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="overflow-x-auto rounded-2xl shadow-lg w-full"
                          >
                            <table className={`min-w-full divide-y rounded-2xl overflow-hidden w-full ${
                              isDark ? 'divide-slate-700' : 'divide-gray-200'
                            }`}>
                              <thead className={`${
                                isDark 
                                  ? 'bg-gradient-to-r from-amber-900/50 to-slate-800' 
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
                              }`}>
                                <tr className="w-full">
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                                    Date
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                                    Status
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                                    Marked By
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                                    Remarks
                                  </th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y w-full ${
                                isDark 
                                  ? 'divide-slate-700 bg-slate-800/50' 
                                  : 'divide-gray-200 bg-white'
                              }`}>
                                {attendance.map((record, index) => (
                                  <motion.tr
                                    key={record.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`transition-colors duration-200 w-full ${
                                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-amber-50'
                                    }`}
                                  >
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                      isDark ? 'text-white' : 'text-gray-900'
                                    } w-1/4`}>
                                      {formatDate(record.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap w-1/4">
                                      <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getAttendanceStatusColor(record.status)} shadow-sm`}
                                      >
                                        {record.status}
                                      </motion.span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                      isDark ? 'text-slate-300' : 'text-gray-600'
                                    } w-1/4`}>
                                      {record.staff.name}
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${
                                      isDark ? 'text-slate-400' : 'text-gray-500'
                                    } w-1/4`}>
                                      {record.remarks || '-'}
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {/* Pagination Controls */}
                            {attendancePagination && attendancePagination.totalPages > 1 && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className={`px-6 py-4 border-t flex items-center justify-between ${
                                  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-amber-200 bg-amber-50/50'
                                }`}
                              >
                                <div className={`text-sm ${
                                  isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  Showing {((attendancePage - 1) * attendancePageSize) + 1} to{' '}
                                  {Math.min(attendancePage * attendancePageSize, attendancePagination.totalRecords)} of{' '}
                                  {attendancePagination.totalRecords} records
                                </div>
                                <div className="flex items-center space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const newPage = attendancePage - 1;
                                      setAttendancePage(newPage);
                                      loadAttendance(newPage);
                                    }}
                                    disabled={!attendancePagination.hasPrev}
                                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                                      attendancePagination.hasPrev
                                        ? isDark
                                          ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/30'
                                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : isDark
                                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    Previous
                                  </motion.button>
                                  
                                  <span className={`px-3 py-1 text-sm font-medium ${
                                    isDark ? 'text-slate-300' : 'text-gray-700'
                                  }`}>
                                    Page {attendancePage} of {attendancePagination.totalPages}
                                  </span>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const newPage = attendancePage + 1;
                                      setAttendancePage(newPage);
                                      loadAttendance(newPage);
                                    }}
                                    disabled={!attendancePagination.hasNext}
                                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                                      attendancePagination.hasNext
                                        ? isDark
                                          ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/30'
                                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : isDark
                                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    Next
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Enhanced Messages Tab */}
              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 w-full"
                >
                  {/* Messages Header */}
                  {/* Messages Header - Responsive */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
  <div>
    <h3 className={`text-lg sm:text-xl font-bold ${darkTextClass}`}>Your Messages</h3>
    <p className={`text-xs sm:text-sm ${darkSubtextClass}`}>
      {unreadCount > 0 
        ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
        : 'All messages read'
      }
    </p>
  </div>
  
  {/* Action Buttons - Stack vertically on mobile, horizontal on desktop */}
  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowMessageForm(true)}
      className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-sm font-medium transition-colors w-full sm:w-auto ${
        isDark 
          ? 'bg-green-900/30 text-green-300 hover:bg-green-800/30' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`}
    >
      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
      <span>Ask Question</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={loadMessages}
      className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-sm font-medium transition-colors w-full sm:w-auto ${
        isDark 
          ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/30' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
    >
      <LucideRefreshCcwDot className="h-4 w-4 mr-2 flex-shrink-0" />
      <span>Refresh</span>
    </motion.button>
  </div>
</div>

                  {loading ? (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12 sm:py-16 w-full"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-3 sm:mb-4"
    />
    <p className={`text-sm sm:text-base font-medium ${darkSubtextClass}`}>Loading messages...</p>
  </motion.div>
) : messages.length === 0 ? (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`text-center py-12 sm:py-16 px-4 rounded-xl sm:rounded-2xl border-2 border-dashed ${
      isDark 
        ? 'bg-slate-800/50 border-slate-600' 
        : 'bg-amber-50 border-amber-300'
    }`}
  >
    <Mail className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 ${
      isDark ? 'text-slate-500' : 'text-amber-400'
    }`} />
    <p className={`font-medium text-base sm:text-lg ${
      isDark ? 'text-slate-400' : 'text-amber-700'
    }`}>No messages received</p>
    <p className={`mt-1 text-xs sm:text-sm ${
      isDark ? 'text-slate-500' : 'text-amber-600'
    }`}>Messages from staff will appear here</p>
  </motion.div>
) : (
  <div className="space-y-3 sm:space-y-4 w-full">
    {messages.map((message, index) => (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.01 }}
        className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 shadow-lg transition-all duration-300 w-full ${
          message.isRead 
            ? isDark
              ? 'bg-slate-800/30 border-slate-700'
              : 'bg-white border-amber-200'
            : isDark
              ? 'bg-gradient-to-r from-amber-900/20 to-slate-800/50 border-amber-500/30 shadow-xl'
              : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 shadow-xl'
        }`}
      >
        {/* Header Section - Responsive */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 w-full">
          <div className="flex items-start sm:items-center w-full lg:w-auto">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`p-2 sm:p-3 rounded-full mr-3 sm:mr-4 shadow-lg flex-shrink-0 ${getSenderInfo(message).bgColor}`}
            >
              {React.createElement(getSenderInfo(message).icon, { 
                className: `h-4 w-4 sm:h-5 sm:w-5 ${getSenderInfo(message).color}` 
              })}
            </motion.div>
            
            <div className="min-w-0 flex-1">
              {/* Tags Row - Wraps on mobile */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <h3 className={`font-semibold text-sm sm:text-base lg:text-lg truncate max-w-[150px] sm:max-w-[200px] lg:max-w-none ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  From: {message.staff.name}
                </h3>
                
                {/* Staff Role Tag */}
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${getSenderInfo(message).color} ${getSenderInfo(message).bgColor} border border-current shadow-sm whitespace-nowrap`}
                >
                  {getSenderInfo(message).label}
                </motion.span>
                
                {/* Message Type Tag */}
                {getMessageLabel(message) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${getMessageLabel(message)!.color} shadow-md whitespace-nowrap`}
                  >
                    {React.createElement(getMessageLabel(message)!.icon, { 
                      className: "h-2 w-2 sm:h-3 sm:w-3 mr-1" 
                    })}
                    {getMessageLabel(message)!.text}
                  </motion.span>
                )}
                
                {/* NEW Badge */}
                {!message.isRead && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      scale: { type: "spring", stiffness: 300 },
                      opacity: { duration: 1, repeat: Infinity, repeatType: "reverse" } 
                    }}
                    className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-red-700 to-red-900 text-white shadow-md whitespace-nowrap"
                  >
                    NEW
                  </motion.span>
                )}
              </div>
              
              {/* Date */}
              <p className={`text-xs sm:text-sm flex items-center font-medium ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`}>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{formatDateTime(message.createdAt)}</span>
              </p>
            </div>
          </div>
          
          {/* Action Buttons - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {message.fileName && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => downloadFile(message.id, message.fileName!)}
                className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 sm:py-2 border text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors shadow-md w-full sm:w-auto ${
                  isDark
                    ? 'border-amber-600 text-amber-300 bg-amber-900/30 hover:bg-amber-800/30'
                    : 'border-amber-300 text-amber-700 bg-white hover:bg-amber-50'
                }`}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span>Download</span>
              </motion.button>
            )}
            
            {!message.isRead && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => markMessageAsRead(message.id)}
                className="flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 sm:py-2 border border-transparent text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-amber-600 to-amber-900 hover:from-amber-700 hover:to-amber-950 focus:outline-none transition-colors shadow-md w-full sm:w-auto"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span>Mark as Read</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border backdrop-blur-sm w-full ${
          isDark 
            ? 'bg-slate-700/30 border-slate-600' 
            : 'bg-white/80 border-amber-100'
        }`}>
          <p className={`text-xs sm:text-sm leading-relaxed break-words ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
            {message.content}
          </p>
        </div>

        {/* Attachment Info */}
        {message.fileName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t w-full ${
              isDark ? 'border-slate-600' : 'border-amber-200'
            }`}
          >
            <div className={`flex items-center text-xs sm:text-sm font-medium truncate ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}>
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Attachment: {message.fileName}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    ))}
  </div>
)}

                  {/* Message Form Modal */}
                  {/* Message Form Modal - Responsive */}
<AnimatePresence>
  {showMessageForm && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={() => setShowMessageForm(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Ask Question to Staff
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMessageForm(false)}
            className={`self-end sm:self-center p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Staff Selection */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Select Staff Member
            </label>
            <select
              value={messageForm.staffId}
              onChange={(e) => setMessageForm({ ...messageForm, staffId: e.target.value })}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select a staff member...</option>
              {assignedStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} - {staff.email}
                </option>
              ))}
            </select>
          </div>

          {/* Message Type - Grid */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Message Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'question', label: 'Question', color: 'blue' },
                { value: 'doubt', label: 'Doubt', color: 'orange' },
                { value: 'clarification', label: 'Clarification', color: 'purple' },
                { value: 'general', label: 'General', color: 'green' }
              ].map((type) => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setMessageForm({ ...messageForm, messageType: type.value })}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border-2 transition-all ${
                    messageForm.messageType === type.value
                      ? isDark
                        ? `border-${type.color}-500 bg-${type.color}-900/20 text-${type.color}-300`
                        : `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                      : isDark
                        ? 'border-slate-600 text-slate-300 hover:border-slate-500'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Your Message
            </label>
            <textarea
              value={messageForm.content}
              onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
              placeholder="Type your question or message here..."
              rows={4}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setMessageForm({ ...messageForm, file: e.target.files?.[0] || null })}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            {messageForm.file && (
              <p className={`text-xs sm:text-sm mt-2 truncate ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Selected: {messageForm.file.name}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMessageForm(false)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessageToStaff}
            disabled={messageLoading || !messageForm.staffId || !messageForm.content.trim()}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {messageLoading ? 'Sending...' : 'Send Message'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}