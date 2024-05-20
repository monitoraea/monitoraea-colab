import { useState, createRef } from 'react';

import {
    IconButton,
    TextField,
} from '@mui/material';

import FileInput from '../icons/FileInput';

import './styles.scss';

export default function FileInputField({ label, error, onChange }) {
    const [value, _value] = useState('');

    const inputRef = createRef();

    const handleClick = () => {
        inputRef.current.click();
    }

    const handleFileSelected = (e) => {
        _value(e.target.files[0].name)
        onChange && onChange(e);
    }

    return (<>
        <TextField
            label={label}
            error={error}
            value={value}
            disabled
            fullWidth
            onClick={handleClick}
            InputProps={{
                endAdornment: (
                    <IconButton
                        className="file-input"
                        aria-label="file input"
                    >
                        <FileInput />
                    </IconButton>
                ),
            }}
        />
        <input
            ref={inputRef}
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
        />
    </>);
}