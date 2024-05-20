import { useState, useEffect } from 'react';
import { Menu, MenuItem, unstable_useId } from '@mui/material';
import Bell from '../icons/Bell';

import { useUser, useRouter } from 'dorothy-dna-react';

export function Notifications() {
  const { alertCounter, retrieveAlerts, alerts } = useUser();
  const { onAlertClick } = useRouter();

  const menuId = unstable_useId();
  const [anchorEl, setAnchorEl] = useState(null);
  const closeMenu = () => setAnchorEl(null);
  const open = Boolean(anchorEl);
  const menuButtonId = `${menuId}-button`;

  useEffect(() => {
    if (!open) return;
    
    retrieveAlerts();

    // TODO: study line below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open ])

  /* useEffect(()=>{
    console.log(alertCounter);
  }, [alertCounter]) */

  const handleAlertClick = (data) => {
    onAlertClick(data);
    setAnchorEl(null)
  }

  return (
    <div className='nav-notifications'>

      <div
        className={`nav-notifications-btn ${alertCounter && alertCounter > 0 ? 'active' : ''}`}
        id={menuButtonId}
        aria-controls={menuId}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
      >
        <div className='nav-notifications-badge'>{alertCounter}</div>
        <Bell/>
      </div>
      <Menu
        className='nav-notifications-menu'
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': menuButtonId,
        }}
      >
        <div className='nav-notifications-menutitle'>
          <Bell/>
          Meus alertas
        </div>

        {!alerts && <MenuItem>
          Carregando...
        </MenuItem>}

        {alerts && !alerts.length && <MenuItem className='empty'>
          Nenhum alerta
        </MenuItem>}

        {alerts && alerts.map(a => (
          <MenuItem key={a.id} /* onClick={handleSelect} */>
            <span onClick={() => handleAlertClick(a.data)}>{a.data.text}</span>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

/* const StyledPhoto = styled(Box)(({ theme }) => ({
  width: '40px',
  borderRadius: '50%',
  marginRight: 2,
  color: 'primary',
})); */

