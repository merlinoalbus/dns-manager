import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export const Alert = ({ 
  type = 'info', 
  title, 
  children,
  className = '' 
}) => {
  const styles = {
    info: {
      wrapper: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />
    },
    success: {
      wrapper: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    error: {
      wrapper: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />
    }
  };

  const style = styles[type];

  return (
    <div className={`p-4 border rounded-md ${style.wrapper} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className="ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${style.text}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${style.text}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};