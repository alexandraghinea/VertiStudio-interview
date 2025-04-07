import React, { createContext, useContext, useState, useCallback } from 'react';

interface NotificationContextType {
  showLoading: (message: string) => void;
  hideLoading: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationState {
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  success: string | null;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    isLoading: false,
    loadingMessage: '',
    error: null,
    success: null,
  });

  const showLoading = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingMessage: message,
      error: null,
      success: null,
    }));
  }, []);

  const hideLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      loadingMessage: '',
    }));
  }, []);

  const showError = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: message,
      success: null,
    }));

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        error: null,
      }));
    }, 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
      success: message,
    }));

    // Auto-hide success after 3 seconds
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        success: null,
      }));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showLoading, hideLoading, showError, showSuccess }}>
      {children}
      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-700">{state.loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 animate-fade-in">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{state.error}</span>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {state.success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 animate-fade-in">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{state.success}</span>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}; 