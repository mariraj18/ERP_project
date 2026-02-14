import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const useRoleTheme = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const getRoleCardClass = () => {
    const role = user?.role || 'STUDENT';
    switch (role) {
      case 'SUPER_ADMIN':
        return 'card-super-admin';
      case 'STAFF':
        return 'card-staff';
      case 'STUDENT':
        return 'card-student';
      default:
        return 'card-student';
    }
  };

  const getRoleTabClass = () => {
    const role = user?.role || 'STUDENT';
    switch (role) {
      case 'SUPER_ADMIN':
        return 'tab-super-admin';
      case 'STAFF':
        return 'tab-staff';
      case 'STUDENT':
        return 'tab-student';
      default:
        return 'tab-student';
    }
  };

  const getRoleColors = () => {
    const role = user?.role || 'STUDENT';
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          primary: isDark ? '#a855f7' : '#7c3aed',
          secondary: isDark ? '#e9d5ff' : '#f3e8ff',
          accent: isDark ? '#581c87' : '#6b21a8',
          text: isDark ? '#f8fafc' : '#1e293b',
          border: isDark ? 'rgba(147, 51, 234, 0.3)' : '#e9d5ff'
        };
      case 'STAFF':
        return {
          primary: isDark ? '#10b981' : '#059669',
          secondary: isDark ? '#d1fae5' : '#ecfdf5',
          accent: isDark ? '#047857' : '#065f46',
          text: isDark ? '#f8fafc' : '#1e293b',
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#d1fae5'
        };
      case 'STUDENT':
        return {
          primary: isDark ? '#f59e0b' : '#d97706',
          secondary: isDark ? '#fef3c7' : '#fffbeb',
          accent: isDark ? '#d97706' : '#b45309',
          text: isDark ? '#f8fafc' : '#1e293b',
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fef3c7'
        };
      default:
        return {
          primary: isDark ? '#f59e0b' : '#d97706',
          secondary: isDark ? '#fef3c7' : '#fffbeb',
          accent: isDark ? '#d97706' : '#b45309',
          text: isDark ? '#f8fafc' : '#1e293b',
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fef3c7'
        };
    }
  };

  return {
    getRoleCardClass,
    getRoleTabClass,
    getRoleColors,
    isDark,
    role: user?.role || 'STUDENT'
  };
};
