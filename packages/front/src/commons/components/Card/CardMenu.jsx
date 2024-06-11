import { useState } from 'react';
import { Box, Button, Menu, MenuItem, unstable_useId } from '@mui/material';

const CardMenuItem = ({ handleSelect, currentMenuValue, value }) => (
  <MenuItem sx={{ fontWeight: value === currentMenuValue ? 'bold' : 'normal' }} onClick={handleSelect(value)}>
    {value}
  </MenuItem>
);

export function CardMenu({ onChange, initialValue, values = [initialValue], startIcon }) {
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
        id={`${id}-button`}
        aria-controls={id}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
        color="secondary"
        sx={{
          textTransform: 'none',
          '& svg': {
            width: '16px',
          },
        }}
      >
        <Box sx={{ display: 'grid', gap: 0.5, gridAutoFlow: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>{startIcon}</Box>
          <Box>{value}</Box>
        </Box>
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
        {values.map(item => (
          <CardMenuItem key={item} handleSelect={handleSelect} currentMenuValue={value} value={item} />
        ))}
      </Menu>
    </>
  );
}
