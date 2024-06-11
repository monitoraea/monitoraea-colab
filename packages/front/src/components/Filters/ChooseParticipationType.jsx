import React from "react";

import {
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';

export default function ChooseParticipationType({ value, onChange }) {

    const handleChange = (value) => {
        onChange(value);
    };

    return (<FormControl fullWidth>
        <Select
          className="input-select"
          value={value || 'none'}
          onChange={(e) => handleChange(e.target.value)}
        >
          <MenuItem value="none"> -- selecione -- </MenuItem>
          <MenuItem value="adm">Responsável</MenuItem>
          <MenuItem value="member">Membro</MenuItem>        
        </Select>
      </FormControl>);
};