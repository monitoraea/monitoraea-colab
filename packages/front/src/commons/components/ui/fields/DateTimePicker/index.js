import * as React from "react";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export default function DatePicker({ label, value, onChange, error, inputFormat="DD/MM/YYYY HH:mm", ...rest}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label={label}
        inputFormat={inputFormat}
        value={value}
        onChange={(value) => onChange(value?.valueOf())}
        renderInput={(params) => <TextField {...params} />}
        ampm={false}
        {...rest}
      />
    </LocalizationProvider>
  );
}
