import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// 1. Accept 'disabled' from props here
export default function FirstComponent({ value, onChange, disabled }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Select Date"
        value={value}
        onChange={onChange}
        disabled={disabled} 
        slotProps={{ textField: { size: 'large' } }}
      />
    </LocalizationProvider>
  );
}