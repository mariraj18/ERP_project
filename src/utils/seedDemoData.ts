import { api } from './api';

export const seedDemoData = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  // Since we've consolidated all seeding into the main seed script,
  // this function now provides instructions for manual seeding
  return {
    success: false,
    message: 'Demo data seeding has been consolidated. Please run "npm run seed" in the server directory to seed the complete database with users, departments, classes, and sample data.'
  };
};

export const getAvailableStaff = async (): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> => {
  try {
    const response = await api.get('/departments/available-staff');
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Failed to fetch available staff:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to fetch staff'
    };
  }
};

export const assignStaffToDepartment = async (departmentId: number, staffIds: number[]): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await api.post(`/departments/${departmentId}/assign-staff`, {
      staffIds
    });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error: any) {
    console.error('Failed to assign staff:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to assign staff'
    };
  }
};

export const assignStudentsToClass = async (departmentId: number, classId: number, studentIds: number[]): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await api.post(`/departments/${departmentId}/classes/${classId}/assign-students`, {
      studentIds
    });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error: any) {
    console.error('Failed to assign students:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to assign students'
    };
  }
};
