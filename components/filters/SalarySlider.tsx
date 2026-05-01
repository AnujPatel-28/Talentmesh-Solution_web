'use client';

import React from 'react';
import { Slider, Typography, Box } from '@mui/material';

interface SalarySliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const SalarySlider: React.FC<SalarySliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 300000,
  step = 5000,
}) => {
  const handleChange = (event: Event, newValue: number | number[]) => {
    onChange(newValue as [number, number]);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  return (
    <Box sx={{ px: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          ${formatLargeNumber(value[0])}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          ${formatLargeNumber(value[1])}{value[1] === max ? '+' : ''}
        </Typography>
      </Box>
      <Slider
        value={value}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={min}
        max={max}
        step={step}
        valueLabelFormat={(v) => `$${formatLargeNumber(v)}`}
        sx={{
          color: '#2563eb', // blue-600
          height: 6,
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            backgroundColor: '#fff',
            border: '2px solid currentColor',
            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
              boxShadow: 'inherit',
            },
            '&:before': {
              display: 'none',
            },
          },
          '& .MuiSlider-track': {
            border: 'none',
          },
          '& .MuiSlider-rail': {
            opacity: 0.1,
            backgroundColor: '#bfdbfe', // blue-200
          },
        }}
      />
    </Box>
  );
};
