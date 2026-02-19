import React from 'react';
import { TimerMode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CircularTimerProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 100
  mode: TimerMode;
  children?: React.ReactNode;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  radius = 160, 
  stroke = 8, 
  progress, 
  mode,
  children 
}) => {
  const { t } = useLanguage();
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Radius for the text path (slightly larger than the timer circle)
  // Adjusted from +20 to +24 for better visual breathing room with larger circles
  const textRadius = normalizedRadius + 24;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2 + 60} // Add extra space for the text outside
        width={radius * 2 + 60}
        viewBox={`0 0 ${radius * 2 + 60} ${radius * 2 + 60}`}
        className="transition-all duration-500 overflow-visible"
      >
        <g transform={`translate(30, 30)`}> {/* Offset for the larger viewBox */}
            {/* Rotate the timer circles to start at top (-90deg) */}
            <g transform={`rotate(-90 ${radius} ${radius})`}>
                {/* Track */}
                <circle
                stroke="#f5f5f5"
                strokeOpacity="0.1"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                />
                {/* Indicator */}
                <circle
                stroke={mode === TimerMode.FOCUS ? "#b1b7a2" : "#b1b7a2"} 
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-1000 ease-linear"
                />
            </g>

            {/* Curved Text for Break Mode - Bottom outside */}
            {mode === TimerMode.PAUSE && (
                <g>
                    {/* Path definition: Arc from ~8 o'clock to ~4 o'clock for the bottom curve */}
                    <path 
                        id="bottomCurve" 
                        d={`M ${radius - textRadius * 0.7} ${radius + textRadius * 0.7} A ${textRadius} ${textRadius} 0 0 0 ${radius + textRadius * 0.7} ${radius + textRadius * 0.7}`}
                        fill="transparent"
                        stroke="none"
                    />
                    <text fill="#b1b7a2" fontSize="10" fontWeight="normal" letterSpacing="1.5px" className="uppercase">
                        <textPath xlinkHref="#bottomCurve" startOffset="50%" textAnchor="middle">
                        {t('press_know_more')}
                        </textPath>
                    </text>
                </g>
            )}
        </g>
      </svg>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
        {children}
      </div>
    </div>
  );
};

export default CircularTimer;