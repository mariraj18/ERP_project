import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoleTheme } from '../../hooks/useRoleTheme';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode | React.ComponentType<any>;
  disabled?: boolean;
}

interface ModernDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  maxHeight?: string;
  clearable?: boolean;
}

export const ModernDropdown: React.FC<ModernDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable = false,
  multiple = false,
  disabled = false,
  error,
  label,
  required = false,
  className = "",
  maxHeight = "max-h-60",
  clearable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple ? (Array.isArray(value) ? value : value ? [value] : []) : []
  );
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { getRoleCardClass, isDark, getRoleColors } = useRoleTheme();
  const roleColors = getRoleColors();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected option(s) for display
  const getSelectedDisplay = () => {
    if (multiple) {
      const selected = options.filter(opt => selectedValues.includes(opt.value));
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) return selected[0].label;
      return `${selected.length} items selected`;
    } else {
      const selected = options.find(opt => opt.value === value);
      return selected ? selected.label : placeholder;
    }
  };

  // Handle option selection
  const handleOptionSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newValues);
      onChange(newValues.join(','));
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      setSelectedValues([]);
      onChange('');
    } else {
      onChange('');
    }
  };

  // Dropdown variants for animation
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const optionVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.02,
        duration: 0.15,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Trigger */}
      <div
        className={`relative cursor-pointer transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={`
          flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-300
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
          
          <div className="flex items-center flex-1 min-w-0">
            {/* Selected values display */}
            <span className={`truncate ${
              (multiple ? selectedValues.length === 0 : !value) 
                ? isDark ? 'text-slate-400' : 'text-gray-500' 
                : ''
            }`}>
              {getSelectedDisplay()}
            </span>

            {/* Multiple selection badges */}
            {multiple && selectedValues.length > 0 && selectedValues.length <= 3 && (
              <div className="flex items-center space-x-1 ml-2">
                {selectedValues.slice(0, 3).map((val, index) => {
                  const option = options.find(opt => opt.value === val);
                  return (
                    <span
                      key={val}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${roleColors.primary}/20 text-${roleColors.primary}`}
                    >
                      {option?.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-2">
            {/* Clear button */}
            {clearable && ((multiple && selectedValues.length > 0) || (!multiple && value)) && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClear}
                className={`p-1 rounded-full transition-colors duration-200 ${
                  isDark 
                    ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' 
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}

            {/* Dropdown arrow */}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
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

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`
              absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl backdrop-blur-sm
              ${isDark 
                ? 'bg-slate-800/95 border-slate-600' 
                : 'bg-white/95 border-gray-200'
              }
            `}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-3 border-b border-gray-200 dark:border-slate-600">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDark ? 'text-slate-400' : 'text-gray-400'
                  }`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className={`
                      w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-slate-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-300'
                      }
                      focus:outline-none focus:ring-2 focus:ring-${roleColors.primary}/20
                    `}
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className={`${maxHeight} overflow-y-auto py-2`}>
              {filteredOptions.length === 0 ? (
                <div className={`px-4 py-8 text-center ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No options found</p>
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = multiple 
                    ? selectedValues.includes(option.value)
                    : value === option.value;

                  return (
                    <motion.div
                      key={option.value}
                      custom={index}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => !option.disabled && handleOptionSelect(option.value)}
                      className={`
                        flex items-center px-4 py-3 cursor-pointer transition-all duration-200
                        ${option.disabled 
                          ? isDark ? 'opacity-50 cursor-not-allowed text-slate-500' : 'opacity-50 cursor-not-allowed text-gray-400'
                          : isSelected
                            ? `bg-${roleColors.primary}/10 text-${roleColors.primary} border-r-4 border-${roleColors.primary}`
                            : isDark
                              ? 'text-slate-200 hover:bg-slate-700/50'
                              : 'text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      {/* Option icon */}
                      {option.icon && (
                        <div className="mr-3 flex-shrink-0">
                          {React.isValidElement(option.icon) 
                            ? option.icon 
                            : React.createElement(option.icon as React.ComponentType<any>, { 
                                className: 'h-4 w-4',
                                'aria-hidden': 'true' 
                              })
                          }
                        </div>
                      )}

                      {/* Option content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className={`text-sm truncate ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            {option.description}
                          </div>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`ml-2 flex-shrink-0 text-${roleColors.primary}`}
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};