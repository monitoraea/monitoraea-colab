import { useState } from 'react';
import { Box, Button, Menu, MenuItem, unstable_useId } from '@mui/material';

const CardMenuItem = ({ handleSelect, currentMenuValue, value }) => (
  <MenuItem sx={{ fontWeight: value === currentMenuValue ? 'bold' : 'normal' }} onClick={handleSelect(value)}>
    {value}
  </MenuItem>
);

export default function FilterMenu({ onChange, initialValue, values = [initialValue], endIcon }) {
  const id = unstable_useId();
  const [value, setValue] = useState(initialValue);
  const [anchorEl, setAnchorEl] = useState(null);
  const closeMenu = () => setAnchorEl(null);
  const handleSelect = newRole => () => {
    setValue(newRole);
    closeMenu();
    onChange(newRole);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        fullWidth
        id={`${id}-button`}
        aria-controls={id}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
        color="secondary"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          textAlign: 'left',
          textTransform: 'none',
          padding: 1,
          '& svg': {
            width: '16px',
          },
        }}
      >
        <Box>{value === '' ? 'Território' : value}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>{endIcon}</Box>
      </Button>
      <Menu
        id={id}
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': `${id}-button`,
          sx: { paddingTop: 0, paddingBottom: 0 },
        }}
      >
        <MenuItem onClick={handleSelect('')}>Nenhum</MenuItem>
        {values.map(item => (
          <CardMenuItem key={item} handleSelect={handleSelect} currentMenuValue={value} value={item} />
        ))}
      </Menu>
    </>
  );
}
