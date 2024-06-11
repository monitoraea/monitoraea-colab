import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { ptBR } from 'date-fns/locale';

export default function DatePicker({
  label,
  value,
  onChange,
  error,
  views = ['year', 'month', 'day'],
  inputFormat = 'dd/MM/yyyy',
  disabled,
  ...rest
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
      <DesktopDatePicker
        label={label}
        inputFormat={inputFormat}
        value={value}
        onChange={onChange}
        renderInput={params => <TextField {...params} error={error} className="input-datepicker" />}
        views={views}
        disabled={disabled}
        InputProps={{
          readOnly: disabled,
        }}
        {...rest}
      />
    </LocalizationProvider>
  );
}