import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FeatureImportance as FeatureImportanceType } from '../../types';
import { formatPercentage } from '../../utils/formatters';

interface FeatureImportanceChartProps {
  features: FeatureImportanceType[];
  title?: string;
  height?: number;
  maxFeatures?: number;
}

const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  features,
  title = "Feature Importance",
  height = 400,
  maxFeatures = 10
}) => {
  const topFeatures = features.slice(0, maxFeatures);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={topFeatures}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 1]} tickFormatter={formatPercentage} />
          <YAxis dataKey="display_name" type="category" width={120} />
          <Tooltip 
            formatter={(value) => [formatPercentage(value as number), 'Importance']}
            labelStyle={{ color: '#374151' }}
          />
          <Bar 
            dataKey="importance" 
            fill="#3B82F6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeatureImportanceChart;
