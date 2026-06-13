import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoleTheme } from '../../hooks/useRoleTheme';

interface ModernCalendarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
  showTime?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  error,
  className = "",
  placeholder = "Select date...",
  showTime = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(
    value && showTime ? value.split('T')[1]?.substring(0, 5) || '09:00' : '09:00'
  );

  const calendarRef = useRef<HTMLDivElement>(null);
  const { isDark, getRoleColors } = useRoleTheme();
  const roleColors = getRoleColors();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    if (showTime) {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days (grayed out)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const today = new Date();
      const selectedDate = value ? new Date(value) : null;
      
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: currentDate.toDateString() === today.toDateString(),
        isSelected: selectedDate ? currentDate.toDateString() === selectedDate.toDateString() : false
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    let dateString = date.toISOString().split('T')[0];
    
    if (showTime) {
      dateString += `T${selectedTime}:00`;
    }
    
    onChange(dateString);
    
    if (!showTime) {
      setIsOpen(false);
    }
  };

  // Handle time change
  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    
    if (value) {
      const dateString = value.split('T')[0] + `T${time}:00`;
      onChange(dateString);
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Check if date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth();

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Label */}
      {label && (
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Trigger */}
      <div
        className={`relative cursor-pointer transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={`
          flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-300
          ${isOpen 
            ? `border-${roleColors.primary} shadow-lg ring-4 ring-${roleColors.primary}/20` 
            : error
              ? 'border-red-300 hover:border-red-400'
              : isDark
                ? 'border-slate-600 hover:border-slate-500'
                : 'border-gray-200 hover:border-gray-300'
          }
          ${isDark 
            ? 'bg-slate-800 text-white' 
            : 'bg-white text-gray-900'
          }
          ${isOpen ? 'shadow-2xl' : 'shadow-sm hover:shadow-md'}
        `}>
          
          <div className="flex items-center space-x-3">
            <Calendar className={`h-5 w-5 ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`} />
            <span className={`font-medium ${
              !value ? isDark ? 'text-slate-400' : 'text-gray-500' : isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatDisplayDate(value)}
            </span>
            {showTime && (
              <Clock className={`h-4 w-4 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`} />
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-1"
        >
          {error}
        </motion.p>
      )}

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              absolute top-full left-0 mt-2 z-50 p-4 rounded-xl border shadow-2xl backdrop-blur-sm
              ${isDark 
                ? 'bg-slate-800/95 border-slate-600' 
                : 'bg-white/95 border-gray-200'
              }
            `}
            style={{ minWidth: '320px' }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('prev')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDark 
                    ? 'hover:bg-slate-700 text-slate-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {currentMonth.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('next')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDark 
                    ? 'hover:bg-slate-700 text-slate-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className={`text-center text-xs font-medium py-2 ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isDisabled = isDateDisabled(day.date);
                
                return (
                  <motion.button
                    key={index}
                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    onClick={() => !isDisabled && handleDateSelect(day.date)}
                    disabled={isDisabled}
                    className={`
                      w-10 h-10 text-sm rounded-lg transition-all duration-200 relative
                      ${isDisabled
                        ? 'opacity-25 cursor-not-allowed'
                        : day.isSelected
                          ? `bg-${roleColors.primary} text-white shadow-lg`
                          : day.isToday
                            ? `bg-${roleColors.primary}/20 text-${roleColors.primary} font-semibold`
                            : day.isCurrentMonth
                              ? isDark
                                ? 'text-white hover:bg-slate-700'
                                : 'text-gray-900 hover:bg-gray-100'
                              : isDark
                                ? 'text-slate-500 hover:bg-slate-700/50'
                                : 'text-gray-400 hover:bg-gray-50'
                      }
                    `}
                  >
                    {day.date.getDate()}
                    
                    {/* Today indicator */}
                    {day.isToday && !day.isSelected && (
                      <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-${roleColors.primary}`} />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Time picker */}
            {showTime && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <div className="flex items-center space-x-3">
                  <Clock className={`h-4 w-4 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className={`
                      px-3 py-2 rounded-lg border transition-all duration-200 text-sm
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                      }
                      focus:outline-none focus:ring-2 focus:ring-${roleColors.primary}/20 focus:border-${roleColors.primary}
                    `}
                  />
                  <span className={`text-sm ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Time
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {showTime && (
              <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'text-slate-300 hover:bg-slate-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2 text-sm rounded-lg text-white bg-${roleColors.primary} hover:bg-${roleColors.primary}/90 transition-colors duration-200`}
                >
                  Done
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};