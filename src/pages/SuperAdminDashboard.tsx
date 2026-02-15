import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Plus,
  Edit,
  Edit2,
  Trash2,
  Mail,
  Send,
  MessageSquare,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  DownloadCloud,
  X,
  Eye,
  Target,
  Activity,
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  ArrowLeft,
  // Add these missing icons:
  PieChart,
  AlertTriangle,
  Database,
  HardDrive,
  Save,
  Users2,
  CheckCircle2,
  Award,
  MessageCircle,
  EyeOff,
  Trash,
  Building2
} from "lucide-react";
import { api } from "../utils/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { useRoleTheme } from "../hooks/useRoleTheme";
import DepartmentManagement from "../components/DepartmentManagement";
import { ModernDropdown } from '../components/ui/ModernDropdown';
import { ModernCalendar } from '../components/ui/ModernCalendar';

interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  parentEmail: string;
  class?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  status: "active" | "inactive";
  joinDate: string;
  lastLogin: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  managedClass?: { id: number; name: string } | null;
  managedClasses?: Array<{ id: number; name: string }>; // Support for multiple classes
  department?: { id: number; name: string } | null;
  status: "active" | "inactive";
  joinDate: string;
  lastLogin: string;
}

interface Class {
  id: number;
  name: string;
  staffId?: number | null;
  staff?: { id: number; name: string; email: string } | null;
  department?: { id: number; name: string } | null;
  studentCount: number;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  headId?: number;
  head?: {
    id: number;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  classCount?: number;
}

interface RecentMessage {
  id: number;
  content: string;
  messageType: 'INDIVIDUAL' | 'CLASS' | 'ALL_STUDENTS';
  isAnnouncement: boolean;
  fileName?: string | null;
  student?: {
    id: number;
    name: string;
    rollNumber: string;
  } | null;
  class?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
}

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  activeStudents: number;
  activeStaff: number;
  newRegistrations: number;
  attendanceRate: number;
  averageLogin: number;
  messagesThisWeek: number;
  classesWithLowAttendance: number;
  topPerformingClass: string;
}

interface AnalyticsData {
  attendanceTrends: Array<{ date: string; rate: number; total: number }>;
  departmentPerformance: Array<{ departmentName: string; departmentId: number; attendanceRate: number; studentCount: number; staffCount: number; classCount: number; messagesCount: number; headName: string }>;
  staffActivity: Array<{ staffName: string; classesManaged: number; messagesCount: number; lastActive: string }>;
  systemActivity: Array<{ date: string; logins: number; messages: number; attendanceRecords: number }>;
  loginStats?: {
    totalLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    roleStats: Record<string, number>;
    topUsers: Array<{ user: { name: string; email: string; role: string }; loginCount: number }>;
  };
}

interface ReportData {
  type: 'attendance' | 'performance' | 'activity' | 'summary';
  dateRange: { start: string; end: string };
  data: any;
  generatedAt: string;
}

interface RecentActivity {
  id: number;
  type: 'user_added' | 'user_updated' | 'message_sent' | 'attendance_marked' | 'class_created' | 'system_activity';
  title: string;
  description: string;
  timestamp: string;
  userId?: number;
  userName?: string;
  userRole?: string;
  details?: any;
}

// Message Tabs Component
function MessageTabs() {
  const { getRoleCardClass, isDark } = useRoleTheme();
  const [activeMessageTab, setActiveMessageTab] = useState<'students' | 'staff'>('students');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
        <button
          onClick={() => setActiveMessageTab('students')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeMessageTab === 'students'
              ? isDark
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-purple-600 shadow-md'
              : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <GraduationCap className="h-4 w-4 mr-2 inline" />
          Student Messages
        </button>
        <button
          onClick={() => setActiveMessageTab('staff')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeMessageTab === 'staff'
              ? isDark
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-blue-600 shadow-md'
              : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <UserCheck className="h-4 w-4 mr-2 inline" />
          Staff Messages
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeMessageTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StudentMessagingSection />
          </motion.div>
        )}
        {activeMessageTab === 'staff' && (
          <motion.div
            key="staff"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StaffMessagingSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Student Messaging Component (extracted from existing code)
function StudentMessagingSection() {
  const { getRoleCardClass, isDark } = useRoleTheme();

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-purple-900/20 border-purple-700/30' : 'bg-purple-50 border-purple-200'
        }`}>
        <h4 className={`font-medium mb-2 ${isDark ? 'text-purple-300' : 'text-purple-800'
          }`}>Student Communication</h4>
        <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'
          }`}>Send announcements and messages to students using the composition tools above.</p>
      </div>

      {/* Recent Student Messages */}
      <RecentStudentMessages />
    </div>
  );
}

// Recent Student Messages Component
function RecentStudentMessages() {
  const { isDark } = useRoleTheme();
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    loadRecentStudentMessages();
  }, []);

  const loadRecentStudentMessages = async () => {
    try {
      const response = await api.get('/messages/sent');

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
          messagesData = possibleArrays[0] as any[];
        }
      }

      const all = messagesData || [];
      // Keep only messages sent to students (exclude staff messages)
      const filtered = all.filter((m: any) => !m.isStaffMessage);
      setRecentMessages(filtered);
    } catch (error) {
      console.error('Failed to load recent student messages:', error);
      setRecentMessages([]);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'
        }`}>Recent Student Messages</h4>
      {recentMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No student messages sent yet</p>
          <p className="text-sm">Messages to students will appear here</p>
        </div>
      ) : (
        recentMessages.slice(0, 5).map((message) => (
          <div key={message.id} className={`flex items-start space-x-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'
            }`}>
            <div className={`p-2 rounded-full ${message.messageType === 'ALL_STUDENTS' || message.isAnnouncement
                ? isDark ? 'bg-red-900/30' : 'bg-red-100'
                : message.messageType === 'CLASS'
                  ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                  : isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
              {message.messageType === 'ALL_STUDENTS' || message.isAnnouncement ? (
                <Users className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'
                  }`} />
              ) : message.messageType === 'CLASS' ? (
                <BookOpen className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'
                  }`} />
              ) : (
                <MessageSquare className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'
                  }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${message.messageType === 'ALL_STUDENTS' || message.isAnnouncement
                    ? isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                    : message.messageType === 'CLASS'
                      ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                  }`}>
                  {message.messageType === 'ALL_STUDENTS' || message.isAnnouncement
                    ? 'Announcement'
                    : message.messageType === 'CLASS'
                      ? message.class?.name || 'Class'
                      : 'Personal'
                  }
                </span>
                {message.fileName && (
                  <span className={`inline-flex items-center text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                    <FileText className="h-3 w-3 mr-1" />
                    Attachment
                  </span>
                )}
              </div>
              <div className={`mt-2 rounded-md border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                <p className={`text-sm p-3 transition-colors duration-300 ${isDark ? 'text-slate-200' : 'text-gray-900'
                  }`}>
                  {message.content && message.content.includes('[STAFF MESSAGE]')
                    ? (message.content.split('\n\n').pop() || message.content)
                    : message.content}
                </p>
              </div>
              <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Recent Staff Messages Component
// Recent Staff Messages Component
// Recent Staff Messages Component
function StaffMessagingSection() {
  const { isDark } = useRoleTheme();
  const [staffMessages, setStaffMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStaffMessages();

    // Listen for refresh events
    const handleRefresh = () => {
      loadStaffMessages();
    };

    window.addEventListener('refreshStaffMessages', handleRefresh);

    return () => {
      window.removeEventListener('refreshStaffMessages', handleRefresh);
    };
  }, []);

  const loadStaffMessages = async () => {
    // Prevent multiple simultaneous calls
    if (loading) return;

    setLoading(true);
    try {
      let staffMessagesData = [];

      // First try: Check if staff-messages endpoints exist by making a HEAD request
      try {
        await api.head('/staff-messages/sent');
        // If we get here, endpoint exists - proceed with GET
        const sentResponse = await api.get('/staff-messages/sent');
        if (sentResponse.data) {
          if (Array.isArray(sentResponse.data)) {
            staffMessagesData = sentResponse.data;
          } else if (Array.isArray(sentResponse.data.messages)) {
            staffMessagesData = sentResponse.data.messages;
          } else if (Array.isArray(sentResponse.data.rows)) {
            staffMessagesData = sentResponse.data.rows;
          }
        }
        setStaffMessages(staffMessagesData);
        setLoading(false);
        return;
      } catch (headError: any) {
        // If endpoint doesn't exist (404), silently fall back to conversations
        if (headError.response?.status === 404) {
          console.log('Staff messages endpoint not available (this is normal)');
        } else {
          console.log('Staff messages endpoint error:', headError.message);
        }
      }

      // Second try: Conversations endpoint
      try {
        const convResponse = await api.get('/staff-messages/conversations');
        if (convResponse.data) {
          if (Array.isArray(convResponse.data)) {
            staffMessagesData = convResponse.data;
          } else if (Array.isArray(convResponse.data.messages)) {
            staffMessagesData = convResponse.data.messages;
          } else if (Array.isArray(convResponse.data.rows)) {
            staffMessagesData = convResponse.data.rows;
          }
        }
        if (staffMessagesData.length > 0) {
          setStaffMessages(staffMessagesData);
          setLoading(false);
          return;
        }
      } catch (convError: any) {
        if (convError.response?.status !== 404) {
          console.log('Conversations endpoint error:', convError.message);
        }
      }

      // Final fallback: Get all messages and filter
      try {
        const allResponse = await api.get('/messages/sent');
        let allMessages = [];

        if (Array.isArray(allResponse.data)) {
          allMessages = allResponse.data;
        } else if (allResponse.data && Array.isArray(allResponse.data.messages)) {
          allMessages = allResponse.data.messages;
        } else if (allResponse.data && Array.isArray(allResponse.data.rows)) {
          allMessages = allResponse.data.rows;
        } else if (allResponse.data && typeof allResponse.data === 'object') {
          const possibleArrays = Object.values(allResponse.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            allMessages = possibleArrays[0] as any[];
          }
        }

        // Filter for staff messages
        staffMessagesData = allMessages.filter((msg: any) =>
          msg.isStaffMessage ||
          msg.messageType === 'STAFF' ||
          msg.messageType === 'ADMIN_TO_STAFF' ||
          msg.recipientType === 'STAFF' ||
          msg.recipient?.role === 'STAFF' ||
          msg.sender?.role === 'ADMIN'
        );

        setStaffMessages(staffMessagesData);
      } catch (allError) {
        console.error('Failed to load any messages');
        setStaffMessages([]);
      }
    } catch (error) {
      console.error('Failed to load staff messages');
      setStaffMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = async (messageId: number, fileName?: string | null) => {
    try {
      // Try staff-messages endpoint first
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
        return;
      } catch (err: any) {
        if (err.response?.status !== 404) {
          throw err;
        }
        // 404 expected, try messages endpoint
      }

      // Fallback to messages download endpoint
      const res = await api.get(`/messages/download/${messageId}`, {
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
      console.error('Download failed');
      // Don't show alert for 404s
      if (err.response?.status !== 404) {
        alert('Failed to download attachment');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
        }`}>
        <h4 className={`font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'
          }`}>Staff Communication</h4>
        <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'
          }`}>Send messages to staff using the composition tools above.</p>
      </div>

      {/* Recent Staff Messages */}
      <div className="space-y-3">
        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'
          }`}>Recent Staff Messages</h4>
        {staffMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No staff messages sent yet</p>
            <p className="text-sm">Messages to staff will appear here</p>
          </div>
        ) : (
          staffMessages.slice(0, 5).map((message) => (
            <div key={message.id} className={`flex items-start space-x-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'
              }`}>
              <div className={`p-2 rounded-full ${message.messageType === 'ADMIN_TO_STAFF'
                  ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                  : isDark ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                {message.messageType === 'ADMIN_TO_STAFF' ? (
                  <Send className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                ) : (
                  <MessageSquare className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'
                    }`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${message.messageType === 'ADMIN_TO_STAFF'
                      ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                    }`}>
                    {message.messageType === 'ADMIN_TO_STAFF' ? 'From Staff' : 'To Staff'}
                  </span>
                  {message.fileName && (
                    <button
                      type="button"
                      onClick={() => downloadAttachment(message.id, message.fileName)}
                      className={`inline-flex items-center text-xs px-2 py-1 rounded-md border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      title={`Download ${message.fileName}`}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {message.fileName}
                    </button>
                  )}
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                    {message.messageType === 'ADMIN_TO_STAFF'
                      ? message.recipient?.name
                      : message.sender?.name
                    }
                  </span>
                </div>
                <div className={`mt-2 rounded-md border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                  <p className={`text-sm p-3 transition-colors duration-300 ${isDark ? 'text-slate-200' : 'text-gray-900'
                    }`}>
                    {message.content && message.content.includes('[STAFF MESSAGE]')
                      ? (message.content.split('\n\n').pop() || message.content)
                      : message.content}
                  </p>
                </div>
                <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                  {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { getRoleCardClass, getRoleTabClass, getRoleColors, isDark } = useRoleTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"Overview" | "students" | "staff" | "departments" | "messages" | "analytics" | "reports">("Overview");
  const [selectedDepartmentForClasses, setSelectedDepartmentForClasses] = useState<Department | null>(null);
  const [showDepartmentClasses, setShowDepartmentClasses] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"students" | "staff" | null>(null);

  // New state for students navigation flow
  const [studentsView, setStudentsView] = useState<'list' | 'departments' | 'classes' | 'filtered'>('list');
  const [selectedDepartmentForStudents, setSelectedDepartmentForStudents] = useState<Department | null>(null);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<Class | null>(null);
  const [studentsSearchQuery, setStudentsSearchQuery] = useState('');

  // Students pagination state

  const [studentsPagination, setStudentsPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // ADD THESE NEW PAGINATION STATES - Place them right after studentsPagination
  const [staffPagination, setStaffPagination] = useState({
    currentPage: 1,
    pageSize: 6,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [departmentPagination, setDepartmentPagination] = useState({
    currentPage: 1,
    pageSize: 6,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // New state for staff navigation flow
  const [staffView, setStaffView] = useState<'list' | 'departments' | 'filtered'>('list');
  const [selectedDepartmentForStaff, setSelectedDepartmentForStaff] = useState<Department | null>(null);
  const [selectedClassForStaff, setSelectedClassForStaff] = useState<Class | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Department management state
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | 'ALL'>('ALL');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'ALL'>('ALL');
  const [classFilter, setClassFilter] = useState<number | 'ALL'>('ALL');
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showAssignStudents, setShowAssignStudents] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    attendanceTrends: [],
    departmentPerformance: [],
    staffActivity: [],
    systemActivity: []
  });
  const [reports, setReports] = useState<ReportData[]>([]);
  // const [showReportGenerator, setShowReportGenerator] = useState(false); // Commented out - not used yet
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);

  // Message form state
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageType, setMessageType] = useState<'class' | 'all_students' | 'email' | 'staff' | 'department'>('all_students');
  const [messageForm, setMessageForm] = useState({
    classId: '',
    departmentId: '',
    content: '',
    file: null as File | null,
    recipientId: ''
  });

  // Email form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    file: null as File | null,
    emailType: 'STUDENT' as 'STUDENT' | 'PARENT',
    selectedStudents: [] as number[],
    classFilter: 'ALL',
    departmentFilter: 'ALL'
  });
  const [studentsForEmail, setStudentsForEmail] = useState<Student[]>([]);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [adminDetails, setAdminDetails] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [cleanupPreview, setCleanupPreview] = useState<any>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Enhanced backup/cleanup options
  const [backupOptions, setBackupOptions] = useState({
    backupType: 'full' as 'full' | 'class',
    classId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [cleanupOptions, setCleanupOptions] = useState({
    cleanupType: 'data_only' as 'data_only' | 'complete_department_deletion',
    departmentId: '',
    dateFrom: '',
    dateTo: '',
    deleteImportantData: false
  });

  // Analytics section toggle states
  const [showAllSystemActivity, setShowAllSystemActivity] = useState(false);
  const [showAllStaffActivity, setShowAllStaffActivity] = useState(false);
  const [showAllDepartmentPerformance, setShowAllDepartmentPerformance] = useState(false);

  // Message statistics state
  const [messageStats, setMessageStats] = useState({
    messagesToday: 0,
    activeAnnouncements: 0,
    deliveryRate: 100
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_added':
        return UserPlus;
      case 'user_updated':
        return Edit;
      case 'message_sent':
        return Mail;
      case 'attendance_marked':
        return CheckCircle;
      case 'class_created':
        return BookOpen;
      case 'system_activity':
        return Shield;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_added':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'user_updated':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'message_sent':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'attendance_marked':
        return 'bg-gradient-to-r from-teal-500 to-teal-600';
      case 'class_created':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      case 'system_activity':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getSelectedClassLabel = () => {
    if (selectedClassId === 'ALL') return 'All Classes';
    const found = classes.find(c => c.id === selectedClassId);
    return found ? found.name : 'All Classes';
  };

  // Download a generated analytics report as PDF
  const downloadReport = (report: ReportData) => {
    const doc = new jsPDF();
    const title = `${report.type.toUpperCase()} REPORT`;
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Range: ${report.dateRange.start} to ${report.dateRange.end}`, 14, 22);

    const analyticsData = report.data as AnalyticsData;

    // Department Performance table if available
    if (analyticsData?.departmentPerformance?.length) {
      autoTable(doc, {
        startY: 28,
        head: [["Department", "Students", "Staff", "Classes", "Attendance %", "Messages"]],
        body: analyticsData.departmentPerformance.map((d) => [
          d.departmentName,
          String(d.studentCount ?? 0),
          String(d.staffCount ?? 0),
          String(d.classCount ?? 0),
          String(d.attendanceRate ?? 0),
          String(d.messagesCount ?? 0)
        ])
      });
    }

    // Staff Activity table if available
    const afterClassY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 28;
    if (analyticsData?.staffActivity?.length) {
      autoTable(doc, {
        startY: afterClassY,
        head: [["Staff", "Classes Managed", "Messages", "Last Active"]],
        body: analyticsData.staffActivity.map((s) => [
          s.staffName,
          String(s.classesManaged ?? 0),
          String(s.messagesCount ?? 0),
          s.lastActive ? new Date(s.lastActive).toLocaleString() : "-"
        ])
      });
    }

    // Attendance Trends table if available
    const afterStaffY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : afterClassY;
    if (analyticsData?.attendanceTrends?.length) {
      autoTable(doc, {
        startY: afterStaffY,
        head: [["Date", "Attendance %", "Total"]],
        body: analyticsData.attendanceTrends.map((t) => [
          t.date,
          String(Math.round(t.rate ?? 0)),
          String(t.total ?? 0)
        ])
      });
    }

    // System Activity table if available
    const afterTrendY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : afterStaffY;
    if (analyticsData?.systemActivity?.length) {
      autoTable(doc, {
        startY: afterTrendY,
        head: [["Date", "Logins", "Messages", "Attendance Records"]],
        body: analyticsData.systemActivity.map((d) => [
          d.date,
          String(d.logins ?? 0),
          String(d.messages ?? 0),
          String(d.attendanceRecords ?? 0)
        ])
      });
    }

    const filename = `${report.type}_report_${report.dateRange.start}_to_${report.dateRange.end}.pdf`;
    doc.save(filename);
  };
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalStaff: 0,
    activeStudents: 0,
    activeStaff: 0,
    newRegistrations: 0,
    attendanceRate: 0,
    averageLogin: 0,
    messagesThisWeek: 0,
    classesWithLowAttendance: 0,
    topPerformingClass: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | Staff | null>(null);
  const [exportMenu, setExportMenu] = useState<{ type: "students" | "staff" | "filtered-students" | "filtered-staff" | ""; open: boolean }>({ type: "", open: false });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNumber: "",
    parentEmail: "",
    password: "",
    role: "",
    department: "",
    departmentId: "",
    classId: "",
    className: ""
  });

  // Password field states
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: "" });

  const [classFormData, setClassFormData] = useState({
    name: "",
    staffId: "",
    departmentId: ""
  });

  // Theme configuration
  const theme = {
    bgColor: "from-purple-900 to-purple-980",
    containerBg: "bg-purple-50",
    buttonBg: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
    ringColor: "focus:ring-purple-500",
    borderColor: "border-purple-200",
    tabClass: (isActive: boolean) =>
      `relative flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 transform ${isActive
        ? `${getRoleTabClass()} text-adaptive shadow-lg scale-105 font-semibold border`
        : `text-white/80 hover:text-white hover:bg-white/10 hover:shadow-md hover:scale-102 backdrop-blur-sm`
      }`
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Students pagination (moved up to avoid duplicate)
  // const [studentsCurrentPage, setStudentsCurrentPage] = useState(1);
  // const [studentsPagination, setStudentsPagination] = useState<any>(null);
  // const studentsItemsPerPage = 15;

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    loadData();

    // Test staff messaging API on first load
    if (activeTab === 'Overview') {
      testStaffMessagingAPI();
    }
  }, [activeTab, expandedSection, selectedClassId]);

  // Handle students pagination changes
  useEffect(() => {
    if (activeTab === 'students') {
      loadData();
    }
  }, [studentsPagination.currentPage]);

  // ADD THESE NEW USEEFFECT HOOKS - Place them right after the students one
  // Handle staff pagination changes
  useEffect(() => {
    if (activeTab === 'staff') {
      loadData();
    }
  }, [staffPagination.currentPage]);

  // Handle department pagination changes
  useEffect(() => {
    if (activeTab === 'departments') {
      loadData();
    }
  }, [departmentPagination.currentPage]);

  // Recompute analytics when switching to Analytics tab or when base data changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      console.log('🔄 Analytics tab activated, loading fresh data...');
      loadAnalytics();
    }
  }, [activeTab, classes, staff, students]);

  // Get filtered classes based on selected department
  const getFilteredClasses = () => {
    if (departmentFilter === 'ALL') return classes;
    return classes.filter(cls => cls.department?.id === departmentFilter);
  };

  // Get classes for a specific department
  const getDepartmentClasses = (departmentId: number) => {
    return classes.filter(cls => cls.department?.id === departmentId);
  };

  // Get filtered students based on department and class
  const getFilteredStudents = () => {
    let filtered = students;

    if (departmentFilter !== 'ALL') {
      filtered = filtered.filter(student => student.department?.id === departmentFilter);
    }

    if (classFilter !== 'ALL') {
      filtered = filtered.filter(student => student.class?.id === classFilter);
    }

    return filtered;
  };

  // Get filtered staff based on department
  const getFilteredStaff = () => {
    if (departmentFilter === 'ALL') return staff;
    return staff.filter(staffMember => staffMember.department?.id === departmentFilter);
  };

  // Consolidate staff members by unique ID and aggregate their classes
  const getConsolidatedStaff = () => {
    const filtered = getFilteredStaff();
    const staffMap = new Map<number, Staff>();

    filtered.forEach(staffMember => {
      if (staffMap.has(staffMember.id)) {
        // Staff member already exists, add their class to the managedClasses array
        const existingStaff = staffMap.get(staffMember.id)!;
        if (staffMember.managedClass) {
          if (!existingStaff.managedClasses) {
            existingStaff.managedClasses = [];
          }
          // Check if this class is already in the list to avoid duplicates
          const classExists = existingStaff.managedClasses.some(cls => cls.id === staffMember.managedClass!.id);
          if (!classExists) {
            existingStaff.managedClasses.push(staffMember.managedClass);
          }
        }
      } else {
        // First time seeing this staff member, create consolidated entry
        const consolidatedStaff: Staff = {
          ...staffMember,
          managedClasses: staffMember.managedClass ? [staffMember.managedClass] : []
        };
        staffMap.set(staffMember.id, consolidatedStaff);
      }
    });

    return Array.from(staffMap.values());
  };

  // Handle department selection for class management
  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartmentForClasses(department);
    setShowDepartmentClasses(true);
  };

  // Handle back to departments view
  const handleBackToDepartments = () => {
    setSelectedDepartmentForClasses(null);
    setShowDepartmentClasses(false);
  };

  // Handle class creation within department
  const handleCreateClassInDepartment = (department: Department) => {
    setSelectedDepartmentForClasses(department);
    setClassFormData({
      name: "",
      staffId: "",
      departmentId: String(department.id)
    });
    setShowClassForm(true);
  };

  // Students navigation handlers
  const handleStudentsFilterClick = () => {
    setStudentsView('departments');
    setStudentsSearchQuery('');
  };

  const handleStudentDepartmentSelect = (department: Department) => {
    setSelectedDepartmentForStudents(department);
    setStudentsView('classes');
    setSelectedClassForStudents(null);
  };

  const handleStudentClassSelect = (classItem: Class) => {
    setSelectedClassForStudents(classItem);
    setStudentsView('filtered');
  };

  const handleStudentsBackToDepartments = () => {
    setStudentsView('departments');
    setSelectedDepartmentForStudents(null);
    setSelectedClassForStudents(null);
  };

  const handleStudentsBackToClasses = () => {
    setStudentsView('classes');
    setSelectedClassForStudents(null);
  };

  const handleStudentsBackToList = () => {
    setStudentsView('list');
    setSelectedDepartmentForStudents(null);
    setSelectedClassForStudents(null);
    setStudentsSearchQuery('');
  };

  // Staff navigation handlers
  const handleStaffFilterClick = () => {
    setStaffView('departments');
    setStaffSearchQuery('');
  };

  const handleStaffDepartmentSelect = (department: Department) => {
    setSelectedDepartmentForStaff(department);
    setStaffView('filtered');
  };

  const handleStaffBackToList = () => {
    setStaffView('list');
    setSelectedDepartmentForStaff(null);
    setStaffSearchQuery('');
  };


  // Department management handlers
  const startEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentFormData({
      name: department.name,
      description: department.description || '',
      headId: department.head?.id?.toString() || ''
    });
    setShowDepartmentForm(true);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await api.delete(`/departments/${departmentId}`);
        setDepartments(departments.filter(dept => dept.id !== departmentId));
        alert('Department deleted successfully');
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Failed to delete department');
      }
    }
  };

  // Get filtered students for selected department
  const getStudentsForDepartment = (departmentId: number) => {
    return students.filter(student => student.department?.id === departmentId);
  };

  // Get filtered staff for selected department
  const getStaffForDepartment = (departmentId: number) => {
    return staff.filter(staffMember => staffMember.department?.id === departmentId);
  };

  // Get classes for selected department
  const getClassesForDepartment = (departmentId: number) => {
    return classes.filter(classItem => classItem.department?.id === departmentId);
  };

  // Get students for selected class
  const getStudentsForClass = (classId: number) => {
    return students.filter(student => student.class?.id === classId);
  };

  // Get filtered students based on search query
  const getFilteredStudentsList = () => {
    let filteredStudents = students;

    if (studentsSearchQuery) {
      filteredStudents = filteredStudents.filter(student =>
        student.name.toLowerCase().includes(studentsSearchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(studentsSearchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(studentsSearchQuery.toLowerCase()) ||
        student.class?.name.toLowerCase().includes(studentsSearchQuery.toLowerCase()) ||
        student.department?.name.toLowerCase().includes(studentsSearchQuery.toLowerCase())
      );
    }

    return filteredStudents;
  };

  // Get filtered staff based on search query
  const getFilteredStaffList = () => {
    let filteredStaff = staff;

    if (staffSearchQuery) {
      filteredStaff = filteredStaff.filter(staffMember =>
        staffMember.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        staffMember.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        staffMember.role.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        staffMember.managedClass?.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        staffMember.department?.name.toLowerCase().includes(staffSearchQuery.toLowerCase())
      );
    }

    return filteredStaff;
  };

  // Export functions for filtered data
  const exportStudentsToPDF = (data: Student[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    const tableData = data.map(student => [
      student.name,
      student.rollNumber,
      student.email,
      student.class?.name || '-',
      student.department?.name || '-'
    ]);

    autoTable(doc, {
      head: [['Name', 'Roll Number', 'Email', 'Class', 'Department']],
      body: tableData,
      startY: 30,
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  const exportStaffToPDF = (data: Staff[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    const tableData = data.map(staffMember => [
      staffMember.name,
      staffMember.email,
      staffMember.role,
      staffMember.managedClass?.name || '-',
      staffMember.department?.name || '-'
    ]);

    autoTable(doc, {
      head: [['Name', 'Email', 'Role', 'Managed Class', 'Department']],
      body: tableData,
      startY: 30,
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  const exportStudentsToExcel = (data: Student[], title: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(student => ({
        Name: student.name,
        'Roll Number': student.rollNumber,
        Email: student.email,
        Class: student.class?.name || '-',
        Department: student.department?.name || '-'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  };

  const exportStaffToExcel = (data: Staff[], title: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(staffMember => ({
        Name: staffMember.name,
        Email: staffMember.email,
        Role: staffMember.role,
        'Managed Class': staffMember.managedClass?.name || '-',
        Department: staffMember.department?.name || '-'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');
    XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  };

  // Department form data
  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    description: "",
    headId: ""
  });

  // Handle department form submission
  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedDepartment) {
        // Edit existing department
        await api.put(`/departments/${selectedDepartment.id}`, {
          name: departmentFormData.name,
          description: departmentFormData.description,
          headId: departmentFormData.headId ? Number(departmentFormData.headId) : null
        });
      } else {
        // Create new department
        await api.post('/departments', {
          name: departmentFormData.name,
          description: departmentFormData.description,
          headId: departmentFormData.headId ? Number(departmentFormData.headId) : null
        });
      }
      resetDepartmentForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Department operation failed');
    }
  };

  // Reset department form
  const resetDepartmentForm = () => {
    setDepartmentFormData({ name: "", description: "", headId: "" });
    setShowDepartmentForm(false);
    setSelectedDepartment(null);
  };

  // Students pagination functions
  const handleStudentsPageChange = (newPage: number) => {
    setStudentsPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
    // The useEffect will automatically reload data when currentPage changes
  };

  const handleStudentsNextPage = () => {
    if (studentsPagination.hasNextPage) {
      handleStudentsPageChange(studentsPagination.currentPage + 1);
    }
  };

  const handleStudentsPrevPage = () => {
    if (studentsPagination.hasPreviousPage) {
      handleStudentsPageChange(studentsPagination.currentPage - 1);
    }
  };

  // Staff pagination functions - Add these after your students pagination functions
  const handleStaffPageChange = (newPage: number) => {
    setStaffPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleStaffNextPage = () => {
    if (staffPagination.hasNextPage) {
      handleStaffPageChange(staffPagination.currentPage + 1);
    }
  };

  const handleStaffPrevPage = () => {
    if (staffPagination.hasPreviousPage) {
      handleStaffPageChange(staffPagination.currentPage - 1);
    }
  };

  // Department pagination functions - Add these after staff pagination functions
  const handleDepartmentPageChange = (newPage: number) => {
    setDepartmentPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleDepartmentNextPage = () => {
    if (departmentPagination.hasNextPage) {
      handleDepartmentPageChange(departmentPagination.currentPage + 1);
    }
  };

  const handleDepartmentPrevPage = () => {
    if (departmentPagination.hasPreviousPage) {
      handleDepartmentPageChange(departmentPagination.currentPage - 1);
    }
  };
  // Handle department deletion


  // Handle class deletion within department
  const handleDeleteClassInDepartment = async (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class? All students will be unassigned.')) {
      try {
        await api.delete(`/classes/${classId}`);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete class');
      }
    }
  };

  const loadData = async () => {
    let studentsRes, staffRes, classesRes, departmentsRes;
    try {
      setLoading(true);

      // Build query parameters
      const studentParams: any = {
        page: studentsPagination.currentPage,
        pageSize: studentsPagination.pageSize
      };
      const staffParams: any = {};
      const classParams: any = {};
      const departmentParams: any = {};

      if (departmentFilter !== 'ALL') {
        studentParams.departmentId = departmentFilter;
        staffParams.departmentId = departmentFilter;
        classParams.departmentId = departmentFilter;
      }
      if (classFilter !== 'ALL') {
        studentParams.classId = classFilter;
      }

      [classesRes, studentsRes, staffRes, departmentsRes] = await Promise.all([
        api.get('/users/classes', { params: classParams }),
        api.get('/users/students', { params: studentParams }),
        api.get('/users/staff', { params: staffParams }),
        api.get('/departments', { params: departmentParams })
      ]);

      setClasses(classesRes.data);
      setStudents(studentsRes.data.rows || []);

      // Update students pagination
      setStudentsPagination({
        currentPage: studentsRes.data.currentPage || 1,
        pageSize: studentsRes.data.pageSize || 10,
        totalPages: studentsRes.data.totalPages || 1,
        totalItems: studentsRes.data.count || 0,
        hasNextPage: studentsRes.data.hasNextPage || false,
        hasPreviousPage: studentsRes.data.hasPreviousPage || false
      });

      // Update staff data and calculate pagination locally
      setStaff(staffRes.data.rows || staffRes.data);
      const allStaff = staffRes.data.rows || staffRes.data;
      const totalStaffItems = allStaff.length;
      const totalStaffPages = Math.ceil(totalStaffItems / staffPagination.pageSize);
      setStaffPagination({
        currentPage: Math.min(staffPagination.currentPage, totalStaffPages || 1),
        pageSize: staffPagination.pageSize,
        totalPages: totalStaffPages || 1,
        totalItems: totalStaffItems,
        hasNextPage: staffPagination.currentPage < totalStaffPages,
        hasPreviousPage: staffPagination.currentPage > 1
      });

      // Update department data and calculate pagination locally
      setDepartments(departmentsRes.data.rows || departmentsRes.data);
      const allDepartments = departmentsRes.data.rows || departmentsRes.data;
      const totalDeptItems = allDepartments.length;
      const totalDeptPages = Math.ceil(totalDeptItems / departmentPagination.pageSize);
      setDepartmentPagination({
        currentPage: Math.min(departmentPagination.currentPage, totalDeptPages || 1),
        pageSize: departmentPagination.pageSize,
        totalPages: totalDeptPages || 1,
        totalItems: totalDeptItems,
        hasNextPage: departmentPagination.currentPage < totalDeptPages,
        hasPreviousPage: departmentPagination.currentPage > 1
      });

      // ... rest of your loadData function remains the same

      // Try to load dashboard stats separately
      try {
        const dashboardStatsRes = await api.get('/admin/dashboard-stats');
        const stats = dashboardStatsRes.data;
        setDashboardStats({
          totalStudents: stats.totalStudents,
          totalStaff: stats.totalStaff,
          activeStudents: stats.activeStudents,
          activeStaff: stats.activeStaff,
          newRegistrations: stats.newRegistrations,
          attendanceRate: stats.attendanceRate,
          averageLogin: stats.averageLogin,
          messagesThisWeek: stats.messagesThisWeek,
          classesWithLowAttendance: stats.classesWithLowAttendance,
          topPerformingClass: stats.topPerformingClass
        });
      } catch (statsError) {
        console.error('Dashboard stats API failed, using fallback data:', statsError);
        // Fallback to basic stats calculated from loaded data
        const totalStudents = studentsRes?.data?.count || (studentsRes?.data?.rows ? studentsRes.data.rows.length : 0);
        const totalStaff = staffRes?.data?.length || 0;
        setDashboardStats({
          totalStudents,
          totalStaff,
          activeStudents: totalStudents,
          activeStaff: totalStaff,
          newRegistrations: 0,
          attendanceRate: 85,
          averageLogin: 0,
          messagesThisWeek: 0,
          classesWithLowAttendance: 0,
          topPerformingClass: 'N/A'
        });
      }

      // Load recent activities, messages, and statistics separately
      loadRecentActivities();
      loadRecentMessages();
      loadMessageStats();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to basic stats if main APIs fail
      const totalStudents = studentsRes?.data?.count || (studentsRes?.data?.rows ? studentsRes.data.rows.length : 0);
      const totalStaff = staffRes?.data?.length || 0;

      setDashboardStats({
        totalStudents,
        totalStaff,
        activeStudents: totalStudents,
        activeStaff: totalStaff,
        newRegistrations: 0,
        attendanceRate: 85,
        averageLogin: 0,
        messagesThisWeek: 0,
        classesWithLowAttendance: 0,
        topPerformingClass: 'N/A'
      });

      // Set empty arrays if API calls failed
      if (!classesRes) setClasses([]);
      if (!studentsRes) setStudents([]);
      if (!staffRes) setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageForm.content.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('content', messageForm.content);

      if (messageForm.file) {
        formData.append('file', messageForm.file);
      }

      let endpoint = '';
      let successMessage = '';

      // Route to correct endpoint based on message type
      if (messageType === 'all_students') {
        endpoint = '/messages/send-to-all-students';
        formData.append('messageType', 'ALL_STUDENTS');
        formData.append('isAnnouncement', 'true');
        successMessage = 'Message sent to all students successfully!';

      } else if (messageType === 'class' && messageForm.classId) {
        endpoint = '/messages/send-to-class';
        formData.append('classId', messageForm.classId);
        formData.append('messageType', 'CLASS');
        successMessage = 'Message sent to selected class successfully!';

      } else if (messageType === 'department' && messageForm.departmentId) {
        endpoint = '/messages/send-to-department';
        formData.append('departmentId', messageForm.departmentId);
        formData.append('messageType', 'DEPARTMENT');
        successMessage = 'Message sent to selected department successfully!';

      } else if (messageType === 'staff') {
        endpoint = '/staff-messages/send';

        if (messageForm.recipientId && messageForm.recipientId !== 'ALL') {
          // Send to specific staff member
          formData.append('recipientId', messageForm.recipientId);
          successMessage = 'Message sent to selected staff member successfully!';
        } else if (messageForm.departmentId && messageForm.departmentId !== 'ALL') {
          // Send to all staff in department
          formData.append('departmentId', messageForm.departmentId);
          formData.append('messageType', 'DEPARTMENT_STAFF');
          successMessage = 'Message sent to all staff in department successfully!';
        } else {
          // Send to all staff
          formData.append('messageType', 'ALL_STAFF');
          successMessage = 'Message sent to all staff successfully!';
        }
      } else {
        alert('Please select a valid message type and recipient');
        return;
      }

      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const recipientCount = response.data.recipients || response.data.recipientCount || 'multiple';
      alert(`${successMessage} (${recipientCount} recipients)`);

      // Reset form
      setMessageForm({ classId: '', departmentId: '', content: '', file: null, recipientId: '' });
      setShowMessageForm(false);

      // Reload data
      await loadMessageStats();
      await loadRecentMessages();

      // Refresh staff messages if it was a staff message
      if (messageType === 'staff') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshStaffMessages'));
        }, 500);
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (type: 'all_students' | 'class' | 'email' | 'staff') => {
    setMessageType(type);
    if (type === 'email') {
      setShowEmailForm(true);
      loadStudentsForEmail();
    } else {
      setShowMessageForm(true);
    }
  };

  const loadStudentsForEmail = async (classId: string = 'ALL', departmentId: string = 'ALL') => {
    try {
      const response = await api.get('/messages/students-for-email', {
        params: { classId, departmentId }
      });
      setStudentsForEmail(response.data || []);
    } catch (error) {
      console.error('Failed to load students for email:', error);
      setStudentsForEmail([]);
    }
  };

  // Load departments for messaging
  const loadDepartmentsForMessaging = async () => {
    try {
      const response = await api.get('/messages/departments');
      return response.data || [];
    } catch (error) {
      console.error('Failed to load departments for messaging:', error);
      return [];
    }
  };

  // Load classes by department for messaging
  const loadClassesByDepartment = async (departmentId: number) => {
    try {
      const response = await api.get(`/messages/classes-by-department/${departmentId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to load classes by department:', error);
      return [];
    }
  };

  // Load staff by department for messaging
  const loadStaffByDepartment = async (departmentId: number | 'ALL') => {
    try {
      const response = await api.get(`/messages/staff-by-department/${departmentId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to load staff by department:', error);
      return [];
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      alert('Please enter both subject and message');
      return;
    }

    if (emailForm.selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('subject', emailForm.subject);
      formData.append('content', emailForm.content);
      formData.append('emailType', emailForm.emailType);
      formData.append('recipients', JSON.stringify(emailForm.selectedStudents));

      if (emailForm.file) {
        formData.append('file', emailForm.file);
      }

      const response = await api.post('/messages/send-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(`Email sent successfully to ${response.data.recipients} recipients!`);

      setEmailForm({
        subject: '',
        content: '',
        file: null,
        emailType: 'STUDENT',
        selectedStudents: [],
        classFilter: 'ALL',
        departmentFilter: 'ALL'
      });
      setMessageForm({ classId: '', departmentId: '', content: '', file: null, recipientId: '' });
      setShowEmailForm(false);

      // Reload recent messages and activities
      await loadRecentMessages();
      await loadRecentActivities();
      await loadMessageStats();
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setEmailForm(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };

  const selectAllStudents = () => {
    const allStudentIds = studentsForEmail.map(student => student.id);
    setEmailForm(prev => ({
      ...prev,
      selectedStudents: allStudentIds
    }));
  };

  const clearAllSelections = () => {
    setEmailForm(prev => ({
      ...prev,
      selectedStudents: []
    }));
  };

  // Settings functions
  const loadAdminDetails = async () => {
    try {
      const response = await api.get('/settings/admin-details');
      setAdminDetails(response.data);
    } catch (error) {
      console.error('Failed to load admin details:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await api.get('/settings/backups');
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const createBackup = async () => {
    try {
      setSettingsLoading(true);
      const response = await api.post('/settings/backup', backupOptions);
      alert(`Backup created successfully! Type: ${backupOptions.backupType}`);
      await loadBackups();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create backup');
    } finally {
      setSettingsLoading(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    try {
      const response = await api.get(`/settings/backup/download/${filename}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to download backup');
    }
  };

  const loadCleanupPreview = async () => {
    try {
      const params = {
        retentionDays,
        ...cleanupOptions
      };
      const response = await api.get('/settings/cleanup/preview', { params });
      setCleanupPreview(response.data);
    } catch (error) {
      console.error('Failed to load cleanup preview:', error);
    }
  };

  const performCleanup = async () => {
    if (!cleanupPreview || cleanupPreview.preview.totalRecords === 0) {
      alert('No data to clean up');
      return;
    }

    let confirmMessage = `Are you sure you want to delete ${cleanupPreview.preview.totalRecords} records?`;

    if (cleanupOptions.cleanupType === 'complete_department_deletion') {
      confirmMessage = `⚠️ DANGER: This will permanently delete the entire department including all classes, student data, staff data, messages, attendance records, and login logs. This action cannot be undone!\n\nRecords to delete: ${cleanupPreview.preview.totalRecords}`;
    } else if (cleanupOptions.deleteImportantData) {
      confirmMessage = `⚠️ WARNING: This will delete important data including student information. Records to delete: ${cleanupPreview.preview.totalRecords}`;
    }

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setSettingsLoading(true);
      const payload = {
        retentionDays,
        ...cleanupOptions
      };
      const response = await api.post('/settings/cleanup', payload);

      const totalDeleted = Object.values(response.data.results).reduce((sum: number, count: any) => sum + (count || 0), 0);
      alert(`Successfully cleaned up ${totalDeleted} records`);
      await loadCleanupPreview();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to clean up data');
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const response = await api.get('/messages/sent');

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
          messagesData = possibleArrays[0] as any[];
        }
      }

      setRecentMessages(messagesData || []);
    } catch (error) {
      console.error('Failed to load recent messages:', error);
      setRecentMessages([]);
    }
  };

  // Function to refresh staff messages in the StaffMessagingSection
  const refreshStaffMessages = () => {
    // This will trigger a re-render of the StaffMessagingSection component
    // which will reload staff messages via its useEffect
    window.dispatchEvent(new CustomEvent('refreshStaffMessages'));
  };

  // Test function to check staff messaging API
  const testStaffMessagingAPI = async () => {
    try {
      console.log('Testing staff messaging API...');
      const response = await api.get('/staff-messages/test');
      console.log('Staff messaging API test result:', response.data);
      return true;
    } catch (error: any) {
      console.log('Staff messaging API not available (this is normal if not implemented)');
      console.log('Will use fallback methods to load staff messages');
      return false;
    }
  };

  const loadMessageStats = async () => {
    try {
      // Get messages sent today
      const today = new Date().toISOString().split('T')[0];
      const todayResponse = await api.get('/messages/sent', {
        params: { date: today }
      });

      // Get all recent messages to calculate active announcements
      const allMessagesResponse = await api.get('/messages/sent');

      // Handle different response structures for all messages
      let allMessages = [];
      if (Array.isArray(allMessagesResponse.data)) {
        allMessages = allMessagesResponse.data;
      } else if (allMessagesResponse.data && Array.isArray(allMessagesResponse.data.messages)) {
        allMessages = allMessagesResponse.data.messages;
      } else if (allMessagesResponse.data && Array.isArray(allMessagesResponse.data.rows)) {
        allMessages = allMessagesResponse.data.rows;
      } else if (allMessagesResponse.data && typeof allMessagesResponse.data === 'object') {
        // Try to find an array property in the response
        const possibleArrays = Object.values(allMessagesResponse.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          allMessages = possibleArrays[0] as any[];
        }
      }

      // Handle today's messages response structure
      let todayMessages = [];
      if (Array.isArray(todayResponse.data)) {
        todayMessages = todayResponse.data;
      } else if (todayResponse.data && Array.isArray(todayResponse.data.messages)) {
        todayMessages = todayResponse.data.messages;
      } else if (todayResponse.data && Array.isArray(todayResponse.data.rows)) {
        todayMessages = todayResponse.data.rows;
      } else if (todayResponse.data && typeof todayResponse.data === 'object') {
        const possibleArrays = Object.values(todayResponse.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          todayMessages = possibleArrays[0] as any[];
        }
      }

      // Count active announcements (ALL_STUDENTS messages from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activeAnnouncements = (allMessages || []).filter((msg: any) =>
        (msg.messageType === 'ALL_STUDENTS' || msg.isAnnouncement) &&
        new Date(msg.createdAt) >= sevenDaysAgo
      ).length;

      setMessageStats({
        messagesToday: (todayMessages || []).length,
        activeAnnouncements,
        deliveryRate: 100 // Assuming 100% delivery rate for now
      });
    } catch (error) {
      console.error('Failed to load message statistics:', error);
      // Set default values on error
      setMessageStats({
        messagesToday: 0,
        activeAnnouncements: 0,
        deliveryRate: 100
      });
    }
  };

  const loadRecentActivities = async () => {
    try {
      const response = await api.get('/admin/recent-activities', { params: { limit: 5 } });
      setRecentActivities(response.data);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      // Show empty state when API fails (no mock data)
      setRecentActivities([]);
    }
  };

  const loadUnassignedStudents = async () => {
    try {
      const response = await api.get('/users/students', {
        params: { unassigned: true, page: 1, pageSize: 100 }
      });
      setUnassignedStudents(response.data.rows || []);
    } catch (error) {
      console.error('Failed to load unassigned students:', error);
      setUnassignedStudents([]);
    }
  };

  // (Removed) sample data generator – we now rely only on real backend data

  const loadAnalytics = async () => {
    try {
      console.log('🔍 Loading analytics data...');
      const [attendanceRes, classPerfRes, staffActRes, systemActRes] = await Promise.all([
        api.get('/analytics/attendance-trends', { params: { days: 7 } }).catch((err) => {
          console.error('❌ Attendance trends API error:', err);
          return { data: [] };
        }),
        api.get('/analytics/department-performance', { params: { days: 7 } }).catch(() => ({ data: [] })),
        api.get('/analytics/staff-activity', { params: { days: 7 } }).catch(() => ({ data: [] })),
        api.get('/analytics/system-activity', { params: { days: 7 } }).catch(() => ({ data: [] }))
      ]);

      // Process real attendance data from your API
      const attendanceTrends = Array.isArray(attendanceRes.data)
        ? attendanceRes.data.map((item: any) => ({
          date: item.date,
          rate: Math.round(item.rate || item.attendanceRate || 0),
          total: item.total || item.totalRecords || 0
        }))
        : [];

      console.log('📊 Processed attendance trends:', attendanceTrends);

      setAnalytics({
        attendanceTrends,
        departmentPerformance: classPerfRes.data || [],
        staffActivity: staffActRes.data || [],
        systemActivity: systemActRes.data || []
      });

      // Update dashboard stats with real data
      if (attendanceTrends.length > 0) {
        const avgRate = Math.round(
          attendanceTrends.reduce((acc, curr) => acc + curr.rate, 0) / attendanceTrends.length
        );
        console.log('📊 Calculated average attendance rate:', avgRate);
        setDashboardStats(prev => ({ ...prev, attendanceRate: avgRate }));
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalytics({
        attendanceTrends: [],
        departmentPerformance: [],
        staffActivity: [],
        systemActivity: []
      });
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: "" });
      return;
    }

    let score = 0;
    let feedback = "";

    if (password.length >= 8) score += 1;
    if (password.match(/[a-z]/)) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;

    switch (score) {
      case 0:
      case 1:
        feedback = "Very weak";
        break;
      case 2:
        feedback = "Weak";
        break;
      case 3:
        feedback = "Fair";
        break;
      case 4:
        feedback = "Good";
        break;
      case 5:
        feedback = "Strong";
        break;
    }

    setPasswordStrength({ score, feedback });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      rollNumber: "",
      parentEmail: "",
      password: "",
      role: "",
      department: "",
      departmentId: "",
      classId: "",
      className: ""
    });
    setShowForm(false);
    setEditingItem(null);
    setShowPassword(false);
    setPasswordStrength({ score: 0, feedback: "" });
  };

  const resetClassForm = () => {
    setClassFormData({ name: "", staffId: "", departmentId: "" });
    setShowClassForm(false);
    setSelectedClass(null);
  };

  const resetAssignForm = () => {
    setSelectedStudents([]);
    setShowAssignStudents(false);
    setSelectedClass(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        if (activeTab === 'students') {
          await api.put(`/users/students/${editingItem.id}`, {
            name: formData.name,
            email: formData.email,
            rollNumber: formData.rollNumber,
            parentEmail: formData.parentEmail,
            password: formData.password || undefined,
            classId: formData.classId ? Number(formData.classId) : undefined,
            departmentId: formData.departmentId ? Number(formData.departmentId) : undefined
          });
        } else {
          await api.put(`/users/staff/${editingItem.id}`, {
            name: formData.name,
            email: formData.email,
            password: formData.password || undefined,
            className: formData.className || undefined,
            departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
            classId: formData.classId ? Number(formData.classId) : undefined
          });
        }
      } else {
        if (activeTab === 'students') {
          await api.post(`/users/students`, {
            name: formData.name,
            email: formData.email,
            rollNumber: formData.rollNumber,
            parentEmail: formData.parentEmail,
            password: formData.password,
            classId: formData.classId ? Number(formData.classId) : undefined,
            departmentId: formData.departmentId ? Number(formData.departmentId) : undefined
          });
        } else {
          await api.post(`/users/staff`, {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            className: formData.className || undefined,
            departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
            classId: formData.classId ? Number(formData.classId) : undefined
          });
        }
      }
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Save failed");
    }
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedClass) {
        // Edit existing class
        await api.put(`/classes/${selectedClass.id}`, {
          name: classFormData.name,
          staffId: classFormData.staffId ? Number(classFormData.staffId) : null,
          departmentId: classFormData.departmentId ? Number(classFormData.departmentId) : null
        });
      } else {
        // Create new class
        if (!classFormData.departmentId) {
          alert('Please select a department for the class');
          return;
        }
        await api.post('/classes', {
          name: classFormData.name,
          staffId: classFormData.staffId ? Number(classFormData.staffId) : null,
          departmentId: Number(classFormData.departmentId)
        });
      }
      resetClassForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Class operation failed');
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedClass || selectedStudents.length === 0) return;

    try {
      await api.post(`/classes/${selectedClass.id}/assign-students`, {
        studentIds: selectedStudents
      });
      resetAssignForm();
      loadData();
      loadUnassignedStudents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Assignment failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/users/${activeTab === "students" ? "students" : "staff"}/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this class? All students will be unassigned.')) return;
    try {
      await api.delete(`/classes/${id}`);
      loadData();
      loadUnassignedStudents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const startEditClass = (cls: Class) => {
    setSelectedClass(cls);
    setClassFormData({
      name: cls.name,
      staffId: cls.staffId ? String(cls.staffId) : ''
    });
    setShowClassForm(true);
  };

  const startAssignStudents = async (cls: Class) => {
    setSelectedClass(cls);
    await loadUnassignedStudents();
    setShowAssignStudents(true);
  };

  const startEdit = (item: Student | Staff) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      email: item.email,
      rollNumber: "rollNumber" in item ? item.rollNumber : "",
      parentEmail: "parentEmail" in item ? item.parentEmail : "",
      password: "",
      role: "role" in item ? item.role : "",
      department: "department" in item ? item.department : "",
      departmentId: "department" in item && item.department ? String(item.department.id) : "",
      classId: "class" in item && item.class ? String(item.class.id) : "",
      className: "managedClass" in item && item.managedClass ? item.managedClass.name : ""
    });
    // Reset password-related states
    setShowPassword(false);
    setPasswordStrength({ score: 0, feedback: "" });
    setShowForm(true);
  };

  // Export functions
  const exportToPDF = (type: "students" | "staff") => {
    const doc = new jsPDF();
    const classLabel = type === 'students' ? ` - ${getSelectedClassLabel()}` : '';
    doc.text(`${type.toUpperCase()} REPORT${classLabel}`, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [
        type === "students"
          ? ["Name", "Email", "Roll Number", "Parent Email",]
          : ["Name", "Email", "Role", "Department",],
      ],
      body: (type === "students" ? students : staff).map((u) =>
        type === "students"
          ? [u.name, u.email, u.rollNumber, u.parentEmail, u.status]
          : [u.name, u.email, u.role, u.department, u.status]
      ),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [128, 90, 213] } // Purple color
    });
    const fileSuffix = type === 'students' ? `-${getSelectedClassLabel().replace(/\s+/g, '_')}` : '';
    doc.save(`${type}-report${fileSuffix}-${new Date().toISOString().split('T')[0]}.pdf`);
    setExportMenu({ type: "students", open: false });
  };

  const exportToExcel = (type: "students" | "staff") => {
    const data =
      type === "students"
        ? students.map((s) => ({
          Name: s.name,
          Email: s.email,
          RollNo: s.rollNumber,
          ParentEmail: s.parentEmail,

          JoinDate: s.joinDate
        }))
        : staff.map((s) => ({
          Name: s.name,
          Email: s.email,


          JoinDate: s.joinDate
        }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    const fileSuffix = type === 'students' ? `-${getSelectedClassLabel().replace(/\s+/g, '_')}` : '';
    XLSX.writeFile(wb, `${type}-report${fileSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportMenu({ type: "students", open: false });
  };

  // Filter data based on search, status, department, and class
  const filteredData = (activeTab === "students" ? students : staff).filter(
    (u) => {
      // Text search filter
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;

      // Department filter
      const matchesDepartment = departmentFilter === 'ALL' ||
        (u.department?.id === departmentFilter);

      // Class filter (only for students)
      const matchesClass = classFilter === 'ALL' ||
        (activeTab === "students" && (u as Student).class?.id === classFilter);

      return matchesSearch && matchesStatus && matchesDepartment && matchesClass;
    }
  );

  // Get available classes for the selected department
  const availableClasses = departmentFilter === 'ALL'
    ? classes
    : classes.filter(cls => cls.department?.id === departmentFilter);

  // Handle department filter change
  const handleDepartmentFilterChange = (deptId: number | 'ALL') => {
    setDepartmentFilter(deptId);
    setClassFilter('ALL'); // Reset class filter when department changes
    setCurrentPage(1);
  };

  // Handle class filter change
  const handleClassFilterChange = (classId: number | 'ALL') => {
    setClassFilter(classId);
    setCurrentPage(1);
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const toggleSection = (section: "students" | "staff") => {
    if (expandedSection === section) {
      setExpandedSection(null);
      setActiveTab("Overview");
    } else {
      setExpandedSection(section);
      setActiveTab(section);
    }
    setCurrentPage(1);
  };

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
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const RecentActivityItem = ({ icon: Icon, title, description, time, color }: any) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, x: 5 }}
      className="flex items-start space-x-3 p-3 hover:bg-purple-50 rounded-lg transition-colors duration-200"
    >
      <div className={`p-2 rounded-full ${color} mt-1 shadow-md`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <div className="text-xs text-gray-400 whitespace-nowrap">{time}</div>
    </motion.div>
  );

  const StatCard = ({ title, value, change, icon: Icon, color, trend }: any) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6 relative overflow-hidden`}
    >
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-adaptive-secondary">{title}</p>
          <p className="text-2xl font-bold text-adaptive mt-1">{value}</p>
          <div className={`flex items-center mt-1 text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
            {change}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-25 to-purple-50">
      {/* Header */}
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`bg-gradient-to-r ${theme.bgColor} text-white p-6 shadow-xl rounded-xl`}
      >
        <div className="max-w-[1920px] mx-auto px-1 p-4 space-y-9">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="h-10 w-10 mr-5" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                  Super Admin Portal
                </h1>
                <p className="text-purple-200 mt-1">Comprehensive management system</p>
              </div>
            </div>

            {/* Desktop buttons - hidden on mobile, exactly as before */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/settings')}
                className="flex items-center px-3 py-2 bg-purple-800/50 rounded-lg hover:bg-purple-700/50 transition-colors text-sm sm:text-base"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="inline">Settings</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadData}
                className="flex items-center px-3 py-2 bg-purple-800/50 rounded-lg hover:bg-purple-700/50 transition-colors text-sm sm:text-base"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="inline">Refresh</span>
              </motion.button>
              <div className="flex items-center bg-purple-800/50 px-3 py-2 rounded-lg text-sm sm:text-base">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="hidden xs:inline sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="inline xs:hidden">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Mobile buttons - horizontal scroll view */}
            <div className="flex sm:hidden w-full overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              <div className="flex gap-2 whitespace-nowrap">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/settings')}
                  className="flex items-center px-3 py-2 bg-purple-800/50 rounded-lg hover:bg-purple-700/50 transition-colors text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={loadData}
                  className="flex items-center px-3 py-2 bg-purple-800/50 rounded-lg hover:bg-purple-700/50 transition-colors text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>Refresh</span>
                </motion.button>
                <div className="flex items-center bg-purple-800/50 px-3 py-2 rounded-lg text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>


          {/* Add this style to hide scrollbar but keep functionality */}
          <style jsx>{`
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>

          {/* Navigation Tabs */}
          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8"
          >
            {/* Enhanced Tab Container */}
            <div className={`relative backdrop-blur-2xl rounded-3xl p-1.5 shadow-2xl border transition-all duration-700 overflow-hidden ${isDark
                ? 'bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-800/80 border-slate-700/40 shadow-slate-900/60'
                : 'bg-gradient-to-br from-white/80 via-purple-50/60 to-white/70 border-purple-200/50 shadow-purple-100/30'
              }`}>

              {/* Animated Background Glow */}
              <motion.div
                className={`absolute inset-0 opacity-30 rounded-3xl ${isDark
                    ? 'bg-gradient-to-r from-purple-600/20 via-transparent to-blue-600/20'
                    : 'bg-gradient-to-r from-purple-400/10 via-transparent to-blue-400/10'
                  }`}
                animate={{
                  x: [0, 100, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Mobile Scrollable Tabs */}
              <div className="relative">
                {/* Gradient fade for mobile scroll hint */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-purple-900 to-transparent pointer-events-none z-10 md:hidden" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-purple-900 to-transparent pointer-events-none z-10 md:hidden" />

                <div className="overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                  <div className="flex space-x-1 min-w-max md:min-w-0 md:flex-wrap md:justify-center">
                    {[
                      { key: "Overview", label: "Overview", icon: BarChart3 },
                      { key: "students", label: "Students", icon: GraduationCap },
                      { key: "staff", label: "Staff", icon: UserCheck },
                      { key: "departments", label: "Departments", icon: BookOpen },
                      { key: "messages", label: "Messages", icon: Mail },
                      { key: "analytics", label: "Analytics", icon: TrendingUp },
                      { key: "reports", label: "Reports", icon: FileText }
                    ].map((tab, index) => (
                      <motion.button
                        key={tab.key}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          delay: 0.2 + index * 0.06,
                          duration: 0.4,
                          type: "spring",
                          stiffness: 150,
                          damping: 12
                        }}
                        whileHover={{
                          y: -2,
                          scale: 1.02,
                          transition: {
                            duration: 0.2,
                            type: "spring",
                            stiffness: 500
                          }
                        }}
                        whileTap={{
                          scale: 0.98,
                          transition: { duration: 0.1 }
                        }}
                        onClick={() => {
                          setActiveTab(tab.key as any);
                          if (tab.key === "students" || tab.key === "staff") setExpandedSection(tab.key as any);
                          if (tab.key === "analytics") loadAnalytics();
                        }}
                        className={`relative flex items-center justify-center px-3 md:px-4 py-3 rounded-xl font-medium transition-all duration-400 flex-1 min-w-[100px] md:min-w-[140px] group overflow-hidden ${activeTab === tab.key
                            ? isDark
                              ? "bg-gradient-to-r from-purple-600/95 to-indigo-600/95 text-white shadow-lg shadow-purple-900/50 border border-purple-400/30"
                              : "bg-gradient-to-r from-purple-500/95 to-purple-600/95 text-white shadow-lg shadow-purple-300/40 border border-purple-300/50"
                            : isDark
                              ? "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-md hover:shadow-slate-900/20 backdrop-blur-sm border border-slate-700/20 hover:border-slate-600/40"
                              : "text-slate-600 hover:bg-white/60 hover:text-purple-700 hover:shadow-md hover:shadow-purple-100/30 backdrop-blur-sm border border-slate-200/40 hover:border-purple-200/50"
                          }`}
                      >
                        {/* Active Tab Glow Effect */}
                        {activeTab === tab.key && (
                          <motion.div
                            className={`absolute inset-0 rounded-xl ${isDark
                                ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20"
                                : "bg-gradient-to-r from-purple-400/15 to-blue-400/15"
                              }`}
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}

                        {/* Hover Background Shine */}
                        <motion.div
                          className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 ${activeTab !== tab.key
                              ? isDark
                                ? "bg-gradient-to-r from-slate-800/30 to-slate-700/30"
                                : "bg-gradient-to-r from-purple-100/30 to-white/30"
                              : ""
                            }`}
                          whileHover={{
                            scale: 1.05,
                            transition: { duration: 0.3 }
                          }}
                        />

                        <div className="flex items-center space-x-2 relative z-10">
                          {/* Icon Container */}
                          <motion.div
                            whileHover={{
                              scale: 1.15,
                              rotate: [0, -5, 5, 0],
                              transition: {
                                duration: 0.4,
                                rotate: { duration: 0.3 }
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors duration-300 ${activeTab === tab.key
                                ? isDark
                                  ? "bg-purple-500/25 backdrop-blur-sm"
                                  : "bg-white/25 backdrop-blur-sm"
                                : isDark
                                  ? "bg-slate-800/30 backdrop-blur-sm"
                                  : "bg-purple-100/50 backdrop-blur-sm"
                              }`}
                          >
                            <tab.icon className={`h-4 w-4 transition-all duration-300 ${activeTab === tab.key
                                ? "text-white scale-110"
                                : isDark
                                  ? "text-slate-400 group-hover:text-white"
                                  : "text-purple-600 group-hover:text-purple-700"
                              }`} />
                          </motion.div>

                          {/* Text */}
                          <motion.span
                            className={`font-medium whitespace-nowrap text-xs md:text-sm transition-colors duration-300 ${activeTab === tab.key
                                ? "text-white font-semibold"
                                : isDark
                                  ? "text-slate-400 group-hover:text-white"
                                  : "text-slate-600 group-hover:text-purple-700"
                              }`}
                          >
                            {tab.label}
                          </motion.span>
                        </div>

                        {/* Bottom Border Animation for Active Tab */}
                        {activeTab === tab.key && (
                          <motion.div
                            className={`absolute bottom-0 left-1/2 w-3/4 h-0.5 rounded-full ${isDark ? "bg-purple-400" : "bg-white"
                              }`}
                            initial={{ scale: 0, x: "-50%" }}
                            animate={{
                              scale: 1,
                              transition: { delay: 0.1, duration: 0.3 }
                            }}
                            whileHover={{ scale: 1.1 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Particles Effect - Enhanced */}
              <motion.div
                className={`absolute top-0 left-0 w-full h-full pointer-events-none rounded-3xl overflow-hidden ${isDark ? "opacity-15" : "opacity-8"
                  }`}
                animate={{
                  background: isDark
                    ? ["radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)", "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)"]
                    : ["radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)", "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)"]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />

              {/* Enhanced Particle System */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute rounded-full ${i % 2 === 0
                      ? isDark ? 'bg-purple-400' : 'bg-purple-300'
                      : isDark ? 'bg-blue-400' : 'bg-blue-300'
                    }`}
                  style={{
                    width: `${2 + (i % 3)}px`,
                    height: `${2 + (i % 3)}px`,
                    left: `${10 + i * 11}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    x: [0, (i % 2 === 0 ? 10 : -10), 0],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1.8, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 3 + (i % 2),
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                />
              ))}

              {/* Orbiting Particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`orbit-${i}`}
                  className={`absolute w-2 h-2 rounded-full ${isDark ? 'bg-pink-400/60' : 'bg-pink-300/60'
                    }`}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(i * 120 * Math.PI / 180) * 100, 0],
                    y: [0, Math.sin(i * 120 * Math.PI / 180) * 100, 0],
                    scale: [0.5, 1.5, 0.5],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    delay: i * 2,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Dashboard Overview */}
        <AnimatePresence mode="wait">
          {activeTab === "Overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              variants={containerVariants}
              className="space-y-6"
            >
              {/* Enhanced Key Metrics Grid */}
              <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                <StatCard
                  title="Total Students"
                  value={dashboardStats.totalStudents}
                  change="+12% from last month"
                  icon={GraduationCap}
                  color="bg-gradient-to-b from-blue-500 to-blue-900"
                  trend="up"
                />
                <StatCard
                  title="Total Staff"
                  value={dashboardStats.totalStaff}
                  change="+5% from last month"
                  icon={UserCheck}
                  color="bg-gradient-to-l from-green-500 to-green-900"
                  trend="up"
                />
                <StatCard
                  title="Active Classes"
                  value={classes.length}
                  change="All operational"
                  icon={BookOpen}
                  color="bg-gradient-to-t from-purple-500 to-purple-800"
                  trend="up"
                />
                <StatCard
                  title="Attendance Rate"
                  value={`${dashboardStats.attendanceRate}%`}
                  change="Last 7 days"
                  icon={Target}
                  color="bg-gradient-to-r from-emerald-600 to-emerald-900"
                  trend="up"
                />

                <StatCard
                  title="System Health"
                  value="98.5%"
                  change="Uptime"
                  icon={Activity}
                  color="bg-gradient-to-b from-orange-500 to-orange-900"
                  trend="up"
                />
              </motion.div>

              {/* Enhanced Overview Dashboard */}
              <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Real-time Analytics Overview */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                  {/* Live System Metrics */}
                  <motion.div
                    variants={cardVariants}
                    className={`${getRoleCardClass()} rounded-xl shadow-md border overflow-hidden`}
                  >
                    <div className="p-4 border-b border-theme">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-adaptive flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                          Live System Analytics
                        </h2>
                        <div className="flex items-center text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          Live
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">


                        {/* Total Staff Card */}

                      </div>

                      {/* Additional Metrics Row */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {/* Messages This Week */}
                        <div className={`text-center p-6 rounded-lg border transition-colors duration-300 ${isDark
                            ? 'bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 border-indigo-700/30'
                            : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
                          }`}>
                          <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                            {dashboardStats.messagesThisWeek}
                          </div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-300">Messages This Week</div>
                        </div>

                        {/* New Registrations */}
                        <div className={`text-center p-6 rounded-lg border transition-colors duration-300 ${isDark
                            ? 'bg-gradient-to-br from-teal-900/20 to-teal-800/20 border-teal-700/30'
                            : 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200'
                          }`}>
                          <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                            {dashboardStats.newRegistrations}
                          </div>
                          <div className="text-xs text-teal-600 dark:text-teal-300">New Registrations</div>
                        </div>

                        {/* Classes Needing Attention */}
                        <div className={`text-center p-6 rounded-lg border transition-colors duration-300 ${isDark
                            ? 'bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-700/30'
                            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                          }`}>
                          <div className="text-lg font-bold text-red-900 dark:text-red-100">
                            {dashboardStats.classesWithLowAttendance}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-300">Need Attention</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Analytics Charts */}
                  <motion.div
                    variants={cardVariants}
                    className={`${getRoleCardClass()} rounded-xl shadow-md border overflow-hidden`}
                  >
                    <div className="p-4 border-b border-theme">
                      <h3 className="text-lg font-semibold text-adaptive flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                        Weekly Trends
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-adaptive-secondary">Student Attendance</span>
                          <span className="text-sm font-bold text-green-600">87%</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-adaptive-secondary">Staff Activity</span>
                          <span className="text-sm font-bold text-blue-600">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">System Usage</span>
                          <span className="text-sm font-bold text-purple-600">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div variants={itemVariants} className={`${getRoleCardClass()} rounded-xl shadow-sm border overflow-hidden`}>
                  <div className="p-6 border-b border-theme">
                    <h2 className="text-lg font-semibold text-adaptive">Recent Activity</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {recentActivities.length > 0 ? (
                        recentActivities.slice(0, 5).map((activity) => (
                          <RecentActivityItem
                            key={activity.id}
                            icon={getActivityIcon(activity.type)}
                            title={activity.title}
                            description={activity.description}
                            time={formatTimeAgo(activity.timestamp)}
                            color={getActivityColor(activity.type)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No recent activities</p>
                          <p className="text-sm">System activities will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Students/Staff Sections */}


        {/* Departments Tab */}
        {/* Departments Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'departments' && (
            <motion.div
              key="departments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={`${getRoleCardClass()} rounded-xl shadow-sm border overflow-hidden`}
            >
              {/* Header */}
              <div className={`border-b border-theme px-6 py-4 ${isDark
                  ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/30'
                  : 'bg-gradient-to-r from-purple-50 to-white'
                }`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center">
                    <BookOpen className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-adaptive">Departments Management</h2>
                      <p className="text-sm text-adaptive-secondary">{departments.length} departments total</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedDepartment(null);
                      setDepartmentFormData({ name: "", description: "", headId: "" });
                      setShowDepartmentForm(true);
                    }}
                    className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {departments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No departments found</p>
                    <p className="text-gray-400">Create your first department to get started</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDepartment(null);
                        setDepartmentFormData({ name: "", description: "", headId: "" });
                        setShowDepartmentForm(true);
                      }}
                      className={`mt-4 flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Department
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments
                      .slice(
                        (departmentPagination.currentPage - 1) * departmentPagination.pageSize,
                        departmentPagination.currentPage * departmentPagination.pageSize
                      )
                      .map((department) => {
                        const deptStudents = students.filter(s => s.department?.id === department.id);
                        const deptStaff = staff.filter(s => s.department?.id === department.id);
                        const deptClasses = classes.filter(c => c.department?.id === department.id);

                        return (
                          <motion.div
                            key={department.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`border rounded-xl p-6 hover:shadow-md transition-shadow duration-200 ${isDark
                                ? 'border-slate-600 bg-gradient-to-br from-slate-800/50 to-slate-900/30'
                                : 'border-purple-200 bg-gradient-to-br from-white to-purple-25'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                                }`}>
                                <BookOpen className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                  }`} />
                              </div>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setSelectedDepartment(department);
                                    setDepartmentFormData({
                                      name: department.name,
                                      description: department.description || '',
                                      headId: department.head?.id?.toString() || ''
                                    });
                                    setShowDepartmentForm(true);
                                  }}
                                  className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="Edit Department"
                                >
                                  <Edit size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteDepartment(department.id)}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete Department"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </div>

                            <h3 className={`font-semibold text-lg mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{department.name}</h3>

                            <p className={`text-sm mb-4 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>{department.description || 'No description provided'}</p>

                            {department.head && (
                              <div className={`text-sm mb-4 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                }`}>
                                <strong>Head:</strong> {department.head.name}
                              </div>
                            )}

                            <div className="flex justify-between items-center text-sm mb-4">
                              <span className={`font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                {deptClasses.length} classes
                              </span>
                              <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                {deptStudents.length} students
                              </span>
                              <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'
                                }`}>
                                {deptStaff.length} staff
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedDepartmentForClasses(department);
                                  setShowClassManagement(true);
                                }}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors font-medium border ${isDark
                                    ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                  }`}
                              >
                                Manage Classes
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>
              {/* Department Pagination - ADD THIS CODE */}
              {departmentPagination.totalPages > 1 && (
                <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-slate-600 bg-slate-800/30' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-700'
                    }`}>
                    Showing {((departmentPagination.currentPage - 1) * departmentPagination.pageSize) + 1} to{' '}
                    {Math.min(departmentPagination.currentPage * departmentPagination.pageSize, departmentPagination.totalItems)} of{' '}
                    {departmentPagination.totalItems} departments
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDepartmentPrevPage}
                      disabled={!departmentPagination.hasPreviousPage}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${departmentPagination.hasPreviousPage
                          ? isDark
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                          : isDark
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      Previous
                    </motion.button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, departmentPagination.totalPages) }, (_, i) => {
                        const startPage = Math.max(1, departmentPagination.currentPage - 2);
                        const pageNumber = startPage + i;
                        if (pageNumber > departmentPagination.totalPages) return null;

                        const isCurrentPage = pageNumber === departmentPagination.currentPage;
                        return (
                          <motion.button
                            key={pageNumber}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDepartmentPageChange(pageNumber)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isCurrentPage
                                ? 'bg-purple-600 text-white'
                                : isDark
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            {pageNumber}
                          </motion.button>
                        );
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDepartmentNextPage}
                      disabled={!departmentPagination.hasNextPage}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${departmentPagination.hasNextPage
                          ? isDark
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                          : isDark
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Students Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={`${getRoleCardClass()} rounded-xl shadow-sm border overflow-hidden`}
            >
              {/* Header */}
              <div className={`border-b border-theme px-6 py-4 ${isDark
                  ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/30'
                  : 'bg-gradient-to-r from-purple-50 to-white'
                }`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center">
                    {(studentsView === 'classes' || studentsView === 'filtered') && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={studentsView === 'filtered' ? handleStudentsBackToClasses : handleStudentsBackToDepartments}
                        className={`mr-3 p-2 rounded-lg transition-colors ${isDark
                            ? 'text-slate-400 hover:text-purple-400 hover:bg-slate-700/50'
                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                        title={studentsView === 'filtered' ? "Back to classes" : "Back to departments"}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </motion.button>
                    )}
                    <GraduationCap className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-adaptive">
                        {studentsView === 'list' && 'Students Management'}
                        {studentsView === 'departments' && 'Filter by Department'}
                        {studentsView === 'classes' && selectedDepartmentForStudents &&
                          `${selectedDepartmentForStudents.name} - Select Class`}
                        {studentsView === 'filtered' && selectedClassForStudents &&
                          `${selectedClassForStudents.name} Students`}
                      </h2>
                      <p className="text-sm text-adaptive-secondary">
                        {studentsView === 'list' && `${getFilteredStudentsList().length} students total`}
                        {studentsView === 'departments' && 'Select a department to view classes'}
                        {studentsView === 'classes' && selectedDepartmentForStudents &&
                          `${getClassesForDepartment(selectedDepartmentForStudents.id).length} classes in this department`}
                        {studentsView === 'filtered' && selectedClassForStudents &&
                          `${getStudentsForClass(selectedClassForStudents.id).length} students in this class`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {studentsView === 'list' && (
                      <>
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Search students..."
                            className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 w-64 transition-all duration-300 ${isDark
                                ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-400'
                                : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                              }`}
                            value={studentsSearchQuery}
                            onChange={(e) => setStudentsSearchQuery(e.target.value)}
                          />
                        </div>

                        {/* Download Dropdown */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setExportMenu({ type: 'students', open: !exportMenu.open })}
                            className={`flex items-center px-3 py-2 rounded-lg transition-colors font-medium border ${isDark
                                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                              }`}
                          >
                            <DownloadCloud className="h-4 w-4 mr-2" />
                            Download
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </motion.button>

                          <AnimatePresence>
                            {exportMenu.open && exportMenu.type === 'students' && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-10 transition-colors duration-300 ${isDark
                                    ? 'bg-slate-800 border-slate-600'
                                    : 'bg-white border-purple-200'
                                  }`}
                              >
                                <button
                                  onClick={() => {
                                    exportStudentsToPDF(getFilteredStudentsList(), 'All Students List');
                                    setExportMenu({ type: '', open: false });
                                  }}
                                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${isDark
                                      ? 'text-slate-300 hover:bg-slate-700/50'
                                      : 'text-gray-700 hover:bg-purple-50'
                                    }`}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as PDF
                                </button>
                                <button
                                  onClick={() => {
                                    exportStudentsToExcel(getFilteredStudentsList(), 'All Students List');
                                    setExportMenu({ type: '', open: false });
                                  }}
                                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${isDark
                                      ? 'text-slate-300 hover:bg-slate-700/50'
                                      : 'text-gray-700 hover:bg-purple-50'
                                    }`}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as Excel
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleStudentsFilterClick}
                          className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium border ${isDark
                              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Filter by Department
                        </motion.button>
                      </>
                    )}

                    {studentsView === 'filtered' && selectedClassForStudents && (
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setExportMenu({ type: 'filtered-students', open: !exportMenu.open })}
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors font-medium border ${isDark
                              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                        >
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download Class List
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </motion.button>

                        <AnimatePresence>
                          {exportMenu.open && exportMenu.type === 'filtered-students' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-10 transition-colors duration-300 ${isDark
                                  ? 'bg-slate-800 border-slate-600'
                                  : 'bg-white border-purple-200'
                                }`}
                            >
                              <button
                                onClick={() => {
                                  const classStudents = getStudentsForClass(selectedClassForStudents.id);
                                  exportStudentsToPDF(classStudents, `${selectedDepartmentForStudents?.name} - ${selectedClassForStudents.name} Students`);
                                  setExportMenu({ type: '', open: false });
                                }}
                                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${isDark
                                    ? 'text-slate-300 hover:bg-slate-700/50'
                                    : 'text-gray-700 hover:bg-purple-50'
                                  }`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Export as PDF
                              </button>
                              <button
                                onClick={() => {
                                  const classStudents = getStudentsForClass(selectedClassForStudents.id);
                                  exportStudentsToExcel(classStudents, `${selectedDepartmentForStudents?.name} - ${selectedClassForStudents.name} Students`);
                                  setExportMenu({ type: '', open: false });
                                }}
                                className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${isDark
                                    ? 'text-slate-300 hover:bg-slate-700/50'
                                    : 'text-gray-700 hover:bg-purple-50'
                                  }`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Export as Excel
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowForm(true)}
                      className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Default View: All Students List */}
                {studentsView === 'list' && (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                          <thead className={`${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                            <tr>
                              <th className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                                }`}>Student</th>
                              <th className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                                }`}>Roll No</th>
                              <th className={`hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3 text-left font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                                }`}>Email</th>
                              <th className={`px-2 sm:px-6 py-2 sm:py-3 text-left font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                                }`}>Class</th>
                              <th className={`hidden md:table-cell px-2 sm:px-6 py-2 sm:py-3 text-left font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                                }`}>Department</th>
                              <th className={`px-2 sm:px-6 py-2 sm:py-3 text-right font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                                }`}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                            {getFilteredStudentsList().map((student) => (
                              <motion.tr
                                key={student.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`hover:bg-opacity-50 transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-purple-50'
                                  }`}
                              >
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm ${theme.buttonBg}`}>
                                      {student.name.charAt(0)}
                                    </div>
                                    <div className="ml-2 sm:ml-4">
                                      <div className={`text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>{student.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className={`px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-gray-900'
                                  }`}>{student.rollNumber}</td>
                                <td className={`hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'
                                  }`}>{student.email}</td>
                                <td className={`px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'
                                  }`}>{student.class?.name || '-'}</td>
                                <td className={`hidden md:table-cell px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'
                                  }`}>{student.department?.name || '-'}</td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                                  <div className="flex justify-end space-x-1 sm:space-x-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => startEdit(student)}
                                      className="text-purple-600 hover:text-purple-900 p-1 sm:p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit size={14} className="sm:h-4 sm:w-4" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleDelete(student.id)}
                                      className="text-red-600 hover:text-red-900 p-1 sm:p-2 rounded-lg hover:bg-red-50 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} className="sm:h-4 sm:w-4" />
                                    </motion.button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>


                    {/* Pagination Controls */}
                    {studentsPagination.totalPages > 1 && (
                      <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-slate-600 bg-slate-800/30' : 'border-gray-200 bg-gray-50'
                        }`}>
                        <div className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-700'
                          }`}>
                          Showing {((studentsPagination.currentPage - 1) * studentsPagination.pageSize) + 1} to{' '}
                          {Math.min(studentsPagination.currentPage * studentsPagination.pageSize, studentsPagination.totalItems)} of{' '}
                          {studentsPagination.totalItems} students
                        </div>

                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStudentsPrevPage}
                            disabled={!studentsPagination.hasPreviousPage}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${studentsPagination.hasPreviousPage
                                ? isDark
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                                : isDark
                                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            Previous
                          </motion.button>

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, studentsPagination.totalPages) }, (_, i) => {
                              const startPage = Math.max(1, studentsPagination.currentPage - 2);
                              const pageNumber = startPage + i;
                              if (pageNumber > studentsPagination.totalPages) return null;

                              const isCurrentPage = pageNumber === studentsPagination.currentPage;
                              return (
                                <motion.button
                                  key={pageNumber}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleStudentsPageChange(pageNumber)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isCurrentPage
                                      ? 'bg-purple-600 text-white'
                                      : isDark
                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                  {pageNumber}
                                </motion.button>
                              );
                            })}
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStudentsNextPage}
                            disabled={!studentsPagination.hasNextPage}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${studentsPagination.hasNextPage
                                ? isDark
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                                : isDark
                                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            Next
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Classes View - Show classes for selected department */}
                {studentsView === 'classes' && selectedDepartmentForStudents && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {getClassesForDepartment(selectedDepartmentForStudents.id).map((classItem) => {
                      const classStudents = getStudentsForClass(classItem.id);
                      return (
                        <motion.div
                          key={classItem.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`border rounded-xl p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer ${isDark
                              ? 'border-slate-600 bg-gradient-to-br from-slate-800/50 to-slate-900/30 hover:border-purple-500'
                              : 'border-purple-200 bg-gradient-to-br from-white to-purple-25 hover:border-purple-400'
                            }`}
                          onClick={() => handleStudentClassSelect(classItem)}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                              }`}>
                              <Users className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`} />
                            </div>
                            <span className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'
                              }`}>
                              {classStudents.length}
                            </span>
                          </div>
                          <h3 className={`font-semibold text-lg mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>{classItem.name}</h3>
                          {classItem.staff && (
                            <p className={`text-sm mb-4 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>Staff: {classItem.staff.name}</p>
                          )}
                          <div className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                            {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
                          </div>
                        </motion.div>
                      );
                    })}

                    {getClassesForDepartment(selectedDepartmentForStudents.id).length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No classes in this department</p>
                        <p className="text-gray-400">Classes need to be created first in the Departments tab</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Department Cards View */}
                {studentsView === 'departments' && (
                  <>
                    {/* Back to All Students Button */}
                    <div className="mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStudentsBackToList}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium border ${isDark
                            ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to All Students
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                      {departments.map((department) => {
                        const deptStudents = getStudentsForDepartment(department.id);
                        return (
                          <motion.div
                            key={department.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`border rounded-xl p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer ${isDark
                                ? 'border-slate-600 bg-gradient-to-br from-slate-800/50 to-slate-900/30 hover:border-purple-500'
                                : 'border-purple-200 bg-gradient-to-br from-white to-purple-25 hover:border-purple-400'
                              }`}
                            onClick={() => handleStudentDepartmentSelect(department)}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                                }`}>
                                <BookOpen className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                  }`} />
                              </div>
                              <span className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                {deptStudents.length}
                              </span>
                            </div>
                            <h3 className={`font-semibold text-lg mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{department.name}</h3>
                            <p className={`text-sm mb-4 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>{department.description}</p>
                            <div className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'
                              }`}>
                              {deptStudents.length} student{deptStudents.length !== 1 ? 's' : ''}
                            </div>
                          </motion.div>
                        );
                      })}

                      {departments.length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg mb-2">No departments found</p>
                          <p className="text-gray-400">Create departments first to organize students</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Filtered Students View */}
                {studentsView === 'filtered' && selectedClassForStudents && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={`${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                            }`}>Student</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                            }`}>Roll Number</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                            }`}>Email</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                            }`}>Class</th>
                          <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'
                            }`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                        {getStudentsForClass(selectedClassForStudents.id).map((student) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`hover:bg-opacity-50 transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-purple-50'
                              }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${theme.buttonBg}`}>
                                  {student.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                    }`}>{student.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-900'
                              }`}>{student.rollNumber}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>{student.email}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>{student.class?.name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => navigate(`/profile/student/${student.id}`)}
                                  className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="View Profile"
                                >
                                  <Eye size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => startEdit(student)}
                                  className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(student.id)}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>

                    {getStudentsForClass(selectedClassForStudents.id).length === 0 && (
                      <div className="text-center py-12">
                        <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No students in this class</p>
                        <p className="text-gray-400">Add students to this class to see them here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staff Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'staff' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={`${getRoleCardClass()} rounded-xl shadow-sm border overflow-hidden`}
            >
              <div className={`border-b border-theme px-6 py-4 ${isDark
                  ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/30'
                  : 'bg-gradient-to-r from-purple-50 to-white'
                }`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center">
                    <UserCheck className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-adaptive">Staff Management</h2>
                      <p className="text-sm text-adaptive-secondary">{getConsolidatedStaff().length} staff members total</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowForm(true)}
                    className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                {/* Department Filter Buttons */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDepartmentFilterChange('ALL')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${departmentFilter === 'ALL'
                          ? isDark
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-600 text-white'
                          : isDark
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      All Departments ({getConsolidatedStaff().length})
                    </motion.button>
                    {departments.map((dept) => {
                      // Get consolidated staff for this department
                      const allConsolidatedStaff = getConsolidatedStaff();
                      const deptStaff = allConsolidatedStaff.filter(s => s.department?.id === dept.id);
                      return (
                        <motion.button
                          key={dept.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDepartmentFilterChange(dept.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${departmentFilter === dept.id
                              ? isDark
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-600 text-white'
                              : isDark
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {dept.name} ({deptStaff.length})
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Staff Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {getConsolidatedStaff()
                    .slice(
                      (staffPagination.currentPage - 1) * staffPagination.pageSize,
                      staffPagination.currentPage * staffPagination.pageSize
                    )
                    .map((staffMember) => (
                      <motion.div
                        key={staffMember.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`border rounded-xl p-5 hover:shadow-md transition-shadow duration-200 ${isDark
                            ? 'border-slate-600 bg-gradient-to-br from-slate-800/50 to-slate-900/30'
                            : 'border-purple-200 bg-gradient-to-br from-white to-purple-25'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{staffMember.name}</h3>
                            <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                              {staffMember.email}
                            </p>
                            <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                              Role: {staffMember.role}
                            </p>
                            {staffMember.managedClasses && staffMember.managedClasses.length > 0 && (
                              <div className="mt-2">
                                <p className={`text-xs font-medium transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                  }`}>
                                  Manages ({staffMember.managedClasses.length} class{staffMember.managedClasses.length === 1 ? '' : 'es'}):
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {staffMember.managedClasses.slice(0, 3).map((cls, index) => (
                                    <span key={cls.id} className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                                      }`}>
                                      {cls.name}
                                    </span>
                                  ))}
                                  {staffMember.managedClasses.length > 3 && (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                                      }`}>
                                      +{staffMember.managedClasses.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            {/* Fallback for single class (backward compatibility) */}
                            {(!staffMember.managedClasses || staffMember.managedClasses.length === 0) && staffMember.managedClass && (
                              <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                Manages: {staffMember.managedClass.name}
                              </p>
                            )}
                            {staffMember.department && (
                              <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                Dept: {staffMember.department.name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate(`/profile/staff/${staffMember.id}`)}
                              className={`p-2 rounded-lg transition-colors ${isDark
                                  ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              title="View profile"
                            >
                              <Eye className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => startEdit(staffMember)}
                              className={`p-2 rounded-lg transition-colors ${isDark
                                  ? 'text-slate-400 hover:text-purple-400 hover:bg-slate-700/50'
                                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                }`}
                              title="Edit staff"
                            >
                              <Edit className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(staffMember.id)}
                              className={`p-2 rounded-lg transition-colors ${isDark
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700/50'
                                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                }`}
                              title="Delete staff"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                  {/* Empty state */}
                  {getConsolidatedStaff().length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No staff found</p>
                      <p className="text-gray-400">Add staff or adjust your filters</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Staff Pagination - ADD THIS CODE */}
              {staffPagination.totalPages > 1 && (
                <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-slate-600 bg-slate-800/30' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-700'
                    }`}>
                    Showing {((staffPagination.currentPage - 1) * staffPagination.pageSize) + 1} to{' '}
                    {Math.min(staffPagination.currentPage * staffPagination.pageSize, staffPagination.totalItems)} of{' '}
                    {staffPagination.totalItems} staff members
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStaffPrevPage}
                      disabled={!staffPagination.hasPreviousPage}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${staffPagination.hasPreviousPage
                          ? isDark
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                          : isDark
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      Previous
                    </motion.button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, staffPagination.totalPages) }, (_, i) => {
                        const startPage = Math.max(1, staffPagination.currentPage - 2);
                        const pageNumber = startPage + i;
                        if (pageNumber > staffPagination.totalPages) return null;

                        const isCurrentPage = pageNumber === staffPagination.currentPage;
                        return (
                          <motion.button
                            key={pageNumber}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStaffPageChange(pageNumber)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isCurrentPage
                                ? 'bg-purple-600 text-white'
                                : isDark
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            {pageNumber}
                          </motion.button>
                        );
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStaffNextPage}
                      disabled={!staffPagination.hasNextPage}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${staffPagination.hasNextPage
                          ? isDark
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                          : isDark
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Messages Header */}
              <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Mail className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-adaptive">Message Center</h2>
                      <p className="text-sm text-adaptive-secondary">Send announcements and messages to students</p>
                    </div>
                  </div>
                </div>

                {/* Message Composition */}
                <div className="space-y-6">
                  <div className="space-y-8">
                    {/* Combined Container */}
                    <motion.div
                      layout
                      className={`rounded-3xl border ${isDark
                          ? 'border-slate-600 bg-gradient-to-br from-slate-800/50 to-slate-900/30'
                          : 'border-purple-200 bg-gradient-to-br from-white to-purple-50'
                        } shadow-xl`}
                    >
                      <div className="p-8">
                        {/* Header */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center mb-8"
                        >
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-900 rounded-2xl shadow-lg mb-4">
                            <Send className="h-8 w-8 text-white" />
                          </div>
                          <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>Send Announcements</h2>
                          <p className={`text-sm mt-2 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                            }`}>Choose your audience and compose your message</p>
                        </motion.div>

                        {/* Options Grid */}
                        <div className={`grid gap-4 sm:gap-6 ${showMessageForm || showEmailForm ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                          {/* All Students Option */}
                          <AnimatePresence>
                            {(!showMessageForm && !showEmailForm || messageType === 'all_students') && (
                              <motion.div
                                layout
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer ${showMessageForm && messageType === 'all_students'
                                    ? isDark
                                      ? 'border-purple-500 bg-slate-800/50 shadow-lg'
                                      : 'border-purple-300 bg-white shadow-lg'
                                    : isDark
                                      ? 'border-slate-600 bg-slate-800/30 hover:shadow-md hover:border-purple-500'
                                      : 'border-purple-100 bg-white hover:shadow-md hover:border-purple-200'
                                  }`}
                                whileHover={!showMessageForm ? { scale: 1.02 } : {}}
                                onClick={() => !showMessageForm && !showEmailForm && handleOptionSelect('all_students')}
                              >
                                <div className="p-4 sm:p-6">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-900 to-purple-700 rounded-xl flex items-center justify-center">
                                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>All Students</h3>
                                      <p className={`text-xs sm:text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                        }`}>Broadcast to entire student body</p>
                                    </div>
                                    <div className="text-right self-end sm:self-center">
                                      <div className="text-xl sm:text-2xl font-bold text-purple-600">{dashboardStats.totalStudents}</div>
                                      <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                        }`}>students</div>
                                    </div>
                                  </div>

                                  {!showMessageForm && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="mt-3 sm:mt-4 text-center"
                                    >
                                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full border ${isDark
                                          ? 'bg-purple-900/30 border-purple-700/50'
                                          : 'bg-purple-50 border-purple-200'
                                        }`}>
                                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'
                                          }`}>Click to compose</span>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Class-wise Option */}
                          {/* Class-wise Option */}
                          <AnimatePresence>
                            {(!showMessageForm && !showEmailForm || messageType === 'class') && (
                              <motion.div
                                layout
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer ${showMessageForm && messageType === 'class'
                                    ? isDark
                                      ? 'border-purple-500 bg-slate-800/50 shadow-lg'
                                      : 'border-purple-300 bg-white shadow-lg'
                                    : isDark
                                      ? 'border-slate-600 bg-slate-800/30 hover:shadow-md hover:border-purple-500'
                                      : 'border-purple-100 bg-white hover:shadow-md hover:border-purple-200'
                                  }`}
                                whileHover={!showMessageForm ? { scale: 1.02 } : {}}
                                onClick={() => !showMessageForm && !showEmailForm && handleOptionSelect('class')}
                              >
                                <div className="p-4 sm:p-6">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl flex items-center justify-center">
                                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>Class-wise</h3>
                                      <p className={`text-xs sm:text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                        }`}>Send targeted class communications</p>
                                    </div>
                                    <div className="text-right self-end sm:self-center">
                                      <div className="text-xl sm:text-2xl font-bold text-purple-600">{classes.length}</div>
                                      <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                        }`}>classes</div>
                                    </div>
                                  </div>

                                  {!showMessageForm && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="mt-3 sm:mt-4 text-center"
                                    >
                                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full border ${isDark
                                          ? 'bg-purple-900/30 border-purple-700/50'
                                          : 'bg-purple-50 border-purple-200'
                                        }`}>
                                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'
                                          }`}>Click to compose</span>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {/* Send to Staff Option */}
                          {/* Send to Staff Option */}
                          <AnimatePresence>
                            {(!showMessageForm && !showEmailForm) && (
                              <motion.div
                                layout
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isDark
                                    ? 'border-slate-600 bg-slate-800/30 hover:shadow-md hover:border-blue-500'
                                    : 'border-blue-100 bg-white hover:shadow-md hover:border-blue-200'
                                  }`}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleOptionSelect('staff')}
                              >
                                <div className="p-4 sm:p-6">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                                      <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>Send to Staff</h3>
                                      <p className={`text-xs sm:text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                        }`}>Message staff members</p>
                                    </div>
                                    <div className="text-right self-end sm:self-center">
                                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{staff.length}</div>
                                      <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                        }`}>staff</div>
                                    </div>
                                  </div>

                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-3 sm:mt-4 text-center"
                                  >
                                    <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full border ${isDark
                                        ? 'bg-blue-900/30 border-blue-700/50'
                                        : 'bg-blue-50 border-blue-200'
                                      }`}>
                                      <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'
                                        }`}>Click to compose</span>
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Email Option */}
                          <AnimatePresence>
                            {(!showMessageForm && !showEmailForm) && (
                              <motion.div
                                layout
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isDark
                                    ? 'border-slate-600 bg-slate-800/30 hover:shadow-md hover:border-blue-500'
                                    : 'border-blue-100 bg-white hover:shadow-md hover:border-blue-200'
                                  }`}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleOptionSelect('email')}
                              >
                                <div className="p-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl flex items-center justify-center">
                                      <Mail className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>Send as Email</h3>
                                      <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                        }`}>Email to students or parents</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-blue-600">✉️</div>
                                      <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                        }`}>direct email</div>
                                    </div>
                                  </div>

                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 text-center"
                                  >
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${isDark
                                        ? 'bg-blue-900/30 border-blue-700/50'
                                        : 'bg-blue-50 border-blue-200'
                                      }`}>
                                      <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'
                                        }`}>Click to select recipients</span>
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Message Form */}
                        {/* Message Form */}
                        <AnimatePresence mode="wait">
                          {showMessageForm && (
                            <motion.div
                              key="message-form"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                              className="mt-8"
                            >
                              <motion.div
                                initial={{ y: 10 }}
                                animate={{ y: 0 }}
                                className={`rounded-2xl border p-4 sm:p-6 shadow-lg ${isDark
                                    ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/30 border-slate-600'
                                    : 'bg-gradient-to-br from-purple-50 to-white border-purple-200'
                                  }`}
                              >
                                {/* Form Header */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      {messageType === 'all_students' ? (
                                        <Users className="h-4 w-4 text-white" />
                                      ) : messageType === 'staff' ? (
                                        <UserCheck className="h-4 w-4 text-white" />
                                      ) : (
                                        <BookOpen className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className={`font-semibold text-sm sm:text-base truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {messageType === 'all_students' ? 'All Students Announcement' :
                                          messageType === 'staff' ? 'Staff Message' : 'Class-wise Message'}
                                      </h3>
                                      <p className={`text-xs sm:text-sm truncate transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                        }`}>
                                        {messageType === 'all_students'
                                          ? `Sending to ${dashboardStats.totalStudents} students`
                                          : messageType === 'staff'
                                            ? 'Select a staff member'
                                            : 'Select a class'
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowMessageForm(false)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 self-end sm:self-center ${isDark
                                        ? 'bg-slate-700 hover:bg-slate-600'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                      }`}
                                  >
                                    <X className={`h-4 w-4 ${isDark ? 'text-slate-300' : 'text-gray-600'
                                      }`} />
                                  </motion.button>
                                </div>

                                {/* Message Form */}
                                <form onSubmit={sendMessage} className="space-y-4 sm:space-y-6">
                                  {messageType === 'class' && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      <ModernDropdown
                                        label="Select Class"
                                        required
                                        value={messageForm.classId}
                                        onChange={(value) => setMessageForm({ ...messageForm, classId: value })}
                                        options={[
                                          { value: '', label: 'Choose a class', disabled: true },
                                          ...classes.map((cls) => ({
                                            value: cls.id.toString(),
                                            label: cls.name,
                                            description: `${cls.studentCount} students`,
                                            icon: <BookOpen className="h-4 w-4" />
                                          }))
                                        ]}
                                        placeholder="Choose a class"
                                        searchable
                                        clearable
                                      />
                                    </motion.div>
                                  )}

                                  {messageType === 'staff' && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      <ModernDropdown
                                        label="Select Staff Member"
                                        required
                                        value={messageForm.recipientId}
                                        onChange={(value) => setMessageForm({ ...messageForm, recipientId: value })}
                                        options={[
                                          { value: '', label: 'Choose a staff member', disabled: true },
                                          { value: 'ALL', label: 'All Staff Members', description: 'Send to all staff', icon: <Users className="h-4 w-4" /> },
                                          ...staff.map((staffMember) => ({
                                            value: staffMember.id.toString(),
                                            label: staffMember.name,
                                            description: staffMember.email,
                                            icon: <UserCheck className="h-4 w-4" />
                                          }))
                                        ]}
                                        placeholder="Choose a staff member"
                                        searchable
                                        clearable
                                      />
                                    </motion.div>
                                  )}

                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                      }`}>
                                      Message Content
                                    </label>
                                    <textarea
                                      required
                                      rows={4}
                                      value={messageForm.content}
                                      onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                                      placeholder="Enter your message here..."
                                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-sm sm:text-base ${isDark
                                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                    />
                                  </motion.div>

                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                  >
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                      }`}>
                                      Attachment (Optional)
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                      <input
                                        type="file"
                                        onChange={(e) => setMessageForm({ ...messageForm, file: e.target.files?.[0] || null })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium ${isDark
                                            ? 'bg-slate-700 border-slate-600 text-white file:bg-purple-900/30 file:text-purple-300 hover:file:bg-purple-800/40'
                                            : 'bg-white border-gray-300 text-gray-900 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100'
                                          }`}
                                      />
                                    </div>
                                  </motion.div>

                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4"
                                  >
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setShowMessageForm(false)}
                                      className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border rounded-xl font-medium transition-colors text-sm sm:text-base ${isDark
                                          ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                      Cancel
                                    </motion.button>
                                    <motion.button
                                      type="submit"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      disabled={loading}
                                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg text-sm sm:text-base"
                                    >
                                      {loading ? (
                                        <>
                                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                                          <span>Sending...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                          <span>Send Message</span>
                                        </>
                                      )}
                                    </motion.button>
                                  </motion.div>
                                </form>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Email Form */}

                        <AnimatePresence mode="wait">
                          {showEmailForm && (
                            <motion.div
                              key="email-form"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                              className="mt-8"
                            >
                              <motion.div
                                initial={{ y: 10 }}
                                animate={{ y: 0 }}
                                className={`rounded-2xl border p-4 sm:p-6 shadow-lg ${isDark
                                    ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/30 border-slate-600'
                                    : 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
                                  }`}
                              >
                                {/* Form Header */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Mail className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className={`font-semibold text-sm sm:text-base truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Send Email
                                      </h3>
                                      <p className={`text-xs sm:text-sm truncate transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                        }`}>
                                        {emailForm.selectedStudents.length} recipient(s) selected
                                      </p>
                                    </div>
                                  </div>

                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowEmailForm(false)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 self-end sm:self-center ${isDark
                                        ? 'bg-slate-700 hover:bg-slate-600'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                      }`}
                                  >
                                    <X className={`h-4 w-4 ${isDark ? 'text-slate-300' : 'text-gray-600'
                                      }`} />
                                  </motion.button>
                                </div>

                                {/* Email Form */}
                                <form onSubmit={sendEmail} className="space-y-4 sm:space-y-6">
                                  {/* Email Type Selection */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                  >
                                    <label className={`block text-sm font-medium mb-2 sm:mb-3 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                      }`}>
                                      Send to
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                      <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setEmailForm({ ...emailForm, emailType: 'STUDENT' })}
                                        className={`w-full sm:flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${emailForm.emailType === 'STUDENT'
                                            ? isDark
                                              ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                                              : 'border-blue-500 bg-blue-50 text-blue-700'
                                            : isDark
                                              ? 'border-slate-600 text-slate-300 hover:border-blue-400'
                                              : 'border-gray-300 text-gray-700 hover:border-blue-300'
                                          }`}
                                      >
                                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mb-1" />
                                        Students
                                      </motion.button>
                                      <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setEmailForm({ ...emailForm, emailType: 'PARENT' })}
                                        className={`w-full sm:flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${emailForm.emailType === 'PARENT'
                                            ? isDark
                                              ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                                              : 'border-blue-500 bg-blue-50 text-blue-700'
                                            : isDark
                                              ? 'border-slate-600 text-slate-300 hover:border-blue-400'
                                              : 'border-gray-300 text-gray-700 hover:border-blue-300'
                                          }`}
                                      >
                                        <Users2 className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mb-1" />
                                        Parents
                                      </motion.button>
                                    </div>
                                  </motion.div>

                                  {/* Department Filter */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                  >
                                    <ModernDropdown
                                      label="Filter by Department"
                                      value={emailForm.departmentFilter}
                                      onChange={(value) => {
                                        setEmailForm({ ...emailForm, departmentFilter: value, selectedStudents: [] });
                                        loadStudentsForEmail(emailForm.classFilter, value);
                                      }}
                                      options={[
                                        { value: 'ALL', label: 'All Departments', icon: <Building2 className="h-4 w-4" /> },
                                        ...departments.map((dept) => ({
                                          value: dept.id.toString(),
                                          label: dept.name,
                                          description: `${dept.studentCount || 0} students`,
                                          icon: <Building2 className="h-4 w-4" />
                                        }))
                                      ]}
                                      placeholder="Select department"
                                      searchable
                                    />
                                  </motion.div>

                                  {/* Class Filter */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                  >
                                    <ModernDropdown
                                      label="Filter by Class"
                                      value={emailForm.classFilter}
                                      onChange={(value) => {
                                        setEmailForm({ ...emailForm, classFilter: value, selectedStudents: [] });
                                        loadStudentsForEmail(value, emailForm.departmentFilter);
                                      }}
                                      options={[
                                        { value: 'ALL', label: 'All Classes', icon: <BookOpen className="h-4 w-4" /> },
                                        ...classes.map((cls) => ({
                                          value: cls.id.toString(),
                                          label: cls.name,
                                          description: `${cls.studentCount} students`,
                                          icon: <BookOpen className="h-4 w-4" />
                                        }))
                                      ]}
                                      placeholder="Select class"
                                      searchable
                                    />
                                  </motion.div>

                                  {/* Student Selection */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                                      <label className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                        }`}>
                                        Select Recipients ({emailForm.selectedStudents.length} selected)
                                      </label>
                                      <div className="flex gap-2 w-full sm:w-auto">
                                        <motion.button
                                          type="button"
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={selectAllStudents}
                                          className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 text-xs rounded-lg font-medium transition-colors ${isDark
                                              ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40'
                                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            }`}
                                        >
                                          Select All
                                        </motion.button>
                                        <motion.button
                                          type="button"
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={clearAllSelections}
                                          className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 text-xs rounded-lg font-medium transition-colors ${isDark
                                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                          Clear All
                                        </motion.button>
                                      </div>
                                    </div>

                                    <div className={`max-h-48 sm:max-h-64 overflow-y-auto border rounded-xl p-2 sm:p-4 space-y-2 ${isDark
                                        ? 'bg-slate-800/30 border-slate-600'
                                        : 'bg-gray-50 border-gray-200'
                                      }`}>
                                      {studentsForEmail.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">
                                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                          <p className="text-sm">No students found</p>
                                        </div>
                                      ) : (
                                        studentsForEmail.map((student) => (
                                          <motion.div
                                            key={student.id}
                                            whileHover={{ scale: 1.01 }}
                                            className={`flex items-start space-x-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 ${emailForm.selectedStudents.includes(student.id)
                                                ? isDark
                                                  ? 'bg-blue-900/30 border border-blue-600'
                                                  : 'bg-blue-50 border border-blue-300'
                                                : isDark
                                                  ? 'bg-slate-700/30 hover:bg-slate-700/50'
                                                  : 'bg-white hover:bg-gray-50'
                                              }`}
                                            onClick={() => toggleStudentSelection(student.id)}
                                          >
                                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-1 ${emailForm.selectedStudents.includes(student.id)
                                                ? 'bg-blue-500 border-blue-500'
                                                : isDark
                                                  ? 'border-slate-400'
                                                  : 'border-gray-300'
                                              }`}>
                                              {emailForm.selectedStudents.includes(student.id) && (
                                                <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                                <p className={`font-medium text-xs sm:text-sm truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                                  }`}>{student.name}</p>
                                                <span className={`text-xs px-1 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'
                                                  }`}>{student.rollNumber}</span>
                                              </div>
                                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                                                <p className={`text-xs truncate transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                                                  }`}>
                                                  {student.class?.name || 'No Class'}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs">
                                                  <span className={`flex items-center ${student.email ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')
                                                    }`}>
                                                    <Mail className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                                    <span className="hidden xs:inline">Student</span>
                                                  </span>
                                                  <span className={`flex items-center ${student.parentEmail ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')
                                                    }`}>
                                                    <Users2 className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                                    <span className="hidden xs:inline">Parent</span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        ))
                                      )}
                                    </div>
                                  </motion.div>

                                  {/* Subject */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                  >
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                      }`}>
                                      Email Subject
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={emailForm.subject}
                                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                      placeholder="Enter email subject..."
                                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${isDark
                                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                    />
                                  </motion.div>

                                  {/* Content */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                  >
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                      }`}>
                                      Email Content
                                    </label>
                                    <textarea
                                      required
                                      rows={4}
                                      value={emailForm.content}
                                      onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                                      placeholder="Enter your email message here..."
                                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm sm:text-base ${isDark
                                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                    />
                                  </motion.div>

                                  {/* Attachment */}
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 }}
                                  >
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                                      }`}>
                                      Attachment (Optional)
                                    </label>
                                    <input
                                      type="file"
                                      onChange={(e) => setEmailForm({ ...emailForm, file: e.target.files?.[0] || null })}
                                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium ${isDark
                                          ? 'bg-slate-700 border-slate-600 text-white file:bg-blue-900/30 file:text-blue-300 hover:file:bg-blue-800/40'
                                          : 'bg-white border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                                        }`}
                                    />
                                  </motion.div>

                                  {/* Action Buttons */}
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4"
                                  >
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setShowEmailForm(false)}
                                      className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border rounded-xl font-medium transition-colors text-sm sm:text-base ${isDark
                                          ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                      Cancel
                                    </motion.button>
                                    <motion.button
                                      type="submit"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      disabled={loading || emailForm.selectedStudents.length === 0}
                                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-500 text-white rounded-xl hover:from-blue-600 hover:to-blue-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg text-sm sm:text-base"
                                    >
                                      {loading ? (
                                        <>
                                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                                          <span>Sending...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                          <span>Send Email ({emailForm.selectedStudents.length})</span>
                                        </>
                                      )}
                                    </motion.button>
                                  </motion.div>
                                </form>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>

                  {/* Message Statistics */}
                  <div className={`rounded-2xl p-6 border ${isDark
                      ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-700/30'
                      : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                    }`}>
                    <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-purple-300' : 'text-purple-900'
                      }`}>Message Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-slate-800/30' : 'bg-white/60'
                        }`}>
                        <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-900'
                          }`}>{messageStats.messagesToday}</div>
                        <div className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'
                          }`}>Messages Sent Today</div>
                      </div>
                      <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-slate-800/30' : 'bg-white/60'
                        }`}>
                        <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-900'
                          }`}>{messageStats.activeAnnouncements}</div>
                        <div className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'
                          }`}>Active Announcements</div>
                      </div>
                      <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-slate-800/30' : 'bg-white/60'
                        }`}>
                        <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-900'
                          }`}>{messageStats.deliveryRate}%</div>
                        <div className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'
                          }`}>Delivery Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Message Tabs */}
                  <div className={`${getRoleCardClass()} rounded-xl border p-6`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <MessageSquare className="h-6 w-6 text-purple-600 mr-3" />
                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                          }`}>Message Management</h3>
                      </div>
                    </div>

                    <MessageTabs />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Tab */}
        {/* Analytics Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Analytics Header */}
              <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-adaptive">Analytics Dashboard</h2>
                      <p className="text-sm text-adaptive-secondary">Comprehensive insights into system performance</p>
                    </div>
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                    Last updated: {new Date().toLocaleString()}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                      ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/30'
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-green-300' : 'text-green-800'
                          }`}>Overall Attendance</p>
                        <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-green-400' : 'text-green-900'
                          }`}>{dashboardStats.attendanceRate}%</p>
                        <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-green-500' : 'text-green-600'
                          }`}>Last 7 days</p>
                      </div>
                      <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-green-900/30' : 'bg-green-100'
                        }`}>
                        <Target className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-green-400' : 'text-green-600'
                          }`} />
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                      ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-700/30'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-blue-300' : 'text-blue-800'
                          }`}>Messages Sent</p>
                        <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-900'
                          }`}>{dashboardStats.messagesThisWeek}</p>
                        <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-blue-500' : 'text-blue-600'
                          }`}>This week</p>
                      </div>
                      <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                        }`}>
                        <MessageCircle className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                      ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-700/30'
                      : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-yellow-300' : 'text-yellow-800'
                          }`}>Top Class</p>
                        <p className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-yellow-400' : 'text-yellow-900'
                          }`}>{dashboardStats.topPerformingClass}</p>
                        <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-yellow-500' : 'text-yellow-600'
                          }`}>Best attendance</p>
                      </div>
                      <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                        }`}>
                        <Award className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-yellow-400' : 'text-yellow-600'
                          }`} />
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                      ? 'bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-700/30'
                      : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-red-300' : 'text-red-800'
                          }`}>Low Attendance</p>
                        <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-900'
                          }`}>{dashboardStats.classesWithLowAttendance}</p>
                        <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-red-500' : 'text-red-600'
                          }`}>Classes need attention</p>
                      </div>
                      <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-red-900/30' : 'bg-red-100'
                        }`}>
                        <AlertTriangle className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'
                          }`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Charts and Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enhanced Attendance Trends Chart with Real Data */}
                <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${isDark ? "text-white" : "text-gray-900"
                        }`}>
                        <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                        Attendance Trends
                      </h3>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-gray-600"
                        }`}>
                        Last 7 days performance
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center text-sm ${isDark ? "text-green-400" : "text-green-600"
                        }`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Live Data
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadAnalytics}
                        className={`flex items-center text-xs px-3 py-1 rounded-full transition-colors duration-300 ${isDark
                            ? "bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 border border-purple-700/50"
                            : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                          }`}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </motion.button>
                    </div>
                  </div>

                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Current Rate */}
                    <div className={`text-center p-3 rounded-lg border transition-colors duration-300 ${isDark
                        ? "bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/30"
                        : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      }`}>
                      <div className={`text-lg font-bold transition-colors duration-300 ${isDark ? "text-green-400" : "text-green-900"
                        }`}>
                        {analytics.attendanceTrends.length > 0
                          ? `${Math.round(
                            analytics.attendanceTrends[analytics.attendanceTrends.length - 1]?.rate || 0
                          )}%`
                          : "0%"}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${isDark ? "text-green-500" : "text-green-600"
                        }`}>
                        Current Rate
                      </div>
                    </div>

                    {/* Peak */}
                    <div className={`text-center p-3 rounded-lg border transition-colors duration-300 ${isDark
                        ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-700/30"
                        : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                      }`}>
                      <div className={`text-lg font-bold transition-colors duration-300 ${isDark ? "text-blue-400" : "text-blue-900"
                        }`}>
                        {analytics.attendanceTrends.length > 0
                          ? `${Math.round(
                            Math.max(...analytics.attendanceTrends.map((d) => d.rate))
                          )}%`
                          : "0%"}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${isDark ? "text-blue-500" : "text-blue-600"
                        }`}>
                        Peak Rate
                      </div>
                    </div>

                    {/* Lowest */}
                    <div className={`text-center p-3 rounded-lg border transition-colors duration-300 ${isDark
                        ? "bg-gradient-to-r from-purple-900/20 to-violet-900/20 border-purple-700/30"
                        : "bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
                      }`}>
                      <div className={`text-lg font-bold transition-colors duration-300 ${isDark ? "text-purple-400" : "text-purple-900"
                        }`}>
                        {analytics.attendanceTrends.length > 0
                          ? `${Math.round(
                            Math.min(...analytics.attendanceTrends.map((d) => d.rate))
                          )}%`
                          : "0%"}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${isDark ? "text-purple-500" : "text-purple-600"
                        }`}>
                        Lowest Rate
                      </div>
                    </div>

                    {/* Average */}
                    <div className={`text-center p-3 rounded-lg border transition-colors duration-300 ${isDark
                        ? "bg-gradient-to-r from-orange-900/20 to-amber-900/20 border-orange-700/30"
                        : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                      }`}>
                      <div className={`text-lg font-bold transition-colors duration-300 ${isDark ? "text-orange-400" : "text-orange-900"
                        }`}>
                        {analytics.attendanceTrends.length > 0
                          ? `${Math.round(
                            analytics.attendanceTrends.reduce(
                              (acc, curr) => acc + curr.rate,
                              0
                            ) / analytics.attendanceTrends.length
                          )}%`
                          : "0%"}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${isDark ? "text-orange-500" : "text-orange-600"
                        }`}>
                        Average
                      </div>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className={`rounded-xl border p-4 transition-colors duration-300 ${isDark
                      ? "bg-gradient-to-br from-slate-800/50 to-slate-900/30 border-slate-600"
                      : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
                    }`}>
                    {analytics.attendanceTrends.length === 0 ? (
                      <div className="flex items-center justify-center h-80">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No attendance data available</p>
                          <p className="text-sm">Attendance trends will appear here</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={analytics.attendanceTrends}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDark ? "#374151" : "#e5e7eb"}
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                              tickLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                              axisLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                });
                              }}
                            />
                            <YAxis
                              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                              tickLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                              axisLine={{ stroke: isDark ? '#4b5563' : '#d1d5db' }}
                              tickFormatter={(value) => `${value}%`}
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                borderColor: isDark ? '#374151' : '#e5e7eb',
                                borderRadius: '0.5rem',
                                color: isDark ? '#f9fafb' : '#111827'
                              }}
                              formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
                              labelFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                });
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="rate"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={{
                                fill: '#8b5cf6',
                                strokeWidth: 2,
                                stroke: isDark ? '#1f2937' : '#ffffff',
                                r: 5
                              }}
                              activeDot={{
                                r: 7,
                                fill: '#7c3aed',
                                stroke: isDark ? '#1f2937' : '#ffffff',
                                strokeWidth: 2
                              }}
                              name="Attendance Rate"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Additional Insights */}
                  {analytics.attendanceTrends.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/30 border-slate-600' : 'bg-blue-50 border-blue-200'
                        }`}>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                          <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'
                            }`}>
                            Weekly Trend
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-blue-600'
                          }`}>
                          {analytics.attendanceTrends.length >= 2 ?
                            analytics.attendanceTrends[analytics.attendanceTrends.length - 1].rate >
                              analytics.attendanceTrends[0].rate ?
                              '📈 Improving trend this week' :
                              '📉 Needs attention'
                            : 'Collecting more data...'
                          }
                        </p>
                      </div>

                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/30 border-slate-600' : 'bg-purple-50 border-purple-200'
                        }`}>
                        <div className="flex items-center space-x-2">
                          <Users className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'
                            }`}>
                            Total Records
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-purple-600'
                          }`}>
                          {analytics.attendanceTrends.reduce((sum, day) => sum + (day.total || 0), 0)}
                          attendance records this week
                        </p>
                      </div>
                    </div>
                  )}
                </div>


                {/* Enhanced Department Performance */}
                <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                      Department Performance
                    </h3>
                    <div className="flex items-center gap-3">
                      {analytics.departmentPerformance && analytics.departmentPerformance.length > 3 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAllDepartmentPerformance(!showAllDepartmentPerformance)}
                          className={`text-xs px-3 py-1 rounded-full transition-colors duration-300 ${isDark
                              ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 border border-purple-700/50'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            }`}
                        >
                          {showAllDepartmentPerformance ? 'Show Less' : `Show All (${analytics.departmentPerformance.length})`}
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {analytics.departmentPerformance && analytics.departmentPerformance.length > 0 ? (
                      (showAllDepartmentPerformance ? analytics.departmentPerformance : analytics.departmentPerformance.slice(0, 8)).map((dept, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'
                          }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${dept.attendanceRate >= 90 ? 'bg-green-500' :
                                dept.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                            <div>
                              <div className={`font-medium text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>{dept.departmentName}</div>
                              <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                }`}>{dept.studentCount} students • {dept.staffCount} staff • {dept.classCount} classes</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{dept.attendanceRate}%</div>
                            <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>{dept.messagesCount} messages</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-sm text-center py-4 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>No department performance data available.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Staff Activity and System Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enhanced Staff Activity */}
                <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      <Activity className="h-5 w-5 mr-2 text-purple-600" />
                      Staff Activity
                    </h3>
                    <div className="flex items-center gap-3">
                      {analytics.staffActivity.length > 3 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAllStaffActivity(!showAllStaffActivity)}
                          className={`text-xs px-3 py-1 rounded-full transition-colors duration-300 ${isDark
                              ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 border border-purple-700/50'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            }`}
                        >
                          {showAllStaffActivity ? 'Show Less' : `Show All (${analytics.staffActivity.length})`}
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {(showAllStaffActivity ? analytics.staffActivity : analytics.staffActivity.slice(0, 3)).map((staff, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 border rounded-lg transition-colors duration-300 ${isDark
                          ? 'border-slate-600 bg-slate-800/30'
                          : 'border-gray-200 bg-white'
                        }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                            }`}>
                            <UserCheck className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-600'
                              }`} />
                          </div>
                          <div>
                            <div className={`font-medium text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{staff.staffName}</div>
                            <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                              {staff.classesManaged} class{staff.classesManaged !== 1 ? 'es' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>{staff.messagesCount} messages</div>
                          <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                            {new Date(staff.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced System Activity */}
                <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      <Activity className="h-5 w-5 mr-2 text-purple-600" />
                      System Activity (7 days)
                    </h3>
                    <div className="flex items-center gap-3">
                      {analytics.systemActivity && analytics.systemActivity.length > 3 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAllSystemActivity(!showAllSystemActivity)}
                          className={`text-xs px-3 py-1 rounded-full transition-colors duration-300 ${isDark
                              ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 border border-purple-700/50'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            }`}
                        >
                          {showAllSystemActivity ? 'Show Less' : `Show All (${analytics.systemActivity.length})`}
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analytics.systemActivity && analytics.systemActivity.length > 0 ? (
                      (showAllSystemActivity ? [...analytics.systemActivity].reverse() : [...analytics.systemActivity].reverse().slice(0, 3)).map((day, index) => (
                        <div key={index} className={`grid grid-cols-4 gap-4 p-3 rounded-lg transition-colors duration-300 ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'
                          }`}>
                          <div className={`text-xs font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                            }`}>
                            {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                          </div>
                          <div className="text-xs text-center">
                            <div className={`font-semibold transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'
                              }`}>{day.logins}</div>
                            <div className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>Logins</div>
                          </div>
                          <div className="text-xs text-center">
                            <div className={`font-semibold transition-colors duration-300 ${isDark ? 'text-green-400' : 'text-green-600'
                              }`}>{day.messages}</div>
                            <div className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>Messages</div>
                          </div>
                          <div className="text-xs text-center">
                            <div className={`font-semibold transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-600'
                              }`}>{day.attendanceRecords}</div>
                            <div className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>Records</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-sm text-center py-4 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>No system activity available.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Login Analytics Section */}
              {analytics.loginStats && (
                <div className="space-y-8">
                  <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-lg font-semibold flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        <Shield className="h-5 w-5 mr-2 text-purple-600" />
                        Login Analytics (Last 30 Days)
                      </h3>
                      <div className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                        Real-time data
                      </div>
                    </div>

                    {/* Login Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                          ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-700/30'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-blue-300' : 'text-blue-800'
                              }`}>Total Logins</p>
                            <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-900'
                              }`}>{analytics.loginStats.totalLogins}</p>
                            <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-blue-500' : 'text-blue-600'
                              }`}>Successful attempts</p>
                          </div>
                          <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                            <CheckCircle2 className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                          ? 'bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-700/30'
                          : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-red-300' : 'text-red-800'
                              }`}>Failed Logins</p>
                            <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-900'
                              }`}>{analytics.loginStats.failedLogins}</p>
                            <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-red-500' : 'text-red-600'
                              }`}>Security attempts</p>
                          </div>
                          <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-red-900/30' : 'bg-red-100'
                            }`}>
                            <XCircle className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'
                              }`} />
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                          ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/30'
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-green-300' : 'text-green-800'
                              }`}>Unique Users</p>
                            <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-green-400' : 'text-green-900'
                              }`}>{analytics.loginStats.uniqueUsers}</p>
                            <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-green-500' : 'text-green-600'
                              }`}>Active accounts</p>
                          </div>
                          <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-green-900/30' : 'bg-green-100'
                            }`}>
                            <Users className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-green-400' : 'text-green-600'
                              }`} />
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-lg p-4 border transition-colors duration-300 ${isDark
                          ? 'bg-gradient-to-r from-purple-900/20 to-violet-900/20 border-purple-700/30'
                          : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-purple-300' : 'text-purple-800'
                              }`}>Success Rate</p>
                            <p className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-900'
                              }`}>
                              {Math.round((analytics.loginStats.totalLogins / (analytics.loginStats.totalLogins + analytics.loginStats.failedLogins)) * 100)}%
                            </p>
                            <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-purple-500' : 'text-purple-600'
                              }`}>Login success</p>
                          </div>
                          <div className={`p-2 rounded-full transition-colors duration-300 ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                            }`}>
                            <Target className={`h-5 w-5 transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-600'
                              }`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Login by Role and Top Users */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Login by Role */}
                      <div>
                        <h4 className={`text-md font-semibold mb-4 flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                          <PieChart className="h-4 w-4 mr-2 text-purple-600" />
                          Logins by Role
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(analytics.loginStats.roleStats).map(([role, count]) => (
                            <div key={role} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'
                              }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${role === 'SUPER_ADMIN' ? 'bg-red-500' :
                                    role === 'STAFF' ? 'bg-blue-500' : 'bg-green-500'
                                  }`}></div>
                                <span className={`font-medium text-sm capitalize transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                  }`}>
                                  {role.replace('_', ' ').toLowerCase()}
                                </span>
                              </div>
                              <div className={`text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                {count} logins
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Most Active Users */}
                      <div>
                        <h4 className={`text-md font-semibold mb-4 flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                          <Activity className="h-4 w-4 mr-2 text-purple-600" />
                          Most Active Users
                        </h4>
                        <div className="space-y-3">
                          {analytics.loginStats.topUsers.slice(0, 5).map((userStat, index) => (
                            <div key={index} className={`flex items-center justify-between p-3 border rounded-lg transition-colors duration-300 ${isDark
                                ? 'border-slate-600 bg-slate-800/30'
                                : 'border-gray-200 bg-white'
                              }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-colors duration-300 ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                      index === 2 ? 'bg-yellow-600' : 'bg-purple-500'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className={`font-medium text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                    }`}>{userStat.user.name}</div>
                                  <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                    }`}>
                                    {userStat.user.role.replace('_', ' ').toLowerCase()}
                                  </div>
                                </div>
                              </div>
                              <div className={`text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                {userStat.loginCount} logins
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reports Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className={`${getRoleCardClass()} rounded-xl shadow-sm border p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-adaptive">Reports & Export</h2>
                      <p className="text-sm text-adaptive-secondary">Generate and download comprehensive reports</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => console.log('Report generator not implemented yet')}
                    className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Report
                  </motion.button>
                </div>

                {/* Quick Report Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { type: 'attendance', label: 'Attendance Report', icon: CheckCircle2, color: 'green' },
                    { type: 'performance', label: 'Performance Report', icon: TrendingUp, color: 'blue' },
                    { type: 'activity', label: 'Activity Report', icon: Activity, color: 'purple' },
                    { type: 'summary', label: 'Summary Report', icon: BarChart3, color: 'orange' }
                  ].map((reportType) => (
                    <motion.button
                      key={reportType.type}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${reportType.color === 'green' ?
                          isDark ? 'border-green-700 hover:border-green-600 hover:bg-green-900/20' : 'border-green-300 hover:border-green-400 hover:bg-green-50' :
                          reportType.color === 'blue' ?
                            isDark ? 'border-blue-700 hover:border-blue-600 hover:bg-blue-900/20' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50' :
                            reportType.color === 'purple' ?
                              isDark ? 'border-purple-700 hover:border-purple-600 hover:bg-purple-900/20' : 'border-purple-300 hover:border-purple-400 hover:bg-purple-50' :
                              isDark ? 'border-orange-700 hover:border-orange-600 hover:bg-orange-900/20' : 'border-orange-300 hover:border-orange-400 hover:bg-orange-50'
                        }`}
                      onClick={() => {
                        // Generate quick report
                        const report: ReportData = {
                          type: reportType.type as any,
                          dateRange: {
                            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            end: new Date().toISOString().split('T')[0]
                          },
                          data: analytics,
                          generatedAt: new Date().toISOString()
                        };
                        setReports(prev => [report, ...prev]);
                      }}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`p-2 rounded-full ${reportType.color === 'green' ?
                            isDark ? 'bg-green-900/30' : 'bg-green-100' :
                            reportType.color === 'blue' ?
                              isDark ? 'bg-blue-900/30' : 'bg-blue-100' :
                              reportType.color === 'purple' ?
                                isDark ? 'bg-purple-900/30' : 'bg-purple-100' :
                                isDark ? 'bg-orange-900/30' : 'bg-orange-100'
                          }`}>
                          <reportType.icon className={`h-5 w-5 ${reportType.color === 'green' ?
                              isDark ? 'text-green-400' : 'text-green-600' :
                              reportType.color === 'blue' ?
                                isDark ? 'text-blue-400' : 'text-blue-600' :
                                reportType.color === 'purple' ?
                                  isDark ? 'text-purple-400' : 'text-purple-600' :
                                  isDark ? 'text-orange-400' : 'text-orange-600'
                            }`} />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'
                          }`}>{reportType.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Generated Reports */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>Generated Reports</h3>
                  {reports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No reports generated yet</p>
                      <p className="text-sm">Click on a report type above to generate one</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${isDark
                            ? 'border-slate-600 bg-slate-800/30'
                            : 'border-gray-200 bg-white'
                          }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                              }`}>
                              <FileText className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`} />
                            </div>
                            <div>
                              <div className={`font-medium text-sm transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                {report.type} Report
                              </div>
                              <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                }`}>
                                {report.dateRange.start} to {report.dateRange.end}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                              {new Date(report.generatedAt).toLocaleString()}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${isDark
                                  ? 'text-purple-300 bg-purple-900/30 hover:bg-purple-800/40'
                                  : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                                }`}
                              onClick={() => downloadReport(report)}
                            >
                              Download
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-sm ${isDark ? 'bg-slate-800/95 border border-slate-600' : 'bg-white/95 border border-purple-200'
                }`}
            >
              <div className={`px-8 py-6 border-b sticky top-0 rounded-t-2xl backdrop-blur-sm ${isDark ? 'border-slate-600 bg-slate-800/95' : 'border-purple-200 bg-white/95'
                }`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                    }`}>
                    {expandedSection === 'students' ? (
                      <GraduationCap className={`h-6 w-6 ${isDark ? 'text-purple-300' : 'text-purple-600'
                        }`} />
                    ) : (
                      <Users className={`h-6 w-6 ${isDark ? 'text-purple-300' : 'text-purple-600'
                        }`} />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                      {editingItem ? "Edit" : "Add"} {expandedSection === 'students' ? 'Student' : 'Staff Member'}
                    </h2>
                    <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                      {editingItem ? 'Update the information below' : 'Fill in the details to create a new account'}
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                          : 'border-purple-300 text-gray-900 placeholder-gray-500'
                        }`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                          : 'border-purple-300 text-gray-900 placeholder-gray-500'
                        }`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  {/* Enhanced Password Field */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                      {editingItem ? 'New Password (leave empty to keep current)' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={editingItem ? "Enter new password (optional)" : "Enter password"}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                            : 'border-purple-300 text-gray-900 placeholder-gray-500'
                          }`}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          checkPasswordStrength(e.target.value);
                        }}
                        required={!editingItem}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                          }`}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score <= 1 ? 'bg-red-500 w-1/5' :
                                  passwordStrength.score === 2 ? 'bg-orange-500 w-2/5' :
                                    passwordStrength.score === 3 ? 'bg-yellow-500 w-3/5' :
                                      passwordStrength.score === 4 ? 'bg-blue-500 w-4/5' :
                                        'bg-green-500 w-full'
                                }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.score <= 1 ? 'text-red-500' :
                              passwordStrength.score === 2 ? 'text-orange-500' :
                                passwordStrength.score === 3 ? 'text-yellow-500' :
                                  passwordStrength.score === 4 ? 'text-blue-500' :
                                    'text-green-500'
                            }`}>
                            {passwordStrength.feedback}
                          </span>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          Password should contain: uppercase, lowercase, numbers, and special characters (min 8 chars)
                        </div>
                      </div>
                    )}
                  </div>
                  {expandedSection === "students" ? (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Roll Number</label>
                        <input
                          type="text"
                          placeholder="Enter roll number"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                              : 'border-purple-300 text-gray-900 placeholder-gray-500'
                            }`}
                          value={formData.rollNumber}
                          onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <ModernDropdown
                          label="Department"
                          required
                          value={formData.departmentId}
                          onChange={(value) => {
                            setFormData({
                              ...formData,
                              departmentId: value,
                              classId: "" // Reset class when department changes
                            });
                          }}
                          options={[
                            { value: '', label: 'Select department', disabled: true },
                            ...departments.map(dept => ({
                              value: dept.id.toString(),
                              label: dept.name,
                              description: dept.description || `${dept.studentCount || 0} students`,
                              icon: <Building2 className="h-4 w-4" />
                            }))
                          ]}
                          placeholder="Select department"
                          clearable
                        />
                      </div>
                      <div>
                        <ModernDropdown
                          label="Class"
                          required
                          disabled={!formData.departmentId}
                          value={formData.classId}
                          onChange={(value) => setFormData({ ...formData, classId: value })}
                          options={[
                            { value: '', label: 'Select class', disabled: true },
                            ...(formData.departmentId ? classes
                              .filter(c => c.department?.id === Number(formData.departmentId))
                              .map(c => ({
                                value: c.id.toString(),
                                label: c.name,
                                description: `${c.studentCount} students`,
                                icon: <BookOpen className="h-4 w-4" />
                              })) : [])
                          ]}
                          placeholder={!formData.departmentId ? "Select department first" : "Select class"}
                          clearable
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Parent Email</label>
                        <input
                          type="email"
                          placeholder="Enter parent email"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                              : 'border-purple-300 text-gray-900 placeholder-gray-500'
                            }`}
                          value={formData.parentEmail}
                          onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Role</label>
                        <input
                          type="text"
                          placeholder="Enter role"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                              : 'border-purple-300 text-gray-900 placeholder-gray-500'
                            }`}
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <ModernDropdown
                          label="Department"
                          required
                          value={formData.departmentId}
                          onChange={(value) => {
                            const selectedDept = departments.find(d => d.id === Number(value));
                            setFormData({
                              ...formData,
                              departmentId: value,
                              department: selectedDept?.name || "",
                              classId: "" // Reset class when department changes
                            });
                          }}
                          options={[
                            { value: '', label: 'Select department', disabled: true },
                            ...departments.map(dept => ({
                              value: dept.id.toString(),
                              label: dept.name,
                              description: dept.description || `${dept.studentCount || 0} students`,
                              icon: Building2
                            }))
                          ]}
                          placeholder="Select department"
                          clearable
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Class Name (managed)</label>
                        <input
                          type="text"
                          placeholder="e.g., BCA A or MCA A"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                              : 'border-purple-300 text-gray-900 placeholder-gray-500'
                            }`}
                          value={formData.className}
                          onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                        />
                        <p className={`text-xs mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'
                          }`}>Provide a class name to assign or create and assign to this staff.</p>
                      </div>
                    </>
                  )}
                </div>
                <div className={`flex justify-end gap-3 pt-6 border-t ${isDark ? 'border-slate-600' : 'border-purple-200'
                  }`}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-lg transition-colors font-medium ${isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    onClick={resetForm}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                  >
                    {editingItem ? "Update" : "Create"} {expandedSection?.slice(0, 9) || "User"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Department Form Modal */}
      <AnimatePresence>
        {showDepartmentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={resetDepartmentForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl shadow-2xl max-w-lg w-full mx-4 backdrop-blur-sm ${isDark ? 'bg-slate-800/95 border border-slate-600' : 'bg-white/95 border border-purple-200'
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`px-8 py-6 border-b rounded-t-2xl ${isDark ? 'border-slate-600 bg-slate-800/50' : 'border-purple-200 bg-purple-50/50'
                }`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                    }`}>
                    <Building2 className={`h-6 w-6 ${isDark ? 'text-purple-300' : 'text-purple-600'
                      }`} />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                      {selectedDepartment ? 'Edit Department' : 'Create Department'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                      {selectedDepartment ? 'Update department information' : 'Add a new department to the system'}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleDepartmentSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-adaptive-secondary mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={departmentFormData.name}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDark
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="Enter department name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive-secondary mb-2">
                    Description
                  </label>
                  <textarea
                    value={departmentFormData.description}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDark
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="Enter department description"
                    rows={3}
                  />
                </div>

                <div>
                  <ModernDropdown
                    label="Department Head"
                    value={departmentFormData.headId}
                    onChange={(value) => setDepartmentFormData(prev => ({ ...prev, headId: value }))}
                    options={[
                      { value: '', label: 'Select Department Head', disabled: true },
                      ...staff.map(s => ({
                        value: s.id.toString(),
                        label: `${s.name} (${s.role})`,
                        description: s.email,
                        icon: UserCheck
                      }))
                    ]}
                    placeholder="Select Department Head"
                    clearable
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetDepartmentForm}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors ${isDark
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${theme.buttonBg}`}
                  >
                    {selectedDepartment ? 'Update' : 'Create'} Department
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Form Modal */}
      <AnimatePresence>
        {showClassForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl shadow-2xl w-full max-w-lg backdrop-blur-sm ${isDark ? 'bg-slate-800/95 border border-slate-600' : 'bg-white/95 border border-purple-200'
                }`}
            >
              <div className={`px-8 py-6 border-b rounded-t-2xl ${isDark ? 'border-slate-600 bg-slate-800/50' : 'border-purple-200 bg-purple-50/50'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                      }`}>
                      <BookOpen className={`h-6 w-6 ${isDark ? 'text-purple-300' : 'text-purple-600'
                        }`} />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                        {selectedClass ? 'Edit Class' : 'Create New Class'}
                      </h2>
                      <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'
                        }`}>
                        {selectedClass ? 'Update class information' : 'Add a new class to the system'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetClassForm}
                    className={`p-2 rounded-lg transition-colors ${isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleClassSubmit} className="p-8 space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}>Class Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., BCA A, MCA B, BSc IT"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'border-purple-300 text-gray-900 placeholder-gray-500'
                      }`}
                    value={classFormData.name}
                    onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <ModernDropdown
                    label="Assign Staff (Optional)"
                    value={classFormData.staffId}
                    onChange={(value) => setClassFormData({ ...classFormData, staffId: value })}
                    options={[
                      { value: '', label: 'No staff assigned', disabled: false },
                      ...staff.map(s => ({
                        value: s.id.toString(),
                        label: `${s.name} - ${s.email}`,
                        description: s.role,
                        icon: Users
                      }))
                    ]}
                    placeholder="No staff assigned"
                    clearable
                  />
                </div>
                <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-600' : 'border-purple-200'
                  }`}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-lg transition-colors font-medium ${isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    onClick={resetClassForm}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md flex items-center`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {selectedClass ? 'Update Class' : 'Create Class'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Students Modal */}
      <AnimatePresence>
        {showAssignStudents && selectedClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-purple-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Assign Students to {selectedClass.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Select students to assign to this class
                  </p>
                </div>
                <button
                  onClick={resetAssignForm}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {unassignedStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No unassigned students</p>
                    <p className="text-gray-400">All students are already assigned to classes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mb-4">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 mr-2"
                          checked={selectedStudents.length === unassignedStudents.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(unassignedStudents.map(s => s.id));
                            } else {
                              setSelectedStudents([]);
                            }
                          }}
                        />
                        Select All ({unassignedStudents.length} students)
                      </label>
                    </div>
                    {unassignedStudents.map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 mr-3"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.rollNumber} • {student.email}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {unassignedStudents.length > 0 && (
                <div className="px-6 py-4 border-t border-purple-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedStudents.length} of {unassignedStudents.length} students selected
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                      onClick={resetAssignForm}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={handleAssignStudents}
                      disabled={selectedStudents.length === 0}
                    >
                      <Users2 className="h-4 w-4 mr-2" />
                      Assign {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-gray-200'
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Settings Header */}
              <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isDark
                  ? 'bg-slate-900/95 border-slate-700 backdrop-blur-sm'
                  : 'bg-white/95 border-gray-200 backdrop-blur-sm'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>System Settings</h2>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                        }`}>Manage system configuration and data</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                  >
                    <X className={`h-5 w-5 ${isDark ? 'text-slate-300' : 'text-gray-600'
                      }`} />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Admin Details Section */}
                <div className={`rounded-xl border p-6 ${isDark
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>Administrator Details</h3>
                  </div>

                  {adminDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Name</label>
                        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'
                          }`}>{adminDetails.admin.name}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Email</label>
                        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'
                          }`}>{adminDetails.admin.email}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Role</label>
                        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'
                          }`}>{adminDetails.admin.role}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Last Login</label>
                        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'
                          }`}>{adminDetails.admin.lastLogin ? new Date(adminDetails.admin.lastLogin).toLocaleString() : 'Never'}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Total Users</label>
                        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'
                          }`}>{adminDetails.systemStats.totalUsers}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>Total Messages</label>
                        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'
                          }`}>{adminDetails.systemStats.totalMessages}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                    </div>
                  )}
                </div>

                {/* Database Backup Section */}
                <div className={`rounded-xl border p-6 ${isDark
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center space-x-3 mb-6">
                    <Database className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>Database Backup</h3>
                  </div>

                  {/* Backup Options */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                        Backup Type
                      </label>
                      <div className="flex space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBackupOptions({ ...backupOptions, backupType: 'full' })}
                          className={`flex-1 px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${backupOptions.backupType === 'full'
                              ? isDark
                                ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                                : 'border-blue-500 bg-blue-50 text-blue-700'
                              : isDark
                                ? 'border-slate-600 text-slate-300 hover:border-blue-400'
                                : 'border-gray-300 text-gray-700 hover:border-blue-300'
                            }`}
                        >
                          <Database className="h-4 w-4 mx-auto mb-1" />
                          Full Database
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBackupOptions({ ...backupOptions, backupType: 'class' })}
                          className={`flex-1 px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 ${backupOptions.backupType === 'class'
                              ? isDark
                                ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                                : 'border-blue-500 bg-blue-50 text-blue-700'
                              : isDark
                                ? 'border-slate-600 text-slate-300 hover:border-blue-400'
                                : 'border-gray-300 text-gray-700 hover:border-blue-300'
                            }`}
                        >
                          <BookOpen className="h-4 w-4 mx-auto mb-1" />
                          Class-wise
                        </motion.button>
                      </div>
                    </div>

                    {backupOptions.backupType === 'class' && (
                      <div>
                        <ModernDropdown
                          label="Select Class"
                          value={backupOptions.classId}
                          onChange={(value) => setBackupOptions({ ...backupOptions, classId: value })}
                          options={[
                            { value: '', label: 'Select a class', disabled: true },
                            ...classes.map((cls) => ({
                              value: cls.id.toString(),
                              label: cls.name,
                              description: `${cls.studentCount} students`,
                              icon: BookOpen
                            }))
                          ]}
                          placeholder="Select a class"
                          searchable
                          clearable
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>
                          Date From (Optional)
                        </label>
                        <input
                          type="date"
                          value={backupOptions.dateFrom}
                          onChange={(e) => setBackupOptions({ ...backupOptions, dateFrom: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${isDark
                              ? 'bg-slate-700 border-slate-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                          }`}>
                          Date To (Optional)
                        </label>
                        <input
                          type="date"
                          value={backupOptions.dateTo}
                          onChange={(e) => setBackupOptions({ ...backupOptions, dateTo: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${isDark
                              ? 'bg-slate-700 border-slate-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={createBackup}
                        disabled={settingsLoading || (backupOptions.backupType === 'class' && !backupOptions.classId)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {settingsLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <HardDrive className="h-4 w-4 mr-2" />
                            Create Backup
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {backups.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No backups available</p>
                        <p className="text-sm">Create your first backup to get started</p>
                      </div>
                    ) : (
                      backups.slice(0, 5).map((backup, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-white'
                          }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${backup.type === 'zip'
                                ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                                : isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                              }`}>
                              <HardDrive className={`h-4 w-4 ${backup.type === 'zip'
                                  ? isDark ? 'text-green-400' : 'text-green-600'
                                  : isDark ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>{backup.filename}</p>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                {new Date(backup.created).toLocaleString()} • {(backup.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => downloadBackup(backup.filename)}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${isDark
                                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                          >
                            Download
                          </motion.button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Data Cleanup Section */}
                <div className={`rounded-xl border p-6 ${isDark
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Trash className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'
                      }`} />
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>Data Cleanup</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                        Cleanup Type
                      </label>
                      <div className="space-y-3">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setCleanupOptions({ ...cleanupOptions, cleanupType: 'data_only' })}
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 text-left ${cleanupOptions.cleanupType === 'data_only'
                              ? isDark
                                ? 'border-yellow-500 bg-yellow-900/20 text-yellow-300'
                                : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                              : isDark
                                ? 'border-slate-600 text-slate-300 hover:border-yellow-400'
                                : 'border-gray-300 text-gray-700 hover:border-yellow-300'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Trash className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Data Only Cleanup</div>
                              <div className="text-xs opacity-75">Remove messages, attendance, and logs only</div>
                            </div>
                          </div>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setCleanupOptions({ ...cleanupOptions, cleanupType: 'complete_department_deletion' })}
                          className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 text-left ${cleanupOptions.cleanupType === 'complete_department_deletion'
                              ? isDark
                                ? 'border-red-500 bg-red-900/20 text-red-300'
                                : 'border-red-500 bg-red-50 text-red-700'
                              : isDark
                                ? 'border-slate-600 text-slate-300 hover:border-red-400'
                                : 'border-gray-300 text-gray-700 hover:border-red-300'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-4 w-4" />
                            <div>
                              <div className="font-medium">⚠️ Complete Department Deletion</div>
                              <div className="text-xs opacity-75">Permanently delete entire department including all classes and student data</div>
                            </div>
                          </div>
                        </motion.button>
                      </div>
                    </div>

                    {cleanupOptions.cleanupType === 'complete_department_deletion' && (
                      <div>
                        <ModernDropdown
                          label="Select Department to Delete"
                          value={cleanupOptions.departmentId}
                          onChange={(value) => {
                            setCleanupOptions({ ...cleanupOptions, departmentId: value });
                            loadCleanupPreview();
                          }}
                          options={[
                            { value: '', label: 'Select a department to delete', disabled: true },
                            ...departments.map((dept) => ({
                              value: dept.id.toString(),
                              label: dept.name,
                              description: dept.description,
                              icon: AlertTriangle
                            }))
                          ]}
                          placeholder="Select a department to delete"
                          searchable
                          clearable
                        />
                      </div>
                    )}

                    {cleanupOptions.cleanupType === 'data_only' && (
                      <>
                        <div>
                          <ModernDropdown
                            label="Filter by Department (Optional)"
                            value={cleanupOptions.departmentId}
                            onChange={(value) => {
                              setCleanupOptions({ ...cleanupOptions, departmentId: value });
                              loadCleanupPreview();
                            }}
                            options={[
                              { value: '', label: 'All classes', disabled: false },
                              ...classes.map((cls) => ({
                                value: cls.id.toString(),
                                label: cls.name,
                                description: `${cls.studentCount} students`,
                                icon: BookOpen
                              }))
                            ]}
                            placeholder="All classes"
                            searchable
                            clearable
                          />
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <input
                              type="checkbox"
                              id="deleteImportantData"
                              checked={cleanupOptions.deleteImportantData}
                              onChange={(e) => {
                                setCleanupOptions({ ...cleanupOptions, deleteImportantData: e.target.checked });
                                loadCleanupPreview();
                              }}
                              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                            />
                            <label htmlFor="deleteImportantData" className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                              ⚠️ Also delete important data (student names, emails, etc.)
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                              Date From (Optional)
                            </label>
                            <input
                              type="date"
                              value={cleanupOptions.dateFrom}
                              onChange={(e) => {
                                setCleanupOptions({ ...cleanupOptions, dateFrom: e.target.value });
                                loadCleanupPreview();
                              }}
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${isDark
                                  ? 'bg-slate-700 border-slate-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                              Date To (Optional)
                            </label>
                            <input
                              type="date"
                              value={cleanupOptions.dateTo}
                              onChange={(e) => {
                                setCleanupOptions({ ...cleanupOptions, dateTo: e.target.value });
                                loadCleanupPreview();
                              }}
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${isDark
                                  ? 'bg-slate-700 border-slate-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            />
                          </div>
                        </div>

                        {!cleanupOptions.dateFrom && !cleanupOptions.dateTo && (
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                              Retention Period (Days)
                            </label>
                            <div className="flex items-center space-x-4">
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={retentionDays}
                                onChange={(e) => {
                                  setRetentionDays(parseInt(e.target.value));
                                  loadCleanupPreview();
                                }}
                                className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                              />
                              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                Keep records from the last {retentionDays} days
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {cleanupPreview && (
                      <div className={`p-4 rounded-lg border ${isDark
                          ? 'bg-red-900/20 border-red-700/30'
                          : 'bg-red-50 border-red-200'
                        }`}>
                        <h4 className={`font-medium mb-2 ${isDark ? 'text-red-300' : 'text-red-800'
                          }`}>Cleanup Preview</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className={`block ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>Messages:</span>
                            <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'
                              }`}>{cleanupPreview.preview.messagesToDelete || 0}</span>
                          </div>
                          <div>
                            <span className={`block ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>Attendance:</span>
                            <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'
                              }`}>{cleanupPreview.preview.attendanceToDelete || 0}</span>
                          </div>
                          <div>
                            <span className={`block ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>Login logs:</span>
                            <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'
                              }`}>{cleanupPreview.preview.loginLogsToDelete || 0}</span>
                          </div>
                          {(cleanupPreview.preview.usersToDelete > 0 || cleanupPreview.preview.studentsToDelete > 0) && (
                            <div>
                              <span className={`block ${isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}>Students:</span>
                              <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'
                                }`}>{cleanupPreview.preview.usersToDelete || cleanupPreview.preview.studentsToDelete || 0}</span>
                            </div>
                          )}
                          {cleanupPreview.preview.departmentsToDelete > 0 && (
                            <div>
                              <span className={`block ${isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}>Departments:</span>
                              <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'
                                }`}>{cleanupPreview.preview.departmentsToDelete}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-200/30">
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                            }`}>Total records to delete: </span>
                          <span className={`font-bold ${isDark ? 'text-red-300' : 'text-red-700'
                            }`}>{cleanupPreview.preview.totalRecords}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadCleanupPreview}
                        className={`px-4 py-2 border rounded-lg font-medium transition-colors ${isDark
                            ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        Refresh Preview
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={performCleanup}
                        disabled={
                          settingsLoading ||
                          !cleanupPreview ||
                          cleanupPreview.preview.totalRecords === 0 ||
                          (cleanupOptions.cleanupType === 'complete_department_deletion' && !cleanupOptions.departmentId)
                        }
                        className={`px-4 py-2 bg-gradient-to-r text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${cleanupOptions.cleanupType === 'complete_department_deletion'
                            ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                            : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                          }`}
                      >
                        {settingsLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            {cleanupOptions.cleanupType === 'complete_department_deletion' ? 'Deleting Department...' : 'Cleaning...'}
                          </>
                        ) : (
                          <>
                            {cleanupOptions.cleanupType === 'complete_department_deletion' ? (
                              <>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Delete Department Permanently
                              </>
                            ) : (
                              <>
                                <Trash className="h-4 w-4 mr-2" />
                                Clean Up Data
                              </>
                            )}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Management Modal */}
      <AnimatePresence>
        {showClassManagement && selectedDepartmentForClasses && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowClassManagement(false);
              setSelectedDepartmentForClasses(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-gray-200'
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isDark
                  ? 'bg-slate-900/95 border-slate-700 backdrop-blur-sm'
                  : 'bg-white/95 border-gray-200 backdrop-blur-sm'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>Manage Classes - {selectedDepartmentForClasses.name}</h2>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                        }`}>View and manage classes in this department</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowClassManagement(false);
                      setSelectedDepartmentForClasses(null);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                  >
                    <X className={`h-5 w-5 ${isDark ? 'text-slate-300' : 'text-gray-600'
                      }`} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {getClassesForDepartment(selectedDepartmentForClasses.id).map((classItem) => {
                    const classStudents = getStudentsForClass(classItem.id);
                    const incharge = staff.find(s => s.id === classItem.staffId);

                    return (
                      <motion.div
                        key={classItem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-6 transition-all duration-300 hover:shadow-lg ${isDark
                            ? 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-purple-100'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.buttonBg}`}>
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>{classItem.name}</h3>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                                }`}>Class ID: {classItem.id}</p>
                            </div>
                          </div>

                          {/* Edit and Delete Buttons */}
                          <div className="flex gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingClass(classItem);
                                setClassFormData({
                                  name: classItem.name,
                                  staffId: classItem.staffId?.toString() || '',
                                  departmentId: classItem.department?.id?.toString() || selectedDepartmentForClasses.id.toString()
                                });
                                setShowClassForm(true);
                                setShowClassManagement(false);
                              }}
                              className={`p-2 rounded-lg transition-colors ${isDark
                                  ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              title="Edit Class"
                            >
                              <Edit2 className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setClassToDelete(classItem);
                                setShowDeleteConfirm(true);
                              }}
                              className={`p-2 rounded-lg transition-colors ${isDark
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700/50'
                                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                }`}
                              title="Delete Class"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>Students</span>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{classStudents.length}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                              }`}>Class Incharge</span>
                            <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'
                              }`}>{incharge?.name || 'Not assigned'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              // Navigate to filtered students tab
                              setSelectedDepartmentForStudents(selectedDepartmentForClasses);
                              setSelectedClassForStudents(classItem);
                              setStudentsView('filtered');
                              setActiveTab('students');
                              setShowClassManagement(false);
                              setSelectedDepartmentForClasses(null);
                            }}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors font-medium border ${isDark
                                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                              }`}
                          >
                            <Users className="h-4 w-4 mr-2 inline" />
                            View Students ({classStudents.length})
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              // Navigate to filtered staff tab
                              setSelectedDepartmentForStaff(selectedDepartmentForClasses);
                              setSelectedClassForStaff(classItem);
                              setStaffView('filtered');
                              setActiveTab('staff');
                              setShowClassManagement(false);
                              setSelectedDepartmentForClasses(null);
                            }}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors font-medium border ${isDark
                                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                              }`}
                          >
                            <UserCheck className="h-4 w-4 mr-2 inline" />
                            View Staff
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {getClassesForDepartment(selectedDepartmentForClasses.id).length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No classes in this department</p>
                      <p className="text-gray-400">Classes will appear here once they are created</p>
                    </div>
                  )}
                </div>

                {/* Add Class Button */}
                <div className="mt-8 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleCreateClassInDepartment(selectedDepartmentForClasses);
                      setShowClassManagement(false);
                    }}
                    className={`flex items-center px-6 py-3 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Class to {selectedDepartmentForClasses.name}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Class Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && classToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setClassToDelete(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-gray-200'
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>Delete Class</h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>This action cannot be undone</p>
                  </div>
                </div>

                <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                  Are you sure you want to delete the class <strong>"{classToDelete.name}"</strong>?
                  This will remove all associated data and cannot be undone.
                </p>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setClassToDelete(null);
                    }}
                    className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${isDark
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/classes/${classToDelete.id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          }
                        });

                        if (response.ok) {
                          // Remove from local state
                          setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
                          setShowDeleteConfirm(false);
                          setClassToDelete(null);
                          // Show success message (you can add a toast notification here)
                        } else {
                          console.error('Failed to delete class');
                        }
                      } catch (error) {
                        console.error('Error deleting class:', error);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete Class
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
