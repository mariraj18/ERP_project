import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings as SettingsIcon, 
  Database, 
  Trash, 
  User, 
  Shield,
  HardDrive,
  RefreshCw,
  Download,
  AlertTriangle,
  BookOpen,
  Eye,
  EyeOff,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Bell,
  Calendar,
  Users,
  BarChart3,
  Cpu,
  Server,
  MessageSquare
} from 'lucide-react';
import { api } from '../utils/api';
import { ModernDropdown } from '../components/ui/ModernDropdown';
import { useRoleTheme } from '../hooks/useRoleTheme';

interface AdminDetails {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  loginCount: number;
}

interface BackupFile {
  name: string;
  size: number;
  created: string;
  type: string;
}

interface CleanupPreview {
  retentionDays: number;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  cleanupType: string;
  deleteImportantData: boolean;
  preview: {
    messagesToDelete: number;
    staffMessagesToDelete?: number;
    attendanceToDelete: number;
    loginLogsToDelete: number;
    usersToDelete?: number;
    studentsToDelete?: number;
    classesToDelete?: number;
    departmentsToDelete?: number;
    totalRecords: number;
  };
}

interface SystemStats {
  totalUsers: number;
  totalMessages: number;
  totalAttendance: number;
  databaseSize: string;
}

export default function Settings() {
  const { isDark } = useTheme();
  const { getRoleColors } = useRoleTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('admin');
  
  // Admin details state
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  
  // Backup state
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backupOptions, setBackupOptions] = useState({
    backupType: 'full' as 'full' | 'department',
    departmentId: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Cleanup state
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [cleanupOptions, setCleanupOptions] = useState({
    cleanupType: 'data_only' as 'data_only' | 'complete_department_deletion',
    departmentId: '',
    dateFrom: '',
    dateTo: '',
    deleteImportantData: false
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTimeout, setPreviewTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Departments for dropdowns
  const [departments, setDepartments] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [notifications, setNotifications] = useState<{type: string, message: string, id: string}[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const addNotification = (type: string, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { type, message, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAdminDetails(),
        loadBackups(),
        loadDepartments(),
        loadCleanupPreview()
      ]);
    } catch (error) {
      console.error('Failed to load settings data:', error);
      addNotification('error', 'Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const updateAdminDetails = async () => {
    try {
      setSettingsLoading(true);
      const response = await api.put('/settings/admin-details', editForm);
      setAdminDetails(response.data.admin);
      setIsEditing(false);
      addNotification('success', 'Admin details updated successfully');
    } catch (error: any) {
      console.error('Failed to update admin details:', error);
      addNotification('error', error.response?.data?.error || 'Failed to update admin details');
    } finally {
      setSettingsLoading(false);
    }
  };

  const startEditing = () => {
    if (adminDetails) {
      setEditForm({
        name: adminDetails.name,
        email: adminDetails.email
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({ name: '', email: '' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-b transition-colors duration-300 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsIcon className={`h-6 w-6 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </motion.div>
              <h1 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                System Settings
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadInitialData}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                }`}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => navigate('/super-admin')}
  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
    isDark 
      ? 'bg-blue-600 text-white hover:bg-blue-700' 
      : 'bg-blue-500 text-white hover:bg-blue-600'
  }`}
>
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
  Go to Dashboard
</motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-64"
          >
            <nav className={`rounded-xl border p-4 sticky top-8 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-2">
                {[
                  { id: 'admin', label: 'Admin Profile', icon: User, color: 'blue' },
                  { id: 'backup', label: 'Database Backup', icon: Database, color: 'green' },
                  { id: 'cleanup', label: 'Data Cleanup', icon: Trash, color: 'red' },
                  { id: 'security', label: 'Security', icon: Shield, color: 'purple' },
                  { id: 'system', label: 'System Info', icon: Server, color: 'orange' }
                ].map((section) => (
                  <motion.button
                    key={section.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${
                      activeSection === section.id
                        ? isDark
                          ? `bg-${section.color}-900/50 text-${section.color}-300 border border-${section.color}-700`
                          : `bg-${section.color}-50 text-${section.color}-700 border border-${section.color}-200`
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="font-medium">{section.label}</span>
                    {activeSection === section.id && (
                      <motion.div
                        layoutId="activeSection"
                        className={`absolute inset-0 bg-${section.color}-500/10 rounded-lg`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </nav>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-8 w-8 text-blue-500" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeSection === 'admin' && <AdminSection />}
                {activeSection === 'backup' && <BackupSection />}
                {activeSection === 'cleanup' && <CleanupSection />}
                {activeSection === 'security' && <SecuritySection />}
                {activeSection === 'system' && <SystemInfoSection />}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Component sections
  function AdminSection() {
    return (
      <div className="space-y-6">
        {/* Admin Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className={`h-5 w-5 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Admin Profile</h2>
            </div>
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startEditing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </motion.button>
            )}
          </div>

          {adminDetails ? (
            <div className="space-y-6">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={updateAdminDetails}
                      disabled={settingsLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{settingsLoading ? 'Saving...' : 'Save Changes'}</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={cancelEditing}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField label="Name" value={adminDetails.name} />
                  <InfoField label="Email" value={adminDetails.email} />
                  <InfoField 
                    label="Role" 
                    value={adminDetails.role} 
                    badge 
                    badgeColor="purple"
                  />
                  <InfoField 
                    label="Last Login" 
                    value={adminDetails.lastLogin ? new Date(adminDetails.lastLogin).toLocaleString() : 'Never'} 
                  />
                  <InfoField 
                    label="Login Count" 
                    value={`${adminDetails.loginCount || 0} times`} 
                  />
                  <InfoField 
                    label="Account Created" 
                    value={new Date(adminDetails.createdAt).toLocaleDateString()} 
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
        </motion.div>

        {/* System Statistics */}
        {systemStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl border p-6 ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>System Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Users}
                label="Total Users"
                value={systemStats.totalUsers}
                color="blue"
              />
              <StatCard 
                icon={MessageSquare}
                label="Total Messages"
                value={systemStats.totalMessages}
                color="green"
              />
              <StatCard 
                icon={Calendar}
                label="Attendance Records"
                value={systemStats.totalAttendance}
                color="purple"
              />
              <StatCard 
                icon={Database}
                label="Database Size"
                value={systemStats.databaseSize}
                color="orange"
              />
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  function BackupSection() {
    const createBackup = async () => {
      try {
        setSettingsLoading(true);
        const response = await api.post('/settings/backup', backupOptions);
        addNotification('success', `Backup created successfully! Type: ${backupOptions.backupType}`);
        await loadBackups();
      } catch (error: any) {
        addNotification('error', error.response?.data?.error || 'Failed to create backup');
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
        addNotification('success', 'Backup download started');
      } catch (error: any) {
        addNotification('error', error.response?.data?.error || 'Failed to download backup');
      }
    };

    return (
      <div className={`rounded-xl border p-6 ${
        isDark 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 mb-6">
          <Database className={`h-5 w-5 ${
            isDark ? 'text-green-400' : 'text-green-600'
          }`} />
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Database Backup</h2>
        </div>

        {/* Backup Options */}
        <div className="space-y-6 mb-8">
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Backup Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBackupOptions({ ...backupOptions, backupType: 'full' })}
                className={`p-4 border-2 rounded-xl font-medium transition-all duration-200 text-left ${
                  backupOptions.backupType === 'full'
                    ? isDark
                      ? 'border-green-500 bg-green-900/20 text-green-300'
                      : 'border-green-500 bg-green-50 text-green-700'
                    : isDark
                      ? 'border-slate-600 text-slate-300 hover:border-green-400'
                      : 'border-gray-300 text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Full Database</div>
                    <div className="text-sm opacity-75">Complete system backup</div>
                  </div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBackupOptions({ ...backupOptions, backupType: 'department' })}
                className={`p-4 border-2 rounded-xl font-medium transition-all duration-200 text-left ${
                  backupOptions.backupType === 'department'
                    ? isDark
                      ? 'border-green-500 bg-green-900/20 text-green-300'
                      : 'border-green-500 bg-green-50 text-green-700'
                    : isDark
                      ? 'border-slate-600 text-slate-300 hover:border-green-400'
                      : 'border-gray-300 text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Department-wise</div>
                    <div className="text-sm opacity-75">Specific department data</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {backupOptions.backupType === 'department' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <ModernDropdown
                label="Select Department"
                value={backupOptions.departmentId}
                onChange={(value) => setBackupOptions({ ...backupOptions, departmentId: value })}
                options={[
                  { value: '', label: 'Select a department', disabled: true },
                  ...departments.map((dept) => ({
                    value: dept.id.toString(),
                    label: dept.name,
                    description: `${dept.studentCount || 0} students, ${dept.classCount || 0} classes`,
                    icon: BookOpen
                  }))
                ]}
                placeholder="Select a department"
                searchable
                clearable
              />
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Date From (Optional)
              </label>
              <input
                type="date"
                value={backupOptions.dateFrom}
                onChange={(e) => setBackupOptions({ ...backupOptions, dateFrom: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Date To (Optional)
              </label>
              <input
                type="date"
                value={backupOptions.dateTo}
                onChange={(e) => setBackupOptions({ ...backupOptions, dateTo: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                  isDark 
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
              disabled={settingsLoading || (backupOptions.backupType === 'department' && !backupOptions.departmentId)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
            >
              {settingsLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                  </motion.div>
                  Creating Backup...
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

        {/* Existing Backups */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Existing Backups</h3>
          {backups.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500"
            >
              <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No backups available</p>
              <p className="text-sm">Create your first backup to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-700/50 border-slate-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      isDark ? 'bg-green-900/50' : 'bg-green-100'
                    }`}>
                      <Database className={`h-5 w-5 ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {backup.name}
                      </p>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        {backup.created} • {(backup.size / 1024 / 1024).toFixed(2)} MB • {backup.type}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => downloadBackup(backup.name)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
                      isDark
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function CleanupSection() {
    const performCleanup = async () => {
      if (!cleanupPreview || cleanupPreview.preview.totalRecords === 0) {
        addNotification('warning', 'No data to clean up');
        return;
      }

      let confirmMessage = `Are you sure you want to delete ${cleanupPreview.preview.totalRecords} records?`;
      
      if (cleanupOptions.cleanupType === 'complete_department_deletion') {
        confirmMessage = `⚠️ DANGER: This will permanently delete the entire department including all student data, classes, staff, messages, attendance records, and login logs. This action cannot be undone!\n\nRecords to delete: ${cleanupPreview.preview.totalRecords}`;
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
        addNotification('success', `Successfully cleaned up ${totalDeleted} records`);
        await loadCleanupPreview();
      } catch (error: any) {
        addNotification('error', error.response?.data?.error || 'Failed to clean up data');
      } finally {
        setSettingsLoading(false);
      }
    };

    return (
      <div className={`rounded-xl border p-6 ${
        isDark 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 mb-6">
          <Trash className={`h-5 w-5 ${
            isDark ? 'text-red-400' : 'text-red-600'
          }`} />
          <h2 className={`text-xl font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Data Cleanup</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Cleanup Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCleanupOptions({ ...cleanupOptions, cleanupType: 'data_only' })}
                className={`p-4 border-2 rounded-xl font-medium transition-all duration-200 text-left ${
                  cleanupOptions.cleanupType === 'data_only'
                    ? isDark
                      ? 'border-yellow-500 bg-yellow-900/20 text-yellow-300'
                      : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : isDark
                      ? 'border-slate-600 text-slate-300 hover:border-yellow-400'
                      : 'border-gray-300 text-gray-700 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Trash className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Data Only Cleanup</div>
                    <div className="text-sm opacity-75">Remove messages, attendance, and logs only</div>
                  </div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCleanupOptions({ ...cleanupOptions, cleanupType: 'complete_department_deletion' })}
                className={`p-4 border-2 rounded-xl font-medium transition-all duration-200 text-left ${
                  cleanupOptions.cleanupType === 'complete_department_deletion'
                    ? isDark
                      ? 'border-red-500 bg-red-900/20 text-red-300'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : isDark
                      ? 'border-slate-600 text-slate-300 hover:border-red-400'
                      : 'border-gray-300 text-gray-700 hover:border-red-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">⚠️ Complete Department Deletion</div>
                    <div className="text-sm opacity-75">Permanently delete entire department including all data</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {cleanupOptions.cleanupType === 'complete_department_deletion' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <ModernDropdown
                label="Select Department to Delete"
                value={cleanupOptions.departmentId}
                onChange={(value) => {
                  setCleanupOptions({ ...cleanupOptions, departmentId: value });
                  debouncedLoadCleanupPreview();
                }}
                options={[
                  { value: '', label: 'Select a department to delete', disabled: true },
                  ...departments.map((dept) => ({
                    value: dept.id.toString(),
                    label: dept.name,
                    description: `${dept.studentCount || 0} students, ${dept.classCount || 0} classes`,
                    icon: AlertTriangle
                  }))
                ]}
                placeholder="Select a department to delete"
                searchable
                clearable
              />
            </motion.div>
          )}

          {cleanupOptions.cleanupType === 'data_only' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <ModernDropdown
                  label="Filter by Department (Optional)"
                  value={cleanupOptions.departmentId}
                  onChange={(value) => {
                    setCleanupOptions({ ...cleanupOptions, departmentId: value });
                    debouncedLoadCleanupPreview();
                  }}
                  options={[
                    { value: '', label: 'All departments', disabled: false },
                    ...departments.map((dept) => ({
                      value: dept.id.toString(),
                      label: dept.name,
                      description: `${dept.studentCount || 0} students, ${dept.classCount || 0} classes`,
                      icon: BookOpen
                    }))
                  ]}
                  placeholder="All departments"
                  searchable
                  clearable
                />
              </div>

              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="deleteImportantData"
                    checked={cleanupOptions.deleteImportantData}
                    onChange={(e) => {
                      setCleanupOptions({ ...cleanupOptions, deleteImportantData: e.target.checked });
                      debouncedLoadCleanupPreview();
                    }}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="deleteImportantData" className={`text-sm font-medium ${
                    isDark ? 'text-red-300' : 'text-red-800'
                  }`}>
                    ⚠️ Also delete important data (student names, emails, etc.)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Date From (Optional)
                  </label>
                  <input
                    type="date"
                    value={cleanupOptions.dateFrom}
                    onChange={(e) => {
                      setCleanupOptions({ ...cleanupOptions, dateFrom: e.target.value });
                      debouncedLoadCleanupPreview();
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Date To (Optional)
                  </label>
                  <input
                    type="date"
                    value={cleanupOptions.dateTo}
                    onChange={(e) => {
                      setCleanupOptions({ ...cleanupOptions, dateTo: e.target.value });
                      debouncedLoadCleanupPreview();
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {!cleanupOptions.dateFrom && !cleanupOptions.dateTo && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
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
                        debouncedLoadCleanupPreview();
                      }}
                      className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <span className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      Keep records from the last {retentionDays} days
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {cleanupPreview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border ${
                isDark 
                  ? 'bg-red-900/20 border-red-700/30' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h4 className={`font-medium mb-3 ${
                isDark ? 'text-red-300' : 'text-red-800'
              }`}>Cleanup Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                <PreviewItem label="Messages" value={cleanupPreview.preview.messagesToDelete || 0} />
                <PreviewItem label="Staff Messages" value={cleanupPreview.preview.staffMessagesToDelete || 0} />
                <PreviewItem label="Attendance" value={cleanupPreview.preview.attendanceToDelete || 0} />
                <PreviewItem label="Login logs" value={cleanupPreview.preview.loginLogsToDelete || 0} />
                {((cleanupPreview.preview.usersToDelete || 0) > 0 || (cleanupPreview.preview.studentsToDelete || 0) > 0) && (
                  <PreviewItem label="Students" value={cleanupPreview.preview.usersToDelete || cleanupPreview.preview.studentsToDelete || 0} />
                )}
                {(cleanupPreview.preview.classesToDelete || 0) > 0 && (
                  <PreviewItem label="Classes" value={cleanupPreview.preview.classesToDelete || 0} />
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-red-200/30">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>Total records to delete:</span>
                  <span className={`font-bold text-lg ${
                    isDark ? 'text-red-300' : 'text-red-700'
                  }`}>{cleanupPreview.preview.totalRecords}</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadCleanupPreview}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                isDark
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Preview</span>
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
              className={`px-6 py-3 bg-gradient-to-r text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg ${
                cleanupOptions.cleanupType === 'complete_department_deletion'
                  ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {settingsLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                  <span>{cleanupOptions.cleanupType === 'complete_department_deletion' ? 'Deleting Department...' : 'Cleaning...'}</span>
                </>
              ) : (
                <>
                  {cleanupOptions.cleanupType === 'complete_department_deletion' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                  <span>
                    {cleanupOptions.cleanupType === 'complete_department_deletion' 
                      ? 'Delete Department Permanently' 
                      : 'Clean Up Data'
                    }
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  function SecuritySection() {
    const [passwordForm, setPasswordForm] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false
    });

    const changePassword = async () => {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        addNotification('warning', 'Please fill in all password fields');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        addNotification('error', 'New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        addNotification('warning', 'New password must be at least 6 characters long');
        return;
      }

      try {
        setSettingsLoading(true);
        await api.post('/auth/change-password', {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });
        addNotification('success', 'Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (error: any) {
        addNotification('error', error.response?.data?.error || 'Failed to change password');
      } finally {
        setSettingsLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Password Change Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Shield className={`h-5 w-5 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Change Password</h2>
          </div>

          <div className="space-y-4 max-w-md">
            <PasswordField
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
              showPassword={showPasswords.current}
              onToggleShow={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              isDark={isDark}
            />

            <PasswordField
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
              showPassword={showPasswords.new}
              onToggleShow={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              isDark={isDark}
            />

            <PasswordField
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
              showPassword={showPasswords.confirm}
              onToggleShow={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              isDark={isDark}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={changePassword}
              disabled={settingsLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              {settingsLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                  </motion.div>
                  Changing Password...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Security Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Shield className={`h-5 w-5 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Security Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SecurityInfoCard
              icon={Shield}
              title="Account Security"
              description="Your account is secured with encrypted authentication"
              color="green"
              isDark={isDark}
            />
            <SecurityInfoCard
              icon={Database}
              title="Data Protection"
              description="All sensitive data is encrypted and regularly backed up"
              color="blue"
              isDark={isDark}
            />
            <SecurityInfoCard
              icon={User}
              title="Access Control"
              description="Role-based permissions ensure proper access levels"
              color="purple"
              isDark={isDark}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  function SystemInfoSection() {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Server className={`h-5 w-5 ${
              isDark ? 'text-orange-400' : 'text-orange-600'
            }`} />
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>System Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="System Version" value="1.0.0" />
            <InfoField label="Last Backup" value={backups[0]?.created || 'Never'} />
            <InfoField label="Database Type" value="PostgreSQL" />
            <InfoField label="Uptime" value="24/7" />
            <InfoField label="Environment" value={process.env.NODE_ENV || 'development'} />
            <InfoField label="API Status" value="Operational" badge badgeColor="green" />
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon={Cpu}
              label="CPU Usage"
              value="45%"
              color="blue"
            />
            <StatCard 
              icon={HardDrive}
              label="Memory"
              value="62%"
              color="green"
            />
            <StatCard 
              icon={Database}
              label="Database"
              value="28%"
              color="purple"
            />
            <StatCard 
              icon={BarChart3}
              label="Response Time"
              value="128ms"
              color="orange"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Helper Components
  function InfoField({ label, value, badge = false, badgeColor = 'blue' }: { 
    label: string; 
    value: string; 
    badge?: boolean;
    badgeColor?: string;
  }) {
    return (
      <div>
        <label className={`block text-sm font-medium mb-1 ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
        <div className={`p-3 rounded-lg ${
          isDark ? 'bg-slate-700' : 'bg-gray-50'
        }`}>
          {badge ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isDark 
                ? `bg-${badgeColor}-900/50 text-${badgeColor}-200` 
                : `bg-${badgeColor}-100 text-${badgeColor}-800`
            }`}>
              {value}
            </span>
          ) : (
            <span className={isDark ? 'text-white' : 'text-gray-900'}>
              {value}
            </span>
          )}
        </div>
      </div>
    );
  }

  function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
  }) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`p-4 rounded-lg border ${
          isDark 
            ? `bg-${color}-900/20 border-${color}-700/30` 
            : `bg-${color}-50 border-${color}-200`
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            isDark ? `bg-${color}-900/50` : `bg-${color}-100`
          }`}>
            <Icon className={`h-5 w-5 ${
              isDark ? `text-${color}-400` : `text-${color}-600`
            }`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{value}</p>
            <p className={`text-sm ${
              isDark ? `text-${color}-300` : `text-${color}-700`
            }`}>{label}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  function PreviewItem({ label, value }: { label: string; value: number }) {
    return (
      <div className="text-center">
        <div className={`text-2xl font-bold ${
          isDark ? 'text-red-300' : 'text-red-600'
        }`}>{value}</div>
        <div className={`text-xs ${
          isDark ? 'text-slate-400' : 'text-gray-600'
        }`}>{label}</div>
      </div>
    );
  }

  function PasswordField({ label, value, onChange, showPassword, onToggleShow, isDark }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    showPassword: boolean;
    onToggleShow: () => void;
    isDark: boolean;
  }) {
    return (
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 pr-12 ${
              isDark 
                ? 'bg-slate-700 border-slate-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <button
            type="button"
            onClick={onToggleShow}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
            }`}
          >
            {showPassword ? 
              <EyeOff className="h-4 w-4 text-gray-400" /> : 
              <Eye className="h-4 w-4 text-gray-400" />
            }
          </button>
        </div>
      </div>
    );
  }

  function SecurityInfoCard({ icon: Icon, title, description, color, isDark }: {
    icon: any;
    title: string;
    description: string;
    color: string;
    isDark: boolean;
  }) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-lg border ${
          isDark 
            ? `bg-${color}-900/20 border-${color}-700/30` 
            : `bg-${color}-50 border-${color}-200`
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`h-5 w-5 ${
            isDark ? `text-${color}-400` : `text-${color}-600`
          }`} />
          <div>
            <h3 className={`font-medium ${
              isDark ? `text-${color}-300` : `text-${color}-800`
            }`}>{title}</h3>
            <p className={`text-sm ${
              isDark ? `text-${color}-400` : `text-${color}-700`
            }`}>{description}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Helper functions
  async function loadAdminDetails() {
    try {
      const response = await api.get('/settings/admin-details');
      setAdminDetails(response.data.admin);
      setSystemStats(response.data.systemStats);
    } catch (error) {
      console.error('Failed to load admin details:', error);
      addNotification('error', 'Failed to load admin details');
    }
  }

  async function loadBackups() {
    try {
      const response = await api.get('/settings/backups');
      const backupList = response.data.backups || [];
      const transformedBackups = backupList.map((backup: any) => ({
        name: backup.filename,
        size: backup.size,
        created: new Date(backup.created).toLocaleString(),
        type: backup.type
      }));
      setBackups(transformedBackups);
    } catch (error) {
      console.error('Failed to load backups:', error);
      addNotification('error', 'Failed to load backups');
    }
  }

  async function loadDepartments() {
    try {
      const response = await api.get('/departments');
      // Add statistics to departments
      const departmentsWithStats = await Promise.all(
        response.data.map(async (dept: any) => {
          try {
            const [studentsRes, classesRes] = await Promise.all([
              api.get(`/users/students?departmentId=${dept.id}&pageSize=1000`),
              api.get(`/users/classes?departmentId=${dept.id}`)
            ]);
            return {
              ...dept,
              studentCount: studentsRes.data?.count || studentsRes.data?.rows?.length || 0,
              classCount: classesRes.data?.length || 0
            };
          } catch (error) {
            return {
              ...dept,
              studentCount: 0,
              classCount: 0
            };
          }
        })
      );
      setDepartments(departmentsWithStats);
    } catch (error) {
      console.error('Failed to load departments:', error);
      addNotification('error', 'Failed to load departments');
    }
  }

  async function loadCleanupPreview() {
    try {
      setPreviewLoading(true);
      const params = {
        retentionDays,
        ...cleanupOptions
      };
      const response = await api.get('/settings/cleanup/preview', { params });
      setCleanupPreview(response.data);
    } catch (error) {
      console.error('Failed to load cleanup preview:', error);
      addNotification('error', 'Failed to load cleanup preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  // Debounced version to prevent rapid API calls
  const debouncedLoadCleanupPreview = () => {
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }
    const timeout = setTimeout(() => {
      loadCleanupPreview();
    }, 500); // 500ms delay
    setPreviewTimeout(timeout);
  };

  async function createBackup() {
    try {
      setSettingsLoading(true);
      const response = await api.post('/settings/backup', backupOptions);
      addNotification('success', 'Backup created successfully');
      await loadBackups();
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      addNotification('error', error.response?.data?.error || 'Failed to create backup');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function downloadBackup(filename: string) {
    try {
      const response = await api.get(`/settings/backup/${filename}`, {
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
      console.error('Failed to download backup:', error);
      addNotification('error', error.response?.data?.error || 'Failed to download backup');
    }
  }
}
