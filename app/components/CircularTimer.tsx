import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CircularTimerProps {
  radius?: number;
  stroke?: number;
  progress: number;
  children?: React.ReactNode;
}

export default function CircularTimer({
  radius = 140,
  stroke = 8,
  progress,
  children,
}: CircularTimerProps) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const size = radius * 2 + 20;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          <Circle
            r={normalizedRadius}
            stroke="#f5f5f5"
            strokeOpacity={0.1}
            fill="transparent"
            strokeWidth={stroke}
          />
          <Circle
            r={normalizedRadius}
            stroke="#b1b7a2"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
