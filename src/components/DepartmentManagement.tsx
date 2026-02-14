import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  BookOpen,
  Trash2,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  X
} from 'lucide-react';
import api from '../utils/api';

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

interface Class {
  id: number;
  name: string;
  staffId?: number | null;
  staff?: { id: number; name: string; email: string } | null;
  department?: { id: number; name: string } | null;
  studentCount: number;
}

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  managedClass?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
}

interface DepartmentManagementProps {
  isDark: boolean;
  theme: any;
  getRoleCardClass: () => string;
}

export default function DepartmentManagement({ isDark, theme, getRoleCardClass }: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headId: ''
  });
  const [classFormData, setClassFormData] = useState({
    name: '',
    staffId: '',
    departmentId: ''
  });
  
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    parentEmail: '',
    classId: '',
    departmentId: ''
  });
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    departmentId: '',
    classId: ''
  });

  const loadData = async () => {
    try {
      const [departmentsRes, classesRes, staffRes, studentsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/users/classes'),
        api.get('/users/staff'),
        api.get('/users/students', { params: { page: 1, pageSize: 1000 } })
      ]);
      
      setDepartments(departmentsRes.data.departments || departmentsRes.data);
      setClasses(classesRes.data);
      setStaff(staffRes.data);
      setStudents(studentsRes.data.rows || studentsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartment) {
      await handleUpdateDepartment(e);
      return;
    }
    
    try {
      const response = await api.post('/departments', {
        name: formData.name,
        description: formData.description,
        headId: formData.headId || null
      });
      
      setDepartments([...departments, response.data]);
      setFormData({ name: '', description: '', headId: '' });
      setShowDepartmentForm(false);
    } catch (error) {
      console.error('Failed to create department:', error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      await handleUpdateClass(e);
      return;
    }
    
    if (!selectedDepartment) return;
    
    try {
      const response = await api.post('/users/classes', {
        name: classFormData.name,
        staffId: classFormData.staffId || null,
        departmentId: selectedDepartment.id
      });
      
      setClasses([...classes, response.data]);
      setClassFormData({ name: '', staffId: '', departmentId: selectedDepartment.id.toString() });
      setShowClassForm(false);
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/departments/${id}`);
      setDepartments(departments.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/users/classes/${id}`);
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const toggleDepartmentExpansion = (departmentId: number) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  // Edit Department Handler
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      headId: department.headId?.toString() || ''
    });
    setShowDepartmentForm(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    
    try {
      const response = await api.put(`/departments/${editingDepartment.id}`, {
        name: formData.name,
        description: formData.description,
        headId: formData.headId || null
      });
      
      setDepartments(departments.map(d => d.id === editingDepartment.id ? response.data : d));
      setFormData({ name: '', description: '', headId: '' });
      setShowDepartmentForm(false);
      setEditingDepartment(null);
    } catch (error) {
      console.error('Failed to update department:', error);
    }
  };

  // Edit Class Handler
  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setClassFormData({
      name: classItem.name,
      staffId: classItem.staffId?.toString() || '',
      departmentId: classItem.department?.id?.toString() || ''
    });
    setShowClassForm(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    
    try {
      const response = await api.put(`/users/classes/${editingClass.id}`, {
        name: classFormData.name,
        staffId: classFormData.staffId || null,
        departmentId: classFormData.departmentId
      });
      
      setClasses(classes.map(c => c.id === editingClass.id ? response.data : c));
      setClassFormData({ name: '', staffId: '', departmentId: '' });
      setShowClassForm(false);
      setEditingClass(null);
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  };

  // Student Management Handlers
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/students', {
        name: studentFormData.name,
        email: studentFormData.email,
        rollNumber: studentFormData.rollNumber,
        parentEmail: studentFormData.parentEmail,
        classId: studentFormData.classId,
        departmentId: studentFormData.departmentId,
        role: 'STUDENT'
      });
      
      setStudents([...students, response.data]);
      setStudentFormData({ name: '', email: '', rollNumber: '', parentEmail: '', classId: '', departmentId: '' });
      setShowStudentForm(false);
    } catch (error) {
      console.error('Failed to create student:', error);
    }
  };

  // Staff Management Handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/staff', {
        name: staffFormData.name,
        email: staffFormData.email,
        departmentId: staffFormData.departmentId,
        classId: staffFormData.classId,
        role: 'STAFF'
      });
      
      setStaff([...staff, response.data]);
      setStaffFormData({ name: '', email: '', departmentId: '', classId: '' });
      setShowStaffForm(false);
    } catch (error) {
      console.error('Failed to create staff:', error);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentClasses = (departmentId: number) => {
    return classes.filter(c => c.department?.id === departmentId);
  };

  const getDepartmentStaff = (departmentId: number) => {
    return staff.filter(s => s.department?.id === departmentId);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              isDark 
                ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDepartmentForm(true)}
          className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors font-medium ${theme.buttonBg} shadow-md`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </motion.button>
      </div>

      {/* Departments List */}
      <div className="space-y-4">
        {filteredDepartments.map((department) => (
          <motion.div
            key={department.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${getRoleCardClass()} rounded-lg border overflow-hidden`}
          >
            <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleDepartmentExpansion(department.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                  >
                    {expandedDepartments.has(department.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-adaptive">{department.name}</h3>
                    {department.head && (
                      <p className="text-sm text-adaptive-secondary">
                        Head: {department.head.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-4 text-sm text-adaptive-secondary">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {department.studentCount || 0} students
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {department.classCount || 0} classes
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditDepartment(department)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Edit Department"
                    >
                      <User className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedDepartment(department);
                        setShowClassForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Add Class"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteDepartment(department.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
              {department.description && (
                <p className="mt-2 text-sm text-adaptive-secondary">{department.description}</p>
              )}
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedDepartments.has(department.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    {/* Classes in this department */}
                    <div>
                      <h4 className="font-medium text-adaptive mb-3">Classes ({getDepartmentClasses(department.id).length})</h4>
                      <div className="grid gap-3">
                        {getDepartmentClasses(department.id).map((cls) => (
                          <div
                            key={cls.id}
                            className={`p-3 rounded-lg border ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-700' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-adaptive">{cls.name}</h5>
                                {cls.staff && (
                                  <p className="text-sm text-adaptive-secondary">
                                    Teacher: {cls.staff.name}
                                  </p>
                                )}
                                <p className="text-sm text-adaptive-secondary">
                                  {cls.studentCount} students
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditClass(cls)}
                                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                  title="Edit Class"
                                >
                                  <User className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteClass(cls.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Delete Class"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {getDepartmentClasses(department.id).length === 0 && (
                          <p className="text-sm text-adaptive-secondary italic">No classes in this department</p>
                        )}
                      </div>
                    </div>

                    {/* Staff in this department */}
                    <div>
                      <h4 className="font-medium text-adaptive mb-3">Staff ({getDepartmentStaff(department.id).length})</h4>
                      <div className="grid gap-3">
                        {getDepartmentStaff(department.id).map((staffMember) => (
                          <div
                            key={staffMember.id}
                            className={`p-3 rounded-lg border ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-700' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <h5 className="font-medium text-adaptive">{staffMember.name}</h5>
                                <p className="text-sm text-adaptive-secondary">{staffMember.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {getDepartmentStaff(department.id).length === 0 && (
                          <p className="text-sm text-adaptive-secondary italic">No staff in this department</p>
                        )}
                      </div>
                      
                      {/* Add Student and Staff Buttons */}
                      <div className="flex gap-2 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setStudentFormData({ ...studentFormData, departmentId: department.id.toString() });
                            setShowStudentForm(true);
                          }}
                          className="flex items-center px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Student
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setStaffFormData({ ...staffFormData, departmentId: department.id.toString() });
                            setShowStaffForm(true);
                          }}
                          className="flex items-center px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Staff
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Create Department Modal */}
      <AnimatePresence>
        {showDepartmentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${getRoleCardClass()} rounded-lg p-6 w-full max-w-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-adaptive">
                  {editingDepartment ? 'Edit Department' : 'Create Department'}
                </h3>
                <button
                  onClick={() => {
                    setShowDepartmentForm(false);
                    setEditingDepartment(null);
                    setFormData({ name: '', description: '', headId: '' });
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter department description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Department Head
                  </label>
                  <select
                    value={formData.headId}
                    onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select department head (optional)</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepartmentForm(false);
                      setEditingDepartment(null);
                      setFormData({ name: '', description: '', headId: '' });
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${theme.buttonBg}`}
                  >
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Class Modal */}
      <AnimatePresence>
        {showClassForm && selectedDepartment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${getRoleCardClass()} rounded-lg p-6 w-full max-w-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-adaptive">
                  Create Class in {selectedDepartment.name}
                </h3>
                <button
                  onClick={() => setShowClassForm(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={classFormData.name}
                    onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter class name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Class Teacher
                  </label>
                  <select
                    value={classFormData.staffId}
                    onChange={(e) => setClassFormData({ ...classFormData, staffId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select teacher (optional)</option>
                    {staff.filter(s => s.department?.id === selectedDepartment.id).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowClassForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${theme.buttonBg}`}
                  >
                    Create Class
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Student Modal */}
      <AnimatePresence>
        {showStudentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${getRoleCardClass()} rounded-lg p-6 w-full max-w-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-adaptive">Add Student</h3>
                <button
                  onClick={() => setShowStudentForm(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentFormData.name}
                    onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentFormData.rollNumber}
                    onChange={(e) => setStudentFormData({ ...studentFormData, rollNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter roll number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={studentFormData.parentEmail}
                    onChange={(e) => setStudentFormData({ ...studentFormData, parentEmail: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter parent email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Class *
                  </label>
                  <select
                    required
                    value={studentFormData.classId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, classId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select class</option>
                    {classes.filter(c => c.department?.id === parseInt(studentFormData.departmentId)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowStudentForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${theme.buttonBg}`}
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Staff Modal */}
      <AnimatePresence>
        {showStaffForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${getRoleCardClass()} rounded-lg p-6 w-full max-w-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-adaptive">Add Staff</h3>
                <button
                  onClick={() => setShowStaffForm(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffFormData.name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter staff name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adaptive mb-1">
                    Assigned Class
                  </label>
                  <select
                    value={staffFormData.classId}
                    onChange={(e) => setStaffFormData({ ...staffFormData, classId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select class (optional)</option>
                    {classes.filter(c => c.department?.id === parseInt(staffFormData.departmentId)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowStaffForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${theme.buttonBg}`}
                  >
                    Add Staff
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
