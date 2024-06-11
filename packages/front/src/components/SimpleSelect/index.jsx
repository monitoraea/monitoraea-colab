import React from 'react';

import {
    Select,
    MenuItem,
    InputLabel,
    FormControl,
} from '@mui/material';

export default function SimpleSelect({ label, options, value, onChange, style, error }) {
    return (
        <FormControl style={style}>
            {label && <InputLabel id="demo-simple-select-label">{label}</InputLabel>}
            <Select
                labelId="demo-simple-select-label"
                label={label}
                value={value}
                onChange={onChange}
                error={error}
            >
                {options.map(o => <MenuItem key={o.value} value={o.value}>{o.title}</MenuItem>)}
            </Select>
        </FormControl>
    )
}