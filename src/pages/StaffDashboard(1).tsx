import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Send,
  MessageSquare,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  User,
  BookOpen,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Bell,
  FileText,
  Upload,
  Building2,
  Mail,
  RefreshCcw
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useRoleTheme } from '../hooks/useRoleTheme';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ModernDropdown } from '../components/ui/ModernDropdown';
import { ModernCalendar } from '../components/ui/ModernCalendar';

// Add this interface for the jsPDF with autoTable


interface Student {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

interface ClassInfo {
  id: number;
  name: string;
  studentCount: number;
  staff?: {
    id: number;
    name: string;
    email: string;
  };
  department?: {
    id: number;
    name: string;
  };
  attendanceRate?: number;
  lastActivity?: string;
}

interface AttendanceRecord {
  studentId: number;
  studentName: string;
  rollNumber: string;
  status: 'PRESENT' | 'ABSENT' | null;
  remarks: string | null;
}

interface Message {
  id: number;
  content: string;
  fileName: string | null;
  filePath: string | null;
  student: {
    name: string;
    rollNumber: string;
  } | null;
  isAnnouncement: boolean;
  createdAt: string;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getRoleCardClass, getRoleTabClass, getRoleColors, isDark } = useRoleTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'students' | 'messages' | 'studentMessages' | 'staffComm'>('overview');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | 'ALL'>('ALL');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'ALL'>('ALL');
  const [userDepartment, setUserDepartment] = useState<any>(null);
  const [managedClasses, setManagedClasses] = useState<any[]>([]);

  // Staff communication state
  const [staffMessages, setStaffMessages] = useState<any[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [staffMsgLoading, setStaffMsgLoading] = useState(false);
  const [staffForm, setStaffForm] = useState<{ recipientId: string; content: string; file: File | null }>({ recipientId: '', content: '', file: null });
  const [showStaffMsgForm, setShowStaffMsgForm] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  
  // Student messages state
  const [studentMessages, setStudentMessages] = useState<any[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyForm, setReplyForm] = useState({ originalMessageId: '', content: '', file: null as File | null });
  const [studentMsgLoading, setStudentMsgLoading] = useState(false);
  // Students tab: search & pagination
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(12);
  const [studentsTotal, setStudentsTotal] = useState(0);
  
  // Attendance tab: pagination
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(8);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [attendancePagination, setAttendancePagination] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    weeklyAttendance: [] as Array<{date: string; present: number; absent: number; total: number}>,
    monthlyTrends: [] as Array<{month: string; attendanceRate: number; messagesSent: number}>,
    classComparison: [] as Array<{className: string; attendanceRate: number; totalStudents: number}>
  });
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    messagesSent: 0,
    averageAttendance: 0,
    activeClasses: 0
  });

  // Message form state
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageType, setMessageType] = useState<'individual' | 'group' | 'class' | 'announcement'>('individual');
  const [messageForm, setMessageForm] = useState({
    studentId: '',
    studentIds: [] as number[],
    classId: '',
    content: '',
    file: null as File | null
  });

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);

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

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Function to get last week's date range
  const getLastWeekDateRange = () => {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 1);
    
    return {
      start: lastWeekStart.toISOString().split('T')[0],
      end: lastWeekEnd.toISOString().split('T')[0]
    };
  };

  // Function to get dates for last week
  const getLastWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Enhanced function to calculate stats with better data handling
  const calculateStats = useCallback(() => {
    // Calculate attendance stats for current date
    const presentCount = attendanceData.filter(record => record.status === 'PRESENT').length;
    const absentCount = attendanceData.filter(record => record.status === 'ABSENT').length;
    const totalMarked = presentCount + absentCount;
    const attendanceRate = totalMarked > 0 ? (presentCount / totalMarked) * 100 : 0;
    
    // Calculate total students managed by this staff member
    let totalStudentsManaged = 0;
    if (user?.role === 'STAFF') {
      // For staff, count students in their managed classes
      const staffClasses = classes.filter(cls => cls.staff?.id === user.id);
      totalStudentsManaged = staffClasses.reduce((total, cls) => total + (cls.studentCount || 0), 0);
    } else {
      // For super admin, use all students
      totalStudentsManaged = students.length;
    }
    
    // Count active classes (classes with students)
    const activeClassesCount = classes.filter(cls => cls.studentCount && cls.studentCount > 0).length;
    
    // Count messages sent today
    const today = new Date().toDateString();
    const messagesToday = messages.filter(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      return msgDate === today;
    }).length;
    
    // Calculate overall attendance rate from classes data
    let overallAttendanceRate = 0;
    if (classes.length > 0) {
      const classesWithAttendance = classes.filter(cls => cls.attendanceRate !== undefined && cls.attendanceRate > 0);
      if (classesWithAttendance.length > 0) {
        overallAttendanceRate = Math.round(
          classesWithAttendance.reduce((sum, cls) => sum + (cls.attendanceRate || 0), 0) / classesWithAttendance.length
        );
      } else {
        overallAttendanceRate = Math.round(attendanceRate);
      }
    } else {
      overallAttendanceRate = Math.round(attendanceRate);
    }
    
    setStats({
      totalStudents: totalStudentsManaged,
      presentToday: presentCount,
      absentToday: absentCount,
      messagesSent: messagesToday,
      averageAttendance: overallAttendanceRate,
      activeClasses: activeClassesCount
    });
  }, [attendanceData, students.length, messages, classes, user]);

  const loadUserDepartment = useCallback(async () => {
    try {
      if (user?.departmentId) {
        try {
          const response = await api.get(`/departments/${user.departmentId}`);
          setUserDepartment(response.data);
        } catch (departmentError: any) {
          // Handle 403 or other permission errors gracefully
          if (departmentError.response?.status === 403) {
            console.log('No permission to access department details, using basic info');
            // Set basic department info from user data if available
            setUserDepartment({
              id: user.departmentId,
              name: user.department?.name || 'Department',
              description: 'Department information not available',
              staffCount: 0
            });
          } else {
            throw departmentError;
          }
        }
        
        // Extract managed classes from the classes array
        const staffClasses = classes.filter(cls => cls.staff?.id === user.id);
        setManagedClasses(staffClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          studentCount: cls.studentCount || 0
        })));
      }
    } catch (error) {
      console.error('Failed to load user department:', error);
      setUserDepartment(null);
    }
  }, [user, classes]);

  const loadDepartments = useCallback(async () => {
    try {
      // Only load departments for super admin users
      if (user?.role === 'SUPER_ADMIN') {
        const res = await api.get('/departments');
        setDepartments(res.data || []);
      } else {
        // For staff users, set empty departments array as they shouldn't access all departments
        setDepartments([]);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  }, [user?.role]);

  const loadClasses = useCallback(async () => {
    try {
      const params: any = {};
      // For staff, always filter by their department; for superadmin, use selected department
      if (user?.role === 'STAFF' && user.departmentId) {
        params.departmentId = user.departmentId;
      } else if (user?.role === 'SUPER_ADMIN' && selectedDepartmentId !== 'ALL') {
        params.departmentId = selectedDepartmentId;
      }
      const res = await api.get('/users/classes', { params });
      const classesWithStats = await Promise.all(
        res.data.map(async (cls: any) => {
          try {
            // Get attendance rate for last 7 days
            const attendanceRes = await api.get(`/attendance/stats/${cls.id}?days=7`);
            return {
              ...cls,
              attendanceRate: attendanceRes.data.attendanceRate || 0,
              lastActivity: attendanceRes.data.lastActivity || new Date().toISOString()
            };
          } catch (error) {
            return {
              ...cls,
              attendanceRate: 0,
              lastActivity: new Date().toISOString()
            };
          }
        })
      );
      setClasses(classesWithStats);
    } catch (e) {
      setClasses([]);
    }
  }, [user, selectedDepartmentId]);

  const loadAnalytics = useCallback(async () => {
    try {
      // Build analytics from real data: last week's attendance and current classes
      const lastWeekData = await loadLastWeekAttendance();
      const weeklyAttendance = lastWeekData.map(day => {
        const present = day.data.filter(r => r.status === 'PRESENT').length;
        const absent = day.data.filter(r => r.status === 'ABSENT').length;
        return { date: day.date, present, absent, total: day.data.length };
      });
      const classComparison = classes.map(c => ({
        className: c.name,
        attendanceRate: c.attendanceRate || 0,
        totalStudents: c.studentCount || 0
      }));
      setAnalytics({
        weeklyAttendance,
        monthlyTrends: [],
        classComparison
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics({ weeklyAttendance: [], monthlyTrends: [], classComparison: [] });
    }
  }, [classes]);

  const loadStudents = useCallback(async () => {
    try {
      const params: any = {
        page: studentPage,
        pageSize: studentPageSize,
      };
      if (studentSearch.trim()) params.q = studentSearch.trim();
      // Only add classId parameter if a specific class is selected (not 'ALL')
      if (selectedClassId !== 'ALL') {
        params.classId = selectedClassId;
      }
      // For staff, always filter by their department; for superadmin, use selected department
      if (user?.role === 'STAFF' && user.departmentId) {
        params.departmentId = user.departmentId;
      } else if (user?.role === 'SUPER_ADMIN' && selectedDepartmentId !== 'ALL') {
        params.departmentId = selectedDepartmentId;
      }

      const response = await api.get('/users/students', { params });
      setStudents(response.data.rows || []);
      setStudentsTotal(response.data.count || 0);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
    }
  }, [user, selectedClassId, selectedDepartmentId, studentPage, studentPageSize, studentSearch]);

  const loadAttendanceForDate = useCallback(async () => {
    try {
      setLoading(true);
      // Build URL with proper query parameters including pagination
      let url = `/attendance/date/${selectedDate}`;
      const params: any = {
        page: attendancePage,
        pageSize: attendancePageSize
      };
      
      if (selectedClassId !== 'ALL') {
        params.classId = selectedClassId;
      }
      
      const response = await api.get(url, { params });
      
      // Handle both paginated and non-paginated response formats
      if (response.data.rows) {
        // Paginated response
        setAttendanceData(response.data.rows || []);
        setAttendancePagination({
          currentPage: response.data.currentPage || attendancePage,
          pageSize: response.data.pageSize || attendancePageSize,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.count || 0,
          hasNextPage: response.data.hasNextPage || false,
          hasPreviousPage: response.data.hasPreviousPage || false
        });
        setAttendanceTotal(response.data.count || 0);
      } else {
        // Non-paginated response - implement client-side pagination
        const allData = response.data || [];
        const startIndex = (attendancePage - 1) * attendancePageSize;
        const endIndex = startIndex + attendancePageSize;
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setAttendanceData(paginatedData);
        setAttendanceTotal(allData.length);
        const totalPages = Math.ceil(allData.length / attendancePageSize);
        setAttendancePagination({
          currentPage: attendancePage,
          pageSize: attendancePageSize,
          totalPages,
          totalItems: allData.length,
          hasNextPage: attendancePage < totalPages,
          hasPreviousPage: attendancePage > 1
        });
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
      // Create empty records only if we have students data
      if (students.length > 0) {
        const emptyRecords = students.map(student => ({
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          status: null,
          remarks: null
        }));
        const startIndex = (attendancePage - 1) * attendancePageSize;
        const endIndex = startIndex + attendancePageSize;
        const paginatedEmptyRecords = emptyRecords.slice(startIndex, endIndex);
        
        setAttendanceData(paginatedEmptyRecords);
        setAttendanceTotal(emptyRecords.length);
        const totalPages = Math.ceil(emptyRecords.length / attendancePageSize);
        setAttendancePagination({
          currentPage: attendancePage,
          pageSize: attendancePageSize,
          totalPages,
          totalItems: emptyRecords.length,
          hasNextPage: attendancePage < totalPages,
          hasPreviousPage: attendancePage > 1
        });
      } else {
        setAttendanceData([]);
        setAttendanceTotal(0);
        setAttendancePagination({
          currentPage: 1,
          pageSize: attendancePageSize,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, students, selectedClassId, attendancePage, attendancePageSize]);


  // Load last week's attendance data
  // Improved loadLastWeekAttendance function
const loadLastWeekAttendance = async () => {
  try {
    setLoading(true);
    const lastWeekDates = getLastWeekDates();
    const attendancePromises = lastWeekDates.map(date => {
      let url = `/attendance/date/${date}`;
      if (selectedClassId !== 'ALL') {
        url += `?classId=${selectedClassId}`;
      }
      return api.get(url);
    });
    
    const responses = await Promise.allSettled(attendancePromises);
    const lastWeekData: {date: string, data: AttendanceRecord[]}[] = [];
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        const responseData = response.value.data;
        
        // Handle different possible response structures
        let attendanceRecords: AttendanceRecord[] = [];
        
        if (Array.isArray(responseData)) {
          // If response is directly an array of records
          attendanceRecords = responseData;
        } else if (responseData && Array.isArray(responseData.records)) {
          // If response has records property
          attendanceRecords = responseData.records;
        } else if (responseData && Array.isArray(responseData.attendance)) {
          // If response has attendance property
          attendanceRecords = responseData.attendance;
        } else if (responseData && typeof responseData === 'object') {
          // If response is an object, try to extract array values
          const possibleArrays = Object.values(responseData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            attendanceRecords = possibleArrays[0] as AttendanceRecord[];
          }
        }
        
        console.log(`Date: ${lastWeekDates[index]}, Records:`, attendanceRecords);
        
        lastWeekData.push({
          date: lastWeekDates[index],
          data: attendanceRecords
        });
      } else {
        console.error(`Failed to fetch data for ${lastWeekDates[index]}:`, response.reason);
        // Add empty data for failed requests
        lastWeekData.push({
          date: lastWeekDates[index],
          data: []
        });
      }
    });
    
    return lastWeekData;
  } catch (error) {
    console.error('Failed to load last week attendance:', error);
    return [];
  } finally {
    setLoading(false);
  }
};

  // Initial load effect
  useEffect(() => {
    const initializeData = async () => {
      setInitialLoad(true);
      try {
        // For staff, set their department as the selected department
        if (user?.role === 'STAFF' && user.departmentId) {
          setSelectedDepartmentId(user.departmentId);
        }
        
        await loadDepartments();
        await loadClasses();
        await loadUserDepartment();
        await loadStudents();
        await loadAnalytics();
        
        if (activeTab === 'attendance') {
          await loadAttendanceForDate();
        } else if (activeTab === 'students') {
          await loadStudents();
        } else if (activeTab === 'messages') {
          await loadMessages();
        } else if (activeTab === 'studentMessages') {
          await loadStudentMessages();
        } else if (activeTab === 'staffComm') {
          await loadStaffCommData();
        }
        
        calculateStats();
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setInitialLoad(false);
      }
    };

    initializeData();
  }, [user]);

  // Effect for tab changes and filters/search/pagination
  useEffect(() => {
    if (!initialLoad) {
      if (activeTab === 'attendance') {
        // Re-load attendance when date or class changes
        loadAttendanceForDate();
      } else if (activeTab === 'students') {
        // Re-load students when class, search, or pagination changes
        loadStudents();
      } else if (activeTab === 'messages') {
        loadMessages();
      } else if (activeTab === 'studentMessages') {
        loadStudentMessages();
      } else if (activeTab === 'staffComm') {
        loadStaffCommData();
      }
    }
  }, [activeTab, selectedDate, selectedClassId, selectedDepartmentId, studentSearch, studentPage, studentPageSize, attendancePage, attendancePageSize]);

  // Effect to load user department when classes are loaded
  useEffect(() => {
    if (!initialLoad && classes.length > 0) {
      loadUserDepartment();
    }
  }, [classes, loadUserDepartment, initialLoad]);

  // Effect to recalculate stats whenever relevant data changes
  useEffect(() => {
    if (!initialLoad) {
      calculateStats();
    }
  }, [calculateStats, attendanceData, students, messages, classes, initialLoad]);

  const loadStaffCommData = async () => {
    try {
      setStaffMsgLoading(true);
      const [conv, admins] = await Promise.all([
        api.get('/staff-messages/conversations'),
        api.get('/staff-messages/admin-list')
      ]);
      setStaffMessages(conv.data?.messages || []);
      setAdminList(admins.data?.admins || []);
    } catch (err) {
      console.error('Failed to load staff communication data:', err);
      setStaffMessages([]);
      setAdminList([]);
    } finally {
      setStaffMsgLoading(false);
    }
  };

  const sendStaffMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.recipientId || !staffForm.content.trim()) return;
    try {
      setStaffMsgLoading(true);
      
      // Use multipart form-data to support attachments
      const formData = new FormData();
      formData.append('content', staffForm.content);
      formData.append('recipientId', staffForm.recipientId);
      if (staffForm.file) {
        formData.append('file', staffForm.file);
      }

      const response = await api.post('/staff-messages/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Staff message response:', response.data);
      setStaffForm({ recipientId: '', content: '', file: null });
      setShowStaffMsgForm(false);
      
      // Reload staff communication data to show the new message
      await loadStaffCommData();
      
      // Also trigger a refresh to ensure messages appear
      setTimeout(async () => {
        await loadStaffCommData();
      }, 1000);
      
      alert('Message sent to administrator successfully!');
    } catch (error: any) {
      console.error('Send staff message error:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setStaffMsgLoading(false);
    }
  };

  const downloadAttachment = async (messageId: number, fileName?: string | null) => {
    try {
      const res = await api.get(`/staff-messages/download/${messageId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'attachment');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to download attachment');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/sent');
      setMessages(response.data.rows || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentMessages = async () => {
    try {
      setStudentMsgLoading(true);
      const response = await api.get('/messages/from-students');
      setStudentMessages(response.data.rows || []);
    } catch (error) {
      console.error('Failed to load student messages:', error);
      setStudentMessages([]);
    } finally {
      setStudentMsgLoading(false);
    }
  };

  const replyToStudent = async () => {
    if (!replyForm.originalMessageId || !replyForm.content.trim()) {
      alert('Please enter a reply message');
      return;
    }

    try {
      setStudentMsgLoading(true);
      
      const formData = new FormData();
      formData.append('originalMessageId', replyForm.originalMessageId);
      formData.append('content', replyForm.content);
      
      if (replyForm.file) {
        formData.append('file', replyForm.file);
      }

      await api.post('/messages/reply-to-student', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form and refresh data
      setReplyForm({ originalMessageId: '', content: '', file: null });
      setShowReplyForm(false);
      await loadStudentMessages();
      
      alert('Reply sent successfully!');
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      alert(error.response?.data?.error || 'Failed to send reply');
    } finally {
      setStudentMsgLoading(false);
    }
  };

  const markAttendance = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceData(prev =>
      prev.map(record =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const setRemarks = (studentId: number, remarks: string) => {
    setAttendanceData(prev =>
      prev.map(record =>
        record.studentId === studentId ? { ...record, remarks } : record
      )
    );
  };

  const saveAttendance = async () => {
    try {
      setLoading(true);
      const attendanceToSave = attendanceData
        .filter(record => record.status !== null)
        .map(record => ({
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks || undefined
        }));

      if (attendanceToSave.length === 0) {
        alert('Please mark attendance for at least one student');
        return;
      }

      await api.post('/attendance/mark', {
        date: selectedDate,
        attendanceData: attendanceToSave,
        classId: selectedClassId !== 'ALL' ? selectedClassId : undefined
      });

      alert('Attendance saved successfully!');
      await loadAttendanceForDate();
      calculateStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('content', messageForm.content);
      
      if (messageForm.file) {
        formData.append('file', messageForm.file);
      }
      
      if (messageType === 'announcement') {
        formData.append('isAnnouncement', 'true');
        formData.append('messageType', 'ALL_STUDENTS');
        await api.post('/messages/send-to-all-students', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (messageType === 'class') {
        if (!messageForm.classId) {
          alert('Please select a class');
          return;
        }
        formData.append('classId', messageForm.classId);
        formData.append('messageType', 'class');
        await api.post('/messages/send-to-class', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (messageType === 'group') {
        if (messageForm.studentIds.length === 0) {
          alert('Please select at least one student');
          return;
        }
        formData.append('studentIds', JSON.stringify(messageForm.studentIds));
        formData.append('messageType', 'group');
        await api.post('/messages/send-to-group', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Individual message
        if (!messageForm.studentId) {
          alert('Please select a student');
          return;
        }
        formData.append('studentId', messageForm.studentId);
        formData.append('isAnnouncement', 'false');
        await api.post('/messages/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const messageTypeLabels = {
        announcement: 'Announcement sent successfully!',
        class: 'Class message sent successfully!',
        group: 'Group message sent successfully!',
        individual: 'Message sent successfully!'
      };
      
      alert(messageTypeLabels[messageType]);
      
      setMessageForm({ studentId: '', studentIds: [], classId: '', content: '', file: null });
      setShowMessageForm(false);
      await loadMessages();
      calculateStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fixed PDF export function
  // Fixed PDF export function
// Fixed PDF export function - KEEP ONLY THIS VERSION
// Fixed PDF export function
const exportToPDF = () => {
  try {
    if (attendanceData.length === 0) {
      alert('No attendance data to export');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    const classLabel = selectedClassId === 'ALL' ? 'All Classes' : (classes.find(c => c.id === selectedClassId)?.name || 'Class');
    const departmentInfo = user?.role === 'STAFF' ? ' (Department Staff View)' : '';
    doc.text(`Attendance Report - ${selectedDate} - ${classLabel}${departmentInfo}`, 14, 15);
    
    // Date information
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Summary statistics
    const presentCount = attendanceData.filter(record => record.status === 'PRESENT').length;
    const absentCount = attendanceData.filter(record => record.status === 'ABSENT').length;
    const notMarkedCount = attendanceData.filter(record => record.status === null).length;
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Students: ${attendanceData.length}`, 14, 32);
    doc.text(`Present: ${presentCount}`, 14, 38);
    doc.text(`Absent: ${absentCount}`, 14, 44);
    doc.text(`Not Marked: ${notMarkedCount}`, 14, 50);
    
    // Table data
    const tableData = attendanceData.map(record => [
      record.studentName || 'N/A',
      record.rollNumber || 'N/A',
      record.status || 'NOT MARKED',
      record.remarks || '-'
    ]);

    // Use autoTable with proper typing
    autoTable(doc, {
      head: [['Name', 'Roll Number', 'Status', 'Remarks']],
      body: tableData,
      startY: 60,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    const fileSuffix = selectedClassId === 'ALL' ? 'all' : String(classLabel).replace(/\s+/g,'_');
    doc.save(`attendance-${selectedDate}-${fileSuffix}.pdf`);
    setShowExportDropdown(false);
  } catch (error) {
    console.error('Failed to export attendance:', error);
    alert('Failed to export attendance data. Please try again.');
  }
};

// Export last week's attendance as XLS (replacing PDF)
// Fixed exportLastWeekToXLS function
const exportLastWeekToXLS = async () => {
  try {
    setLoading(true);
    const lastWeekData = await loadLastWeekAttendance();
    
    if (!lastWeekData || lastWeekData.length === 0) {
      alert('No attendance data found for last week');
      return;
    }

    // Create a workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet with improved data handling
    const summaryData = lastWeekData.map(day => {
      if (!day.data || !Array.isArray(day.data)) {
        return {
          Date: day.date,
          StudentName: 0,
          Present: 0,
          Absent: 0,
          Total: 0,
          
          'Attendance %': '0%'
        };
      }
      
      const presentCount = day.data.filter(record => record.status === 'PRESENT').length;
      const absentCount = day.data.filter(record => record.status === 'ABSENT').length;
      const totalStudents = day.data.length;
      const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      
      return {
        Date: day.date,
        Present: presentCount,
        Absent: absentCount,
        Total: totalStudents,
        'Attendance %': `${attendancePercentage}%`
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Weekly Summary');

    // Detailed sheets for each day with better data processing
    lastWeekData.forEach((dayData, index) => {
      // Ensure we have valid data array
      const dailyRecords = dayData.data || [];
      
      const dayTableData = dailyRecords.map(record => ({
        Name: record.studentName || 'N/A',
        'Roll Number': record.rollNumber || 'N/A',
        Status: record.status || 'NOT MARKED',
        Remarks: record.remarks || '-',
        Date: dayData.date
      }));

      if (dayTableData.length > 0) {
        const daySheet = XLSX.utils.json_to_sheet(dayTableData);
        
        // Format date for sheet name (remove invalid characters)
        const formattedDate = dayData.date.replace(/-/g, '_');
        const sheetName = `Day_${index + 1}_${formattedDate}`.substring(0, 31);
        
        XLSX.utils.book_append_sheet(workbook, daySheet, sheetName);
      }
    });

    // Add a consolidated detailed sheet with all data
    const allDetailedData = lastWeekData.flatMap(dayData => {
      const dailyRecords = dayData.data || [];
      return dailyRecords.map(record => ({
        Date: dayData.date,
        Name: record.studentName || 'N/A',
        'Roll Number': record.rollNumber || 'N/A',
        Status: record.status || 'NOT MARKED',
        Remarks: record.remarks || '-'
      }));
    });

    if (allDetailedData.length > 0) {
      const consolidatedSheet = XLSX.utils.json_to_sheet(allDetailedData);
      XLSX.utils.book_append_sheet(workbook, consolidatedSheet, 'All Records');
    }

    const dateRange = getLastWeekDateRange();
    const classLabel = selectedClassId === 'ALL' ? 'all' : (classes.find(c => c.id === selectedClassId)?.name || 'class').replace(/\s+/g,'_');
    XLSX.writeFile(workbook, `last-week-attendance-${classLabel}-${dateRange.start}-to-${dateRange.end}.xlsx`);
    setShowExportDropdown(false);
  } catch (error) {
    console.error('Failed to export last week attendance:', error);
    alert('Failed to export last week attendance data. Please try again.');
  } finally {
    setLoading(false);
  }
};
// Fixed last week PDF export function


  // Export last week's attendance as PDF
  // Export last week's attendance as PDF - KEEP ONLY THIS VERSION
const exportLastWeekToPDF = async () => {
  try {
    setLoading(true);
    const lastWeekData = await loadLastWeekAttendance();
    
    if (!lastWeekData || lastWeekData.length === 0) {
      alert('No attendance data found for last week');
      return;
    }

    const doc = new jsPDF() as any;
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    const classLabel = selectedClassId === 'ALL' ? 'All Classes' : (classes.find(c => c.id === selectedClassId)?.name || 'Class');
    const departmentInfo = user?.role === 'STAFF' ? ' (Department Staff View)' : '';
    doc.text(`Last 7 Days Attendance - ${classLabel}${departmentInfo}`, 14, 15);
    
    const dateRange = getLastWeekDateRange();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    let startY = 40;
    
    // Create summary table for the week with proper data validation
    const summaryData = lastWeekData.map(day => {
      if (!day.data || !Array.isArray(day.data)) {
        return [day.date, '0', '0', '0', '0%'];
      }
      
      const presentCount = day.data.filter(record => record.status === 'PRESENT').length;
      const absentCount = day.data.filter(record => record.status === 'ABSENT').length;
      const totalStudents = day.data.length;
      const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      
      return [
        day.date,
        presentCount.toString(),
        absentCount.toString(),
        totalStudents.toString(),
        `${attendancePercentage}%`
      ];
    });

    // Weekly summary table
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Weekly Summary', 14, startY - 5);
    
    doc.autoTable({
      head: [['Date', 'Present', 'Absent', 'Total', 'Attendance %']],
      body: summaryData,
      startY: startY,
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      }
    });

    // Safely get the finalY position
    const finalY = doc.lastAutoTable?.finalY || startY + 50;
    startY = finalY + 15;

    // Detailed attendance for each day with pagination
    lastWeekData.forEach((dayData, index) => {
      // Check if we need a new page
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`Date: ${dayData.date}`, 14, startY);
      
      // Ensure dayData.data is valid
      const dayTableData = (dayData.data || []).map(record => [
        record.studentName || 'N/A',
        record.rollNumber || 'N/A',
        record.status || 'NOT MARKED',
        record.remarks || '-'
      ]);

      if (dayTableData.length > 0) {
        doc.autoTable({
          head: [['Name', 'Roll Number', 'Status', 'Remarks']],
          body: dayTableData,
          startY: startY + 5,
          styles: { 
            fontSize: 7,
            cellPadding: 1
          },
          headStyles: { 
            fillColor: [156, 163, 175],
            textColor: [255, 255, 255]
          },
          theme: 'grid'
        });

        // Update startY safely
        const newFinalY = doc.lastAutoTable?.finalY;
        startY = newFinalY ? newFinalY + 10 : startY + 100;
      } else {
        doc.text('No attendance data for this day', 14, startY + 10);
        startY += 20;
      }
    });

    const fileClass = (selectedClassId === 'ALL' ? 'all' : String(classLabel).replace(/\s+/g, '_'));
    doc.save(`last-week-attendance-${fileClass}-${dateRange.start}-to-${dateRange.end}.pdf`);
    setShowExportDropdown(false);
  } catch (error) {
    console.error('Failed to export last week attendance:', error);
    alert('Failed to export last week attendance data. Please check the console for details.');
  } finally {
    setLoading(false);
  }
};

  const exportToXLS = () => {
    try {
      if (attendanceData.length === 0) {
        alert('No attendance data to export');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        attendanceData.map(record => ({
          Name: record.studentName,
          'Roll Number': record.rollNumber,
          Status: record.status || 'NOT MARKED',
          Remarks: record.remarks || ''
        }))
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `attendance-${selectedDate}.xlsx`);
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Failed to export attendance:', error);
      alert('Failed to export attendance data');
    }
  };

  const exportToCSV = () => {
    try {
      if (attendanceData.length === 0) {
        alert('No attendance data to export');
        return;
      }

      const csvContent = "data:text/csv;charset=utf-8," 
        + ["Name,Roll Number,Status,Remarks", ...attendanceData.map(record => 
            `"${record.studentName}","${record.rollNumber}","${record.status || 'NOT MARKED'}","${record.remarks || ''}"`
          )].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `attendance-${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportDropdown(false);
    } catch (error) {
      console.error('Failed to export attendance:', error);
      alert('Failed to export attendance data');
    }
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"
          />
          <p className="text-gray-600">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`min-h-screen transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
          : 'bg-gradient-to-br from-emerald-50 to-teal-50'
      }`}
    >
      {/* Enhanced Header with Better Navigation */}
<motion.div
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
  className={`px-7 py-5 text-white p-6 shadow-2xl rounded-2xl transition-all duration-300 ${
    isDark 
      ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700' 
      : 'bg-gradient-to-r from-emerald-900 to-emerald-200 border-b border-emerald-300'
  }`}
>
  <div className="flex justify-between items-center">
    <motion.div 
      className="flex items-center"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`p-3 rounded-2xl mr-4 backdrop-blur-sm cursor-pointer ${
          isDark ? 'bg-emerald-800/50' : 'bg-emerald-700/50'
        }`}
        onClick={() => navigate(`/profile/staff/${user?.id}`)}
      >
        <Users className="h-8 w-8" />
      </motion.div>
      <div>
        <div className="cursor-pointer" onClick={() => navigate(`/profile/staff/${user?.id}`)}>
          <h1 className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent hover:from-emerald-100 hover:to-emerald-200 transition-colors">
            Staff Portal {user?.managedClass?.name ? `- ${user.managedClass.name}` : ''}
          </h1>
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-emerald-200' : 'text-emerald-100'
          }`}>{userDepartment?.name || 'Department: Not assigned'} • Manage attendance and communicate with students</p>
        </div>
      </div>
    </motion.div>
    <div className="flex items-center space-x-4">
      
      <motion.div 
        className={`flex items-center px-3 py-2 rounded-lg backdrop-blur-sm ${
          isDark ? 'bg-emerald-800/50' : 'bg-emerald-700'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        <Calendar className="h-5 w-5 mr-2" />
        <span>{new Date().toLocaleDateString()}</span>
      </motion.div>
    </div>
  </div>
</motion.div>

      {/* Profile navigation - removed modal, now using page navigation */}

      {/* Enhanced Analytics Cards with Better Layout */}
      <motion.div 
        className="p-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Primary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Students', 
              value: stats.totalStudents, 
              icon: Users, 
              color: 'emerald',
              gradient: 'from-emerald-900 to-emerald-600',
              bgGradient: 'from-emerald-50 to-emerald-100',
              change: '+5 this week',
              trend: 'up'
            },
            { 
              label: 'Present Today', 
              value: stats.presentToday, 
              icon: CheckCircle, 
              color: 'green',
              gradient: 'from-green-900 to-green-600',
              bgGradient: 'from-green-50 to-green-100',
              change: `${stats.averageAttendance}% rate`,
              trend: 'up'
            },
            { 
              label: 'Absent Today', 
              value: stats.absentToday, 
              icon: XCircle, 
              color: 'red',
              gradient: 'from-red-800 to-red-700',
              bgGradient: 'from-red-50 to-red-100',
              change: stats.absentToday > stats.presentToday ? 'High' : 'Normal',
              trend: stats.absentToday > stats.presentToday ? 'down' : 'up'
            },
            { 
              label: 'Attendance Rate', 
              value: `${stats.averageAttendance}%`, 
              icon: TrendingUp, 
              color: stats.averageAttendance >= 80 ? 'green' : 'orange',
              gradient: stats.averageAttendance >= 80 ? 'from-green-800 to-green-600' : 'from-orange-500 to-orange-600',
              bgGradient: stats.averageAttendance >= 80 ? 'from-green-50 to-green-100' : 'from-orange-50 to-orange-100',
              change: stats.averageAttendance >= 80 ? 'Excellent' : 'Needs attention',
              trend: stats.averageAttendance >= 80 ? 'up' : 'down'
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
              className={`${getRoleCardClass()} rounded-2xl shadow-lg p-6 border backdrop-blur-sm relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend === 'up' 
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-400/2 text-black-700' 
                    : 'bg-gradient-to-r from-red-700 to-red-400 text-black-700'
                   }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                  {stat.trend === 'up' ? '↗' : '↘'}
                </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>{stat.label}</p>
                  <p className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{stat.value}</p>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>{stat.change}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              label: 'Active Classes', 
              value: stats.activeClasses, 
              icon: BookOpen, 
              color: 'purple',
              gradient: 'from-purple-500 to-purple-600',
              bgGradient: 'from-purple-50 to-purple-100',
              change: `${classes.length} total classes`,
              description: 'Classes you manage'
            },
            { 
              label: 'Messages Sent', 
              value: stats.messagesSent, 
              icon: MessageSquare, 
              color: 'blue',
              gradient: 'from-blue-500 to-blue-600',
              bgGradient: 'from-blue-50 to-blue-100',
              change: 'This week',
              description: 'Communication activity'
            },
            { 
              label: 'System Health', 
              value: '98.5%', 
              icon: Zap, 
              color: 'indigo',
              gradient: 'from-indigo-500 to-indigo-600',
              bgGradient: 'from-indigo-50 to-indigo-100',
              change: 'Uptime',
              description: 'Platform availability'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                y: -4,
                transition: { type: "spring", stiffness: 400 }
              }}
              className={`bg-gradient-to-br ${stat.bgGradient} rounded-xl shadow-md p-5 border border-white/50 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-md`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.change}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-600">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div 
        className="p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className={`${getRoleCardClass()} rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm border`}
        >
          {/* Enhanced Tabs */}
       {/* Enhanced Navigation Tabs */}
<div className={`relative overflow-hidden transition-all duration-700 ${
  isDark 
    ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800' 
    : 'bg-gradient-to-br from-white via-blue-50/50 to-emerald-50'
} border-b ${isDark ? 'border-slate-700/50' : 'border-emerald-100'} shadow-2xl`}>
  
  {/* Animated gradient orbs */}
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl ${
        isDark ? 'bg-cyan-500/20' : 'bg-cyan-400/30'
      }`}
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl ${
        isDark ? 'bg-purple-500/20' : 'bg-purple-400/30'
      }`}
      animate={{
        x: [0, -100, 0],
        y: [0, -50, 0],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  </div>

  {/* Floating particles */}
  <div className="absolute inset-0">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute w-1 h-1 rounded-full ${
          isDark ? 'bg-emerald-400/40' : 'bg-emerald-400/60'
        }`}
        initial={{
          x: Math.random() * 100 + '%',
          y: Math.random() * 100 + '%',
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>

  <nav className="relative flex p-3 gap-2">
    {[
      { 
        key: 'overview', 
        label: 'Dashboard Overview', 
        icon: BarChart3
      },
      { 
        key: 'attendance', 
        label: 'Attendance Management', 
        icon: Calendar
      },
      { 
        key: 'students', 
        label: 'Students', 
        icon: Users
      },
      { 
        key: 'messages', 
        label: 'Send Messages', 
        icon: Send
      },
      {
        key: 'studentMessages',
        label: 'Student Questions',
        icon: MessageSquare
      },
      { 
        key: 'staffComm', 
        label: 'Staff Communication', 
        icon: Mail
      }
    ].map((tab, index) => (
      <motion.div
        key={tab.key}
        className="relative flex-1"
        initial={{ opacity: 0, y: -20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay: index * 0.1,
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ y: -2 }}
      >
        <motion.button
          variants={{
            inactive: {
              scale: 1,
              background: isDark 
                ? 'rgba(15, 23, 42, 0.4)' 
                : 'rgba(255, 255, 255, 0.6)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            },
            active: {
              scale: 1.02,
              background: isDark 
                ? 'rgba(15, 23, 42, 0.8)' 
                : 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }
          }}
          initial="inactive"
          animate={activeTab === tab.key ? "active" : "inactive"}
          onClick={() => setActiveTab(tab.key)}
          className={`flex items-center justify-center px-6 py-5 text-sm font-bold rounded-2xl backdrop-blur-xl transition-all duration-500 w-full relative overflow-hidden group ${
            activeTab === tab.key
              ? isDark 
                ? 'text-white shadow-2xl' 
                : 'text-gray-900 shadow-2xl'
              : isDark
                ? 'text-slate-300'
                : 'text-gray-600'
          }`}
        >
          
          {/* Main background */}
          <div className={`absolute inset-0 rounded-2xl backdrop-blur-xl ${
            isDark ? 'bg-slate-900/90' : 'bg-white/90'
          }`} />
          
          <div className="relative z-10 flex items-center justify-center space-x-3">
            <motion.div
              className="relative"
              whileHover={{ 
                scale: 1.2,
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 0.5 }}
            >
              <tab.icon className={`h-5 w-5 transition-all duration-500 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`} />
              
              {/* Icon glow */}
              {activeTab === tab.key && (
                <motion.div
                  className={`absolute inset-0 rounded-full blur-md ${
                    isDark ? 'bg-emerald-400/30' : 'bg-emerald-500/30'
                  }`}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
            
            <motion.span
              className="font-semibold tracking-wide whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {tab.label}
            </motion.span>
          </div>

          {/* Active indicator - floating dots */}
          {activeTab === tab.key && (
            <motion.div
              className="absolute -top-1 -right-1 flex space-x-1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  className={`w-1 h-1 rounded-full ${
                    isDark ? 'bg-emerald-400' : 'bg-emerald-500'
                  }`}
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: dot * 0.2
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    ))}
  </nav>
</div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
{activeTab === 'overview' && (
  <motion.div
    key="overview"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-8"
  >
   {userDepartment && (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ 
      scale: 1.02,
      y: -5,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }}
    className={`rounded-3xl shadow-2xl p-8 border-2 backdrop-blur-xl relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 border-slate-700/50' 
        : 'bg-gradient-to-br from-white via-blue-50/90 to-indigo-50/90 border-blue-200/60'
    }`}
  >
    {/* Enhanced Animated Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-teal-600/8 to-cyan-600/12" />
    <motion.div
      animate={{
        backgroundPosition: ['0% 0%', '200% 200%']
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "linear"
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent bg-[length:400%_400%]"
    />
    
    {/* Floating Particles */}
    <motion.div
      animate={{
        y: [0, -15, 0],
        opacity: [0.3, 0.7, 0.3]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay: 0.5
      }}
      className="absolute top-4 right-6 w-3 h-3 bg-emerald-400/40 rounded-full"
    />
    <motion.div
      animate={{
        y: [0, -20, 0],
        opacity: [0.2, 0.6, 0.2]
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        delay: 1
      }}
      className="absolute bottom-8 left-8 w-2 h-2 bg-cyan-400/30 rounded-full"
    />

    <div className="relative">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <motion.div
            whileHover={{ 
              scale: 1.15,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 }
            }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-2xl mr-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
            <Building2 className="h-8 w-8 text-white relative z-10" />
          </motion.div>
          <div>
            <motion.h3
              whileHover={{ x: 3 }}
              className={`text-3xl font-bold bg-gradient-to-r ${
                isDark 
                  ? 'from-emerald-300 to-cyan-300' 
                  : 'from-emerald-700 to-cyan-700'
              } bg-clip-text text-transparent`}
            >
              {userDepartment.name}
            </motion.h3>
            <motion.p
              whileHover={{ x: 3 }}
              className={`text-sm font-medium flex items-center space-x-2 mt-2 ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}
            >
              <span>🏢 Your Department</span>
              <span className="w-1 h-1 bg-current rounded-full opacity-60"></span>
              <span>{userDepartment.staffCount || 0} Staff Members</span>
            </motion.p>
          </div>
        </div>
        <motion.button
          whileHover={{ 
            scale: 1.08,
            boxShadow: "0 20px 40px -15px rgba(5, 150, 105, 0.4)",
            y: -2
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/profile/staff/${user?.id}`)}
          className={`px-7 py-3.5 text-sm font-semibold rounded-2xl transition-all backdrop-blur-xl border-2 relative overflow-hidden group ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-700/90 to-cyan-700/90 text-emerald-100 border-emerald-500/40 hover:from-emerald-600/90 hover:to-cyan-600/90' 
              : 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white border-emerald-400/60 hover:from-emerald-600 hover:to-cyan-700'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <span className="flex items-center space-x-2 relative z-10">
            <User className="h-4 w-4" />
            <span>View Profile</span>
          </span>
        </motion.button>
      </div>
      
      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description Section */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="space-y-4 lg:col-span-1"
        >
          {userDepartment.description && (
            <motion.div
              whileHover={{ x: 4 }}
              className={`p-5 rounded-2xl backdrop-blur-xl border-2 ${
                isDark 
                  ? 'bg-slate-700/60 border-slate-600/50 hover:border-emerald-500/30' 
                  : 'bg-white/70 border-blue-200/60 hover:border-emerald-400/60'
              } transition-all duration-300`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-xl ${
                  isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}>
                  <BookOpen className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <p className={`text-sm font-semibold ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Department Description
                </p>
              </div>
              <p className={`text-sm leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {userDepartment.description}
              </p>
            </motion.div>
          )}
        </motion.div>
        
        {/* Stats Section */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classes Managed */}
          <motion.div
            whileHover={{ 
              scale: 1.05,
              y: -4,
              transition: { type: "spring", stiffness: 400 }
            }}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/12 to-emerald-600/10 border-2 border-emerald-300/30 dark:border-emerald-500/20 backdrop-blur-xl overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-400/10 rounded-full transform -translate-x-8 translate-y-8" />
            
            <div className="relative z-10 text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`text-5xl font-bold mb-3 bg-gradient-to-r ${
                  isDark ? 'from-emerald-300 to-teal-300' : 'from-emerald-600 to-teal-600'
                } bg-clip-text text-transparent`}
              >
                {classes.length}
              </motion.div>
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className={`h-5 w-5 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-500'
                }`} />
                <p className={`text-sm font-semibold ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Classes Managed
                </p>
              </div>
            </div>
          </motion.div>

          {/* Total Students */}
          <motion.div
            whileHover={{ 
              scale: 1.05,
              y: -4,
              transition: { type: "spring", stiffness: 400, delay: 0.1 }
            }}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-blue-500/12 to-indigo-600/10 border-2 border-cyan-300/30 dark:border-cyan-500/20 backdrop-blur-xl overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-20 h-20 bg-cyan-400/10 rounded-full transform -translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-400/10 rounded-full transform translate-x-8 translate-y-8" />
            
            <div className="relative z-10 text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className={`text-5xl font-bold mb-3 bg-gradient-to-r ${
                  isDark ? 'from-cyan-300 to-blue-300' : 'from-cyan-600 to-blue-600'
                } bg-clip-text text-transparent`}
              >
                {classes.reduce((total, cls) => total + (cls.studentCount || 0), 0)}
              </motion.div>
              <div className="flex items-center justify-center space-x-2">
                <Users className={`h-5 w-5 ${
                  isDark ? 'text-cyan-400' : 'text-cyan-500'
                }`} />
                <p className={`text-sm font-semibold ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Total Students
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Enhanced Department Head Section */}
      {userDepartment.head && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-gray-300/50 dark:border-slate-600/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`p-3 rounded-2xl ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200'
                }`}
              >
                <Crown className={`h-6 w-6 ${
                  isDark ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </motion.div>
              <div>
                <p className={`text-sm font-medium ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Department Head
                </p>
                <p className={`font-bold text-lg ${
                  isDark ? 'text-slate-300' : 'text-gray-800'
                }`}>
                  {userDepartment.head.name}
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`px-5 py-3 rounded-xl text-sm font-medium backdrop-blur-xl border-2 ${
                isDark 
                  ? 'bg-purple-900/30 text-purple-300 border-purple-500/30 hover:bg-purple-800/30' 
                  : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
              } transition-all duration-300`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{userDepartment.head.email}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  </motion.div>
)}

    {/* Class Selection Section - FIXED TEXT COLORS */}
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <BookOpen className="h-5 w-5 mr-2 text-emerald-600" />
          Your Classes
        </h3>
        <span className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-slate-400' : 'text-gray-500'
        }`}>{classes.length} classes total</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classInfo) => (
          <motion.div
            key={classInfo.id}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`rounded-xl p-6 border shadow-sm cursor-pointer backdrop-blur-sm transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-emerald-500/50' 
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400'
            }`}
            onClick={() => {
              setSelectedClassId(classInfo.id);
              setActiveTab('attendance');
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{classInfo.name}</h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>{classInfo.studentCount} students</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                classInfo.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                classInfo.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {classInfo.attendanceRate}% attendance
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>Quick Actions:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700' 
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClassId(classInfo.id);
                    setActiveTab('attendance');
                  }}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Take Attendance
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700' 
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClassId(classInfo.id);
                    setActiveTab('students');
                  }}
                >
                  <Users className="h-3 w-3 mr-1" />
                  View Students
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMessageType('class');
                    setMessageForm(prev => ({ ...prev, classId: classInfo.id.toString() }));
                    setActiveTab('messages');
                    setShowMessageForm(true);
                  }}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send Message
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* All Classes Option */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className={`rounded-xl p-6 border shadow-sm cursor-pointer border-dashed backdrop-blur-sm transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-900/20 border-emerald-600/50 hover:border-emerald-400' 
              : 'bg-gradient-to-br from-emerald-50 to-emerald-50 border-emerald-200 hover:border-emerald-400'
          }`}
          onClick={() => {
            setSelectedClassId('ALL');
            setActiveTab('students');
          }}
        >
          <div className="text-center space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-emerald-800/50' : 'bg-emerald-100'
            }`}>
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>All Classes</h4>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>Manage all students together</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark 
                  ? 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
              onClick={() => {
                setSelectedClassId('ALL');
                setActiveTab('students');
              }}
            >
              View All Students
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
    
    {/* Analytics Section */}
    <div className="space-y-6">
      <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
        Analytics & Insights
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Chart */}
        <div className={`${getRoleCardClass()} rounded-xl p-6 border shadow-sm backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Weekly Attendance Trend</h4>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {analytics.weeklyAttendance.slice(0, 7).map((day, index) => {
              const total = day.present + day.absent;
              const percentage = total > 0 ? (day.present / total) * 100 : 0;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-16 text-xs transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="flex-1">
                    <div className={`w-full rounded-full h-2 ${
                      isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={`w-12 text-xs font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {Math.round(percentage)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Class Performance Comparison */}
        <div className={`${getRoleCardClass()} rounded-xl p-6 border shadow-sm backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Class Performance</h4>
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {classes.slice(0, 5).map((cls, index) => (
              <div key={cls.id} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-yellow-600' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{cls.name}</div>
                  <div className={`text-xs transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>{cls.studentCount} students</div>
                </div>
                <div className={`text-sm font-semibold ${
                  cls.attendanceRate >= 90 ? 'text-green-600' :
                  cls.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {cls.attendanceRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Recent Activity */}
    <div className={`rounded-xl p-6 border backdrop-blur-sm transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700' 
        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold flex items-center transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <Activity className="h-5 w-5 mr-2 text-emerald-600" />
          Recent Activity
        </h4>
        <span className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-emerald-400' : 'text-emerald-600'
        }`}>Last 24 hours</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-3 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className={`transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}>Attendance marked for {stats.presentToday + stats.absentToday} students today</span>
          <span className={`transition-colors duration-300 ${
            isDark ? 'text-slate-500' : 'text-gray-500'
          }`}>{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <span className={`transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}>Sent {messages.filter(m => {
            const today = new Date().toDateString();
            return new Date(m.createdAt).toDateString() === today;
          }).length} messages to students</span>
          <span className={`transition-colors duration-300 ${
            isDark ? 'text-slate-500' : 'text-gray-500'
          }`}>Today</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className={`transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}>Overall attendance rate: {stats.averageAttendance}%</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            stats.averageAttendance >= 85 ? 'bg-green-100 text-green-800' :
            stats.averageAttendance >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {stats.averageAttendance >= 85 ? 'Excellent' :
             stats.averageAttendance >= 70 ? 'Good' : 'Needs Improvement'}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
)}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <motion.div
                  key="students"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Class Filters */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        <Users className="h-5 w-5 mr-2 text-emerald-600" />
                        Students
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        {user?.role === 'STAFF' ? 
                          `Managing students in your department` : 
                          'Filter by department and class to manage students'
                        }
                      </p>
                    </div>
                    
                    {/* Department Filter - Only show for superadmin */}
                    {user?.role === 'SUPER_ADMIN' && (
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          Department
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors duration-300 ${
                              selectedDepartmentId === 'ALL' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : isDark
                                  ? 'bg-slate-800 text-slate-300 border-blue-600/50 hover:bg-blue-900/30'
                                  : 'bg-white text-gray-700 border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={() => setSelectedDepartmentId('ALL')}
                          >
                            All Departments
                          </button>
                          {departments.map(dept => (
                            <button
                              key={dept.id}
                              className={`px-3 py-1.5 text-xs rounded-full border transition-colors duration-300 ${
                                selectedDepartmentId === dept.id 
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : isDark
                                    ? 'bg-slate-800 text-slate-300 border-blue-600/50 hover:bg-blue-900/30'
                                    : 'bg-white text-gray-700 border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={() => setSelectedDepartmentId(dept.id)}
                            >
                              {dept.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Class Filter */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Class
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`px-3 py-1.5 text-xs rounded-full border transition-colors duration-300 ${
                            selectedClassId === 'ALL' 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : isDark
                                ? 'bg-slate-800 text-slate-300 border-emerald-600/50 hover:bg-emerald-900/30'
                                : 'bg-white text-gray-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                          onClick={() => setSelectedClassId('ALL')}
                        >
                          All Classes
                        </button>
                      {classes.map(c => (
                        <button
                          key={c.id}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-colors duration-300 ${
                            selectedClassId === c.id 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : isDark
                                ? 'bg-slate-800 text-slate-300 border-emerald-600/50 hover:bg-emerald-900/30'
                                : 'bg-white text-gray-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                          onClick={() => setSelectedClassId(c.id)}
                        >
                          {c.name}
                        </button>
                      ))}
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                      placeholder="Search by name, roll number, or email"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors duration-300 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-400' 
                          : 'bg-white border-emerald-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Student List */}
                  {students.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-center py-12 rounded-lg border border-dashed transition-colors duration-300 ${
                        isDark 
                          ? 'bg-slate-800/30 border-emerald-600/50' 
                          : 'bg-emerald-50 border-emerald-300'
                      }`}
                    >
                      <Users className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                      <p className={`transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}>No students found</p>
                      <p className="text-sm text-emerald-400 mt-1">Select a class to view students</p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students.map((s) => (
                        <motion.div
                          key={s.id}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className={`${getRoleCardClass()} rounded-lg p-4 border shadow-sm`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="bg-emerald-100 p-2 rounded-full mr-3">
                                <User className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <div className={`font-medium transition-colors duration-300 ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>{s.name}</div>
                                <div className={`text-xs transition-colors duration-300 ${
                                  isDark ? 'text-slate-400' : 'text-gray-500'
                                }`}>Roll: {s.rollNumber}</div>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {s.class?.name || 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                              onClick={() => {
                                setSelectedClassId(s.class?.id || 'ALL');
                                setActiveTab('attendance');
                              }}
                            >
                              Take Attendance
                            </button>
                            <button
                              className="flex-1 px-3 py-2 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                              onClick={() => {
                                setMessageType('individual');
                                setMessageForm(prev => ({ ...prev, studentId: String(s.id) }));
                                setActiveTab('messages');
                                setShowMessageForm(true);
                              }}
                            >
                              Message
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-600">
                      Page {studentPage} of {Math.max(1, Math.ceil(studentsTotal / studentPageSize))} • {studentsTotal} students
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg border border-emerald-300 hover:bg-emerald-50"
                        disabled={studentPage <= 1}
                        onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                      >
                        Prev
                      </button>
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg border border-emerald-300 hover:bg-emerald-50"
                        disabled={studentPage >= Math.ceil(studentsTotal / studentPageSize)}
                        onClick={() => setStudentPage(p => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <motion.div
                  key="attendance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Date Selector and Actions */}
                  <div className="flex flex-col space-y-6">
                    {/* Calendar and Class Selection Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="relative">
                        <ModernCalendar
                          label="Select Date"
                          value={selectedDate}
                          onChange={setSelectedDate}
                          placeholder="Select date for attendance"
                        />
                      </div>
                      <div className="relative">
                        <ModernDropdown
                          label="Select Class"
                          value={selectedClassId === 'ALL' ? 'ALL' : selectedClassId.toString()}
                          onChange={(value) => setSelectedClassId(value === 'ALL' ? 'ALL' : Number(value))}
                          options={[
                            { value: 'ALL', label: 'All Classes', icon: <BookOpen className="h-4 w-4" />, description: 'View all students' },
                            ...classes.map(c => ({
                              value: c.id.toString(),
                              label: c.name,
                              description: `${c.studentCount} students`,
                              icon: <BookOpen className="h-4 w-4" />
                            }))
                          ]}
                          placeholder="Select class"
                          searchable
                        />
                      </div>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="flex justify-end items-center">
                      <div className="flex items-center gap-4">
                        {/* Export Dropdown */}
                        <div className="relative">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setShowExportDropdown(!showExportDropdown)}
    className={`flex items-center px-5 py-2 rounded-lg transition-colors shadow-sm ${
      showExportDropdown
        ? "bg-red-100 text-red-700 hover:bg-red-200"
        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
    }`}
  >
    {showExportDropdown ? (
      <>
        <XCircle size={16} className="mr-2" />
        Close
        <ChevronUp size={16} className="ml-2" />
      </>
    ) : (
      <>
        <Download size={16} className="mr-2" />
        Export
        <ChevronDown size={16} className="ml-2" />
      </>
    )}
  </motion.button>

  <AnimatePresence>
    {showExportDropdown && (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-emerald-200 z-10"
      >
        <div className="p-2">
          <p className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">Today's Attendance</p>
          
          <div className="grid grid-cols-2 gap-1 mb-3">
            <button
              onClick={exportToXLS}
              className="flex items-center justify-center px-3 py-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors rounded-lg border border-green-200"
            >
              <FileText size={14} className="mr-1" />
              XLS
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-lg border border-red-200"
            >
              <FileText size={14} className="mr-1" />
              PDF
            </button>
          </div>
          
          <hr className="my-2" />
          
          <p className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">Last 7 Days Report</p>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={exportLastWeekToXLS}
              className="flex items-center justify-center px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors rounded-lg border border-blue-200"
            >
              <FileText size={14} className="mr-1" />
              XLS
            </button>
            <button
              onClick={exportLastWeekToPDF}
              className="flex items-center justify-center px-3 py-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors rounded-lg border border-purple-200"
            >
              <FileText size={14} className="mr-1" />
              PDF
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={saveAttendance}
                        disabled={loading}
                        className="flex items-center px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="rounded-full h-4 w-4 border-b-2 border-white mr-2"
                          />
                        ) : (
                          <CheckCircle size={16} className="mr-2" />
                        )}
                        {loading ? 'Saving...' : 'Save Attendance'}
                      </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Attendance List */}
                  {loading ? (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"
                      />
                      <p className="text-gray-500 mt-2">Loading attendance data...</p>
                    </motion.div>
                  ) : attendanceData.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 bg-emerald-50 rounded-lg border border-dashed border-emerald-300"
                    >
                      <Users className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-gray-500">No students found</p>
                      <p className="text-sm text-emerald-400 mt-1">Add students to start tracking attendance</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="grid gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {/* Enhanced Attendance List Items */}
{attendanceData.map((record, index) => (
  <motion.div
    key={record.studentId}
    variants={itemVariants}
    custom={index}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`rounded-lg p-4 border shadow-sm backdrop-blur-sm transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-emerald-500/50' 
        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300'
    }`}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
      <div className="flex items-center">
        <div className={`p-2 rounded-full mr-3 ${
          isDark ? 'bg-emerald-800/50' : 'bg-emerald-100'
        }`}>
          <User className={`h-4 w-4 ${
            isDark ? 'text-emerald-400' : 'text-emerald-600'
          }`} />
        </div>
        <div>
          <h3 className={`font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{record.studentName}</h3>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-gray-500'
          }`}>Roll: {record.rollNumber}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => markAttendance(record.studentId, 'PRESENT')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            record.status === 'PRESENT'
              ? 'bg-green-600 text-white shadow-md'
              : isDark
                ? 'bg-slate-700 text-slate-300 hover:bg-green-900/50 hover:text-green-300'
                : 'bg-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-700'
          }`}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Present
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => markAttendance(record.studentId, 'ABSENT')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            record.status === 'ABSENT'
              ? 'bg-red-800 text-white shadow-md'
              : isDark
                ? 'bg-slate-700 text-slate-300 hover:bg-red-900/50 hover:text-red-300'
                : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700'
          }`}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Absent
        </motion.button>
      </div>
    </div>
    {record.status === 'ABSENT' && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-3"
      >
        <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}>
          Remarks (optional)
        </label>
        <input
          type="text"
          value={record.remarks || ''}
          onChange={(e) => setRemarks(record.studentId, e.target.value)}
          placeholder="Reason for absence..."
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
            isDark
              ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-400'
              : 'bg-white border-emerald-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
          }`}
        />
      </motion.div>
    )}
  </motion.div>
))}
                    </motion.div>
                  )}
                  
                  {/* Attendance Pagination */}
                  {attendanceData.length > 0 && (
                    <div className={`flex items-center justify-between pt-4 border-t transition-colors duration-300 ${
                      isDark ? 'border-slate-600' : 'border-emerald-200'
                    }`}>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        Page {attendancePagination.currentPage} of {attendancePagination.totalPages} • {attendancePagination.totalItems} students
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                            attendancePagination.hasPreviousPage
                              ? isDark
                                ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-900/30'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : isDark
                                ? 'border-slate-600 text-slate-500 cursor-not-allowed'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!attendancePagination.hasPreviousPage}
                          onClick={() => setAttendancePage(prev => Math.max(1, prev - 1))}
                        >
                          <ChevronLeft className="h-3 w-3 mr-1 inline" />
                          Prev
                        </motion.button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, attendancePagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, attendancePagination.currentPage - 2) + i;
                          if (pageNum <= attendancePagination.totalPages) {
                            return (
                              <motion.button
                                key={pageNum}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setAttendancePage(pageNum)}
                                className={`w-8 h-8 text-xs rounded-lg transition-all duration-200 ${
                                  pageNum === attendancePagination.currentPage
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : isDark
                                      ? 'border border-slate-600 text-slate-400 hover:bg-emerald-900/30 hover:text-emerald-400'
                                      : 'border border-emerald-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                {pageNum}
                              </motion.button>
                            );
                          }
                          return null;
                        })}
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                            attendancePagination.hasNextPage
                              ? isDark
                                ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-900/30'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : isDark
                                ? 'border-slate-600 text-slate-500 cursor-not-allowed'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!attendancePagination.hasNextPage}
                          onClick={() => setAttendancePage(prev => prev + 1)}
                        >
                          Next
                          <ChevronRight className="h-3 w-3 ml-1 inline" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Messages Tab */}
{activeTab === 'messages' && (
  <motion.div
    key="messages"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {/* Header Section */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <MessageSquare className="h-5 w-5 mr-2 text-emerald-600" />
          Student Communication
        </h3>
        <p className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-slate-400' : 'text-gray-500'
        }`}>Send messages and announcements to students</p>
      </div>
      
      {/* Send Message Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMessageForm(true)}
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 shadow-lg font-medium"
      >
        <Send className="h-5 w-5 mr-2" />
        Send New Message
      </motion.button>
    </div>

    {/* Enhanced Message Form */}
    <AnimatePresence>
      {showMessageForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className={`rounded-2xl p-6 border-2 shadow-2xl backdrop-blur-sm transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600' 
              : 'bg-gradient-to-br from-white to-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {messageType === 'announcement' ? '📢 Send Announcement' :
               messageType === 'class' ? '👥 Send Class Message' :
               messageType === 'group' ? '👨‍👩‍👧‍👦 Send Group Message' :
               '💬 Send Individual Message'}
            </h3>
            <motion.button
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMessageForm(false)}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <XCircle className="h-5 w-5" />
            </motion.button>
          </div>
          
          {/* Message Type Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Message Type
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'individual', label: 'Individual', icon: User, color: 'blue' },
                { key: 'group', label: 'Group', icon: Users, color: 'purple' },
                { key: 'class', label: 'Class', icon: BookOpen, color: 'green' },
                { key: 'announcement', label: 'Announcement', icon: Bell, color: 'orange' }
              ].map((type) => (
                <motion.button
                  key={type.key}
                  type="button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMessageType(type.key as 'individual' | 'group' | 'class' | 'announcement');
                    setMessageForm({ 
                      studentId: '', 
                      studentIds: [], 
                      classId: '', 
                      content: '', 
                      file: null 
                    });
                  }}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                    messageType === type.key
                      ? isDark
                        ? `border-${type.color}-500 bg-${type.color}-900/30 text-${type.color}-300 shadow-lg`
                        : `border-${type.color}-500 bg-${type.color}-100 text-${type.color}-700 shadow-md`
                      : isDark
                        ? 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <type.icon className={`h-6 w-6 mb-2 ${
                    messageType === type.key ? `text-${type.color}-500` : ''
                  }`} />
                  <span className="text-sm font-medium">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
          
          <form onSubmit={sendMessage} className="space-y-6">
            {/* Individual Student Selection */}
            {messageType === 'individual' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <ModernDropdown
                  label="Select Student"
                  required
                  value={messageForm.studentId}
                  onChange={(value) => setMessageForm({ ...messageForm, studentId: value })}
                  options={[
                    { value: '', label: 'Choose a student...', disabled: true },
                    ...students.map((student) => ({
                      value: student.id.toString(),
                      label: student.name,
                      description: `${student.rollNumber} - ${student.class?.name || 'No Class'}`,
                      icon: <User className="h-4 w-4" />
                    }))
                  ]}
                  placeholder="Choose a student..."
                  searchable
                  clearable
                />
              </motion.div>
            )}
            
            {/* Class Selection */}
            {messageType === 'class' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <ModernDropdown
                  label="Select Class"
                  required
                  value={messageForm.classId}
                  onChange={(value) => setMessageForm({ ...messageForm, classId: value })}
                  options={[
                    { value: '', label: 'Choose a class...', disabled: true },
                    ...classes.map((classInfo) => ({
                      value: classInfo.id.toString(),
                      label: classInfo.name,
                      description: `${classInfo.studentCount} students`,
                      icon: <BookOpen className="h-4 w-4" />
                    }))
                  ]}
                  placeholder="Choose a class..."
                  searchable
                  clearable
                />
                {messageForm.classId && (
                  <div className={`text-sm p-3 rounded-lg border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Message will be sent to all {classes.find(c => c.id === Number(messageForm.classId))?.studentCount || 0} students in this class
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Group Student Selection */}
            {messageType === 'group' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className={`block text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Select Students ({messageForm.studentIds.length} selected)
                </label>
                <div className={`max-h-48 overflow-y-auto border-2 rounded-xl p-4 space-y-2 transition-colors duration-300 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-600' 
                    : 'bg-white border-emerald-200'
                }`}>
                  <div className="flex items-center p-2 rounded-lg bg-opacity-50">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={messageForm.studentIds.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMessageForm({ ...messageForm, studentIds: students.map(s => s.id) });
                        } else {
                          setMessageForm({ ...messageForm, studentIds: [] });
                        }
                      }}
                      className={`rounded border-2 focus:ring-2 focus:ring-emerald-500 mr-3 ${
                        isDark 
                          ? 'bg-slate-700 border-slate-500 text-emerald-500' 
                          : 'bg-white border-gray-300 text-emerald-600'
                      }`}
                    />
                    <label htmlFor="select-all" className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      Select All Students ({students.length})
                    </label>
                  </div>
                  <div className="border-t pt-2 mt-2 space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center p-2 rounded-lg hover:bg-opacity-50 transition-colors duration-200">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={messageForm.studentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMessageForm({ 
                                ...messageForm, 
                                studentIds: [...messageForm.studentIds, student.id] 
                              });
                            } else {
                              setMessageForm({ 
                                ...messageForm, 
                                studentIds: messageForm.studentIds.filter(id => id !== student.id) 
                              });
                            }
                          }}
                          className={`rounded border-2 focus:ring-2 focus:ring-emerald-500 mr-3 ${
                            isDark 
                              ? 'bg-slate-700 border-slate-500 text-emerald-500' 
                              : 'bg-white border-gray-300 text-emerald-600'
                          }`}
                        />
                        <label htmlFor={`student-${student.id}`} className={`text-sm flex-1 transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <span className="font-medium">{student.name}</span>
                          <span className={`ml-2 transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            ({student.rollNumber}) - {student.class?.name || 'No Class'}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {messageForm.studentIds.length > 0 && (
                  <div className={`text-sm p-3 rounded-lg border transition-colors duration-300 ${
                    isDark 
                      ? 'bg-purple-900/30 text-purple-300 border-purple-700' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    <Users className="h-4 w-4 inline mr-2" />
                    Message will be sent to {messageForm.studentIds.length} selected student{messageForm.studentIds.length !== 1 ? 's' : ''}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Announcement Info */}
            {messageType === 'announcement' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl border-2 transition-colors duration-300 ${
                  isDark 
                    ? 'bg-orange-900/20 text-orange-300 border-orange-700' 
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}
              >
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Announcement to All Students</p>
                    <p className="text-sm opacity-90 mt-1">
                      This announcement will be sent to all {stats.totalStudents} students across all classes
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Message Content */}
            <div>
              <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Message Content
              </label>
              <textarea
                required
                rows={5}
                value={messageForm.content}
                onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                placeholder="Type your message here... You can include important announcements, reminders, or individual feedback."
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 resize-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white border-emerald-200 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                }`}
              />
              <div className={`text-xs mt-2 transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                {messageForm.content.length}/1000 characters
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Attach File (optional)
              </label>
              <div className="flex items-center gap-4">
                <motion.label
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center px-6 py-3 rounded-xl cursor-pointer border-2 border-dashed transition-all duration-300 font-medium ${
                    isDark
                      ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-emerald-500'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-emerald-400'
                  }`}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose File
                  <input
                    type="file"
                    onChange={(e) => setMessageForm({ ...messageForm, file: e.target.files?.[0] || null })}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xlsx,.xls,.ppt,.pptx"
                    className="hidden"
                  />
                </motion.label>
                {messageForm.file && (
                  <div className="flex items-center gap-2">
                    <FileText className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}>{messageForm.file.name}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setMessageForm({ ...messageForm, file: null })}
                      className={`p-1 rounded-lg transition-colors duration-300 ${
                        isDark 
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                    </motion.button>
                  </div>
                )}
              </div>
              <p className={`text-xs mt-2 transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Supported formats: PDF, DOC, DOCX, Images (JPG, PNG, GIF), TXT, Excel, PowerPoint (Max: 10MB)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-300 shadow-lg font-medium"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="rounded-full h-5 w-5 border-b-2 border-white mr-3"
                    />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    {messageType === 'announcement' ? 'Send Announcement' :
                     messageType === 'class' ? `Send to Class` :
                     messageType === 'group' ? `Send to ${messageForm.studentIds.length} Student${messageForm.studentIds.length !== 1 ? 's' : ''}` :
                     'Send Message'}
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMessageForm(false)}
                className={`px-6 py-3 rounded-xl border-2 font-medium transition-all duration-300 ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Enhanced Messages List */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className={`text-lg font-semibold transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Sent Messages ({messages.length})
        </h4>
        <div className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-slate-400' : 'text-gray-500'
        }`}>
          Sorted by latest first
        </div>
      </div>

      {loading ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`rounded-full h-10 w-10 border-b-2 mx-auto mb-4 ${
              isDark ? 'border-emerald-400' : 'border-emerald-600'
            }`}
          />
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-gray-500'
          }`}>Loading messages...</p>
        </motion.div>
      ) : messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-16 rounded-2xl border-2 border-dashed transition-colors duration-300 ${
            isDark 
              ? 'bg-slate-800/30 border-slate-700' 
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <MessageSquare className={`h-16 w-16 mx-auto mb-4 ${
            isDark ? 'text-slate-600' : 'text-emerald-400'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-900'
          }`}>No messages sent yet</h3>
          <p className={`mb-6 transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-gray-500'
          }`}>Start communicating with your students by sending your first message</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMessageForm(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 font-medium"
          >
            <Send className="h-5 w-5 mr-2" />
            Send First Message
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              variants={itemVariants}
              custom={index}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`rounded-2xl p-6 border-2 shadow-sm backdrop-blur-sm transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-emerald-500/50' 
                  : 'bg-gradient-to-br from-white to-emerald-50 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                <div className="flex items-center flex-1">
                  <div className={`p-3 rounded-xl mr-4 ${
                    message.isAnnouncement 
                      ? isDark ? 'bg-orange-900/50' : 'bg-orange-100'
                      : isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    {message.isAnnouncement ? (
                      <Bell className={`h-5 w-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    ) : (
                      <User className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`font-semibold transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {message.isAnnouncement ? 
                          '📢 Announcement to All Students' : 
                          `💬 To: ${message.student?.name} (${message.student?.rollNumber})`}
                      </h3>
                      {message.isAnnouncement && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-orange-900/50 text-orange-300 border border-orange-700' 
                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                          Announcement
                        </span>
                      )}
                    </div>
                    <p className={`text-sm flex items-center transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                </div>
                
                {message.fileName && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href={message.filePath || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all duration-300 font-medium ${
                      isDark
                        ? 'bg-slate-800 border-slate-600 text-emerald-400 hover:bg-slate-700 hover:border-emerald-500'
                        : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {message.fileName}
                  </motion.a>
                )}
              </div>
              
              <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-600' 
                  : 'bg-white border-emerald-100'
              }`}>
                <p className={`leading-relaxed transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  {message.content && message.content.includes('[STAFF MESSAGE]')
                    ? (message.content.split('\n\n').pop() || message.content)
                    : message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  </motion.div>
)}

              {/* Student Messages Tab */}
              {activeTab === 'studentMessages' && (
                <motion.div
                  key="studentMessages"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                        Student Questions & Messages
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}>View and reply to questions from your students</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadStudentMessages}
                      className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                        isDark 
                          ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/30' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </motion.button>
                  </div>

                  {/* Student Messages List */}
                  <div className="space-y-4">
                    {studentMsgLoading ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className={`rounded-full h-10 w-10 border-b-2 mx-auto mb-4 ${
                            isDark ? 'border-blue-400' : 'border-blue-600'
                          }`}
                        />
                        <p className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>Loading student messages...</p>
                      </motion.div>
                    ) : studentMessages.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-center py-16 rounded-2xl border-2 border-dashed transition-colors duration-300 ${
                          isDark 
                            ? 'bg-slate-800/30 border-slate-700' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <MessageSquare className={`h-16 w-16 mx-auto mb-4 ${
                          isDark ? 'text-slate-600' : 'text-blue-400'
                        }`} />
                        <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-gray-900'
                        }`}>No messages from students yet</h3>
                        <p className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>When students send you questions or doubts, they will appear here</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {studentMessages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            variants={itemVariants}
                            custom={index}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className={`rounded-2xl p-6 border-2 shadow-sm backdrop-blur-sm transition-all duration-300 ${
                              isDark 
                                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50' 
                                : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                              <div className="flex items-center flex-1">
                                <div className={`p-3 rounded-xl mr-4 ${
                                  message.studentMessageType === 'question' ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100') :
                                  message.studentMessageType === 'doubt' ? (isDark ? 'bg-orange-900/50' : 'bg-orange-100') :
                                  message.studentMessageType === 'clarification' ? (isDark ? 'bg-purple-900/50' : 'bg-purple-100') :
                                  (isDark ? 'bg-green-900/50' : 'bg-green-100')
                                }`}>
                                  {message.studentMessageType === 'question' && 
                                    <MessageSquare className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />}
                                  {message.studentMessageType === 'doubt' && 
                                    <Bell className={`h-5 w-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />}
                                  {message.studentMessageType === 'clarification' && 
                                    <BookOpen className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />}
                                  {(!message.studentMessageType || message.studentMessageType === 'general') && 
                                    <User className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h3 className={`font-semibold transition-colors duration-300 ${
                                      isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      From: {message.student?.name} ({message.student?.rollNumber})
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      message.studentMessageType === 'question' ? (isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700') :
                                      message.studentMessageType === 'doubt' ? (isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700') :
                                      message.studentMessageType === 'clarification' ? (isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700') :
                                      (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
                                    }`}>
                                      {message.studentMessageType?.charAt(0).toUpperCase() + message.studentMessageType?.slice(1) || 'Message'}
                                    </span>
                                    {message.class && (
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {message.class.name}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm flex items-center transition-colors duration-300 ${
                                    isDark ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {message.fileName && (
                                  <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    href={message.filePath || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center px-3 py-2 rounded-lg border transition-all duration-300 font-medium text-sm ${
                                      isDark
                                        ? 'bg-slate-800 border-slate-600 text-blue-400 hover:bg-slate-700 hover:border-blue-500'
                                        : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    File
                                  </motion.a>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setReplyForm({ originalMessageId: message.id.toString(), content: '', file: null });
                                    setShowReplyForm(true);
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Reply
                                </motion.button>
                              </div>
                            </div>
                            
                            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-600' 
                                : 'bg-white border-blue-100'
                            }`}>
                              <p className={`leading-relaxed transition-colors duration-300 ${
                                isDark ? 'text-slate-200' : 'text-gray-700'
                              }`}>
                                {message.content}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Reply Form Modal */}
                  <AnimatePresence>
                    {showReplyForm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReplyForm(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                          className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
                            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Reply to Student
                            </h3>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowReplyForm(false)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            >
                              <XCircle className="h-5 w-5" />
                            </motion.button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                Your Reply
                              </label>
                              <textarea
                                value={replyForm.content}
                                onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                                placeholder="Type your reply here..."
                                rows={4}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                                  isDark 
                                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                Attachment (Optional)
                              </label>
                              <input
                                type="file"
                                onChange={(e) => setReplyForm({ ...replyForm, file: e.target.files?.[0] || null })}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  isDark 
                                    ? 'bg-slate-700 border-slate-600 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 mt-6">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowReplyForm(false)}
                              className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={replyToStudent}
                              disabled={studentMsgLoading || !replyForm.content.trim()}
                              className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {studentMsgLoading ? 'Sending...' : 'Send Reply'}
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Staff Communication Tab */}
              {activeTab === 'staffComm' && (
                <motion.div
                  key="staffComm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className={`text-lg font-semibold flex items-center ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                        Staff Communication
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        View messages from administrators
                      </p>
                    </div>
                    <div className="w-full sm:w-auto">
                      {!showStaffMsgForm ? (
                        <button
                          type="button"
                          onClick={() => setShowStaffMsgForm(true)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            isDark
                              ? 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {/* Message bubble icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                          New Message
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowStaffMsgForm(false);
                            setStaffForm({ recipientId: '', content: '', file: null });
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDark
                              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Send Message to Admin Form */}
                  {showStaffMsgForm && (
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-slate-800/50 border-slate-600' : 'bg-white border-gray-200'
                  }`}>
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Send Message to Administrator
                    </h4>
                    <form onSubmit={sendStaffMessage} className="space-y-4">
                      <div>
                        <ModernDropdown
                          label="Select Administrator"
                          value={staffForm.recipientId}
                          onChange={(value) => setStaffForm({ ...staffForm, recipientId: value })}
                          options={adminList.map((admin) => ({
                            value: admin.id.toString(),
                            label: `${admin.name} (${admin.email})`,
                            description: admin.email,
                            icon: User
                          }))}
                          placeholder="Choose an administrator..."
                          searchable
                          clearable
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          Message
                        </label>
                        <textarea
                          value={staffForm.content}
                          onChange={(e) => setStaffForm({ ...staffForm, content: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          rows={3}
                          placeholder="Type your message here..."
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          Attachment (Optional)
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setStaffForm({ ...staffForm, file: e.target.files?.[0] || null })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 text-white file:bg-emerald-900/30 file:text-emerald-300 hover:file:bg-emerald-800/40' 
                              : 'bg-white border-gray-300 text-gray-900 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100'
                          }`}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowStaffMsgForm(false);
                            setStaffForm({ recipientId: '', content: '', file: null });
                          }}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={staffMsgLoading || !staffForm.content.trim() || !staffForm.recipientId}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {staffMsgLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                  )}

                  {/* Conversations */}
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-slate-800/50 border-slate-600' : 'bg-white border-gray-200'
                  }`}>
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Conversations
                    </h4>
                    {/* Messages from Admin */}
                    <div className="space-y-3">
                      {staffMsgLoading ? (
                        <div className="text-center py-8">
                          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3 ${
                            isDark ? 'border-emerald-400' : 'border-emerald-600'
                          }`}></div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Loading messages...
                          </div>
                        </div>
                      ) : staffMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className={`h-12 w-12 mx-auto mb-4 ${
                            isDark ? 'text-slate-600' : 'text-gray-300'
                          }`} />
                          <p className={`text-lg font-medium mb-2 ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                          }`}>No messages yet</p>
                          <p className={`text-sm ${
                            isDark ? 'text-slate-500' : 'text-gray-400'
                          }`}>Messages with administrators will appear here</p>
                        </div>
                      ) : (
                        staffMessages
                          .sort((a:any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((message:any) => (
                            <div key={message.id} className={`p-4 rounded-lg border ${
                              isDark ? 'bg-slate-800/50 border-slate-600' : 'bg-white border-gray-200'
                            }`}>
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-full ${
                                  message.messageType === 'ADMIN_TO_STAFF'
                                    ? isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                                    : isDark ? 'bg-green-900/50' : 'bg-green-100'
                                }`}>
                                  <User className={`h-4 w-4 ${
                                    message.messageType === 'ADMIN_TO_STAFF'
                                      ? isDark ? 'text-blue-400' : 'text-blue-600'
                                      : isDark ? 'text-green-400' : 'text-green-600'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className={`font-medium ${
                                      isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {message.messageType === 'ADMIN_TO_STAFF' 
                                        ? message.sender?.name 
                                        : message.recipient?.name
                                      }
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      message.messageType === 'ADMIN_TO_STAFF'
                                        ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                                        : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {message.messageType === 'ADMIN_TO_STAFF' ? 'From Admin' : 'To Admin'}
                                    </span>
                                    {message.fileName && (
                                      <button
                                        type="button"
                                        onClick={() => downloadAttachment(message.id, message.fileName)}
                                        className={`inline-flex items-center text-xs px-2 py-1 rounded-md border transition-colors ${
                                          isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                        }`}
                                        title={`Download ${message.fileName}`}
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        {message.fileName}
                                      </button>
                                    )}
                                    {message.messageType === 'ADMIN_TO_STAFF' && !message.isRead && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm ${
                                    isDark ? 'text-slate-400' : 'text-gray-600'
                                  }`}>
                                    {message.messageType === 'ADMIN_TO_STAFF' 
                                      ? message.sender?.email 
                                      : message.recipient?.email
                                    }
                                  </p>
                                  <div className={`mt-2 rounded-md border ${
                                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-gray-200'
                                  }`}>
                                    <p className={`text-sm p-3 ${
                                      isDark ? 'text-slate-200' : 'text-gray-900'
                                    }`}>
                                      {message.content && message.content.includes('[STAFF MESSAGE]')
                                        ? (message.content.split('\n\n').pop() || message.content)
                                        : message.content}
                                    </p>
                                  </div>
                                  <p className={`text-xs mt-2 ${
                                    isDark ? 'text-slate-500' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
