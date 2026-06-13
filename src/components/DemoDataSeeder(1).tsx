import React, { useState } from 'react';
import { seedDemoData } from '../utils/seedDemoData';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface DemoDataSeederProps {
  onSuccess?: () => void;
}

export const DemoDataSeeder: React.FC<DemoDataSeederProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await seedDemoData();
      setResult(response);
      
      if (response.success && onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <Database className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Demo Data Setup
        </h3>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Initialize the system with demo departments, classes, and assign existing users to departments.
      </p>
      
      <button
        onClick={handleSeedData}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Seeding Data...
          </>
        ) : (
          <>
            <Database className="h-4 w-4 mr-2" />
            Seed Demo Data
          </>
        )}
      </button>
      
      {result && (
        <div className={`mt-4 p-4 rounded-lg flex items-start ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={`font-medium ${
              result.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {result.message}
            </p>
            {result.success && result.data && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>• {result.data.departments} departments created</p>
                <p>• {result.data.classes} classes created</p>
                <p>• {result.data.studentsUpdated} students updated</p>
                <p>• {result.data.staffUpdated} staff updated</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
