import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { AnalysisResult } from '../types';

interface AnalysisChartProps {
  data: AnalysisResult;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-4 rounded shadow-xl text-xs sm:text-sm max-w-[200px]">
        <p className="font-bold text-catalyst-300 mb-1">{data.metric}</p>
        <p className="text-white mb-2">Score: <span className="font-mono text-accent-500">{data.score}</span></p>
        <p className="text-slate-400 italic leading-tight">{data.reasoning}</p>
      </div>
    );
  }
  return null;
};

export const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[300px] sm:h-[400px] flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.metrics}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name={data.ideaName}
            dataKey="score"
            stroke="#0ea5e9"
            strokeWidth={3}
            fill="#0ea5e9"
            fillOpacity={0.4}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
