import React, { useState, useEffect } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from "@mui/material/Chip";

export default function TagTextField({ label = 'Label', value, onChange, disabled, error, placeholder }) {
    const [localValue, _localValue] = useState([]);

    useEffect(() => {
        if (value) _localValue(Array.isArray(value) ? value : []);
    }, [value])

    const handleChange = (_, value) => {

        _localValue(value);

        onChange(value ? value : []);
    };

    return (<>
        <Autocomplete
            className="input-autocomplete"
            multiple
            id="tags-filled"
            disabled={disabled}
            options={[]}
            freeSolo
            clearOnBlur
            value={localValue}
            onChange={handleChange}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    placeholder={placeholder}
                />
            )}
        />
    </>);
}