export interface Department {
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

export interface DepartmentStats {
  studentCount: number;
  staffCount: number;
  classCount: number;
  activeStudents: number;
  inactiveStudents: number;
}

export interface DepartmentFilters {
  departmentId?: number | 'ALL';
  classId?: number | 'ALL';
}

export interface DepartmentWithClasses extends Department {
  classes: {
    id: number;
    name: string;
    staffId?: number;
    staff?: {
      id: number;
      name: string;
      email: string;
    };
    studentCount: number;
  }[];
}

