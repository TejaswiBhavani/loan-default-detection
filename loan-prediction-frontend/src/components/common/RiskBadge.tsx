import React from 'react';

interface RiskBadgeProps {
  risk: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RiskBadge: React.FC<RiskBadgeProps> = React.memo(({ 
  risk, 
  size = 'md', 
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  const colorClasses = {
    low: 'bg-green-100 text-green-800 border border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    high: 'bg-red-100 text-red-800 border border-red-200'
  };

  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk'
  };

  return (
    <span 
      className={`${baseClasses} ${sizeClasses[size]} ${colorClasses[risk]} ${className}`}
    >
      {labels[risk]}
    </span>
  );
});

RiskBadge.displayName = 'RiskBadge';

export default RiskBadge;
