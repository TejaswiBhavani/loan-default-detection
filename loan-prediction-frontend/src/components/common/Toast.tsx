import React, { useEffect, useState } from 'react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface ToastProps {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose: () => void;
  autoDismiss?: boolean;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  show,
  type,
  title,
  message,
  onClose,
  autoDismiss = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      if (autoDismiss) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoDismiss, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  if (!show) return null;

  const typeStyles = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      icon: CheckCircleIcon
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      icon: ExclamationCircleIcon
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      icon: ExclamationTriangleIcon
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400',
      icon: InformationCircleIcon
    }
  };

  const style = typeStyles[type];
  const IconComponent = style.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-full max-w-md transform transition-all duration-300 ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${style.bgColor} ${style.borderColor}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${style.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-medium ${style.textColor}`}>
                {title}
              </h3>
            )}
            <p className={`text-sm ${title ? 'mt-1' : ''} ${style.textColor}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md ${style.bgColor} ${style.textColor} hover:${style.textColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
