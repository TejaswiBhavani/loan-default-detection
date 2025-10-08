import React from 'react';
import { formatPercentage } from '../../utils/formatters';

interface RiskGaugeProps {
  riskScore: number; // 0-1
  confidence?: number; // 0-1
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({
  riskScore,
  confidence = 0,
  size = 'md',
  showDetails = true
}) => {
  const sizeConfig = {
    sm: { radius: 40, strokeWidth: 8, fontSize: 'text-sm' },
    md: { radius: 60, strokeWidth: 12, fontSize: 'text-lg' },
    lg: { radius: 80, strokeWidth: 16, fontSize: 'text-2xl' }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - riskScore);

  // Determine risk level and color
  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { level: 'Low', color: '#10B981', bgColor: '#ECFDF5' };
    if (score <= 0.7) return { level: 'Medium', color: '#F59E0B', bgColor: '#FFFBEB' };
    return { level: 'High', color: '#EF4444', bgColor: '#FEF2F2' };
  };

  const risk = getRiskLevel(riskScore);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Gauge */}
      <div className="relative">
        <svg
          width={config.radius * 2 + config.strokeWidth}
          height={config.radius * 2 + config.strokeWidth}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.radius + config.strokeWidth / 2}
            cy={config.radius + config.strokeWidth / 2}
            r={config.radius}
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            cx={config.radius + config.strokeWidth / 2}
            cy={config.radius + config.strokeWidth / 2}
            r={config.radius}
            stroke={risk.color}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${config.fontSize}`} style={{ color: risk.color }}>
            {formatPercentage(riskScore)}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {risk.level} Risk
          </div>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center space-y-2">
          <div 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: risk.bgColor,
              color: risk.color
            }}
          >
            {risk.level} Risk Level
          </div>
          
          {confidence > 0 && (
            <div className="text-sm text-gray-600">
              Confidence: {formatPercentage(confidence)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskGauge;
