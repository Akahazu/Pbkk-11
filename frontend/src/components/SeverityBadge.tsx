import React from 'react';

interface SeverityBadgeProps {
  level: 'Critical' | 'High' | 'Medium' | 'Low' | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ level }) => {
  const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();

  let bgClass = 'bg-blue-950 text-blue-400 border-blue-800';
  if (normalized === 'Critical') {
    bgClass = 'bg-red-950 text-red-400 border-red-800 animate-pulse';
  } else if (normalized === 'High') {
    bgClass = 'bg-orange-950 text-orange-400 border-orange-800';
  } else if (normalized === 'Medium') {
    bgClass = 'bg-yellow-950 text-yellow-400 border-yellow-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${bgClass} uppercase tracking-wider my-1`}>
      {normalized}
    </span>
  );
};

export function detectSeverities(text: string): string[] {
  const matches = text.match(/\b(critical|high|medium|low)\b/gi);
  if (!matches) return [];
  const unique = Array.from(new Set(matches.map(m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())));
  return unique.filter(s => ['Critical', 'High', 'Medium', 'Low'].includes(s));
}
