import * as React from "react";
import PropTypes from "prop-types";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

export default function DatePicker({ label, value, onChange, error, views=['year', 'month', 'day'], inputFormat="DD/MM/YYYY" }, ...rest) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker       
        label={label}
        inputFormat={inputFormat}
        value={value}
        onChange={onChange}
        renderInput={(params) => <TextField {...params} error={error} className="input-datepicker" />}
        views={views}
        {...rest}
      />
    </LocalizationProvider>
  );
}

DatePicker.propTypes = {
  /**
   * Button contents
   */
  inputFormat: PropTypes.string.isRequired
};

DatePicker.defaultProps = {
  inputFormat: "DD/MM/YYYY",
};