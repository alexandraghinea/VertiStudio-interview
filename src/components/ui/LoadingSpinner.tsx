import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin`}
    />
  );
};

export default LoadingSpinner; 