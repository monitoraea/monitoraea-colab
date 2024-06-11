import { useState } from 'react';
import { /* InputBase, */ Menu, MenuItem } from '@mui/material';
import ChevronDown from '../../../components/icons/ChevronDown';
import { useUser, useRouter } from 'dorothy-dna-react';
import styles from './navbar.module.scss';

const OrganizationMenuItem = ({ handleSelect, currentOrganization, organization }) =>
  currentOrganization !== organization.name ? (
    <MenuItem onClick={() => handleSelect(organization.id)}>{organization.name}</MenuItem>
  ) : null;

export default function NavbarRoleSelector() {
  const { user } = useUser();
  const { currentCommunity, changeRoute } = useRouter();

  const [anchorEl, setAnchorEl] = useState(null);
  const closeMenu = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  /* const [searchField, _searchField] = useState(''); */

  const handleCommunityChange = community => {
    changeRoute({ community });

    closeMenu();
  };

  return (
    <div className={styles['nav-roleselector']}>
      {(!user.membership ||
        (user.membership.length <= 1 && currentCommunity && currentCommunity.id === user.membership[0].id)) && (
        <div className={styles['nav-roleselector-btn']}>{currentCommunity ? currentCommunity.title : ''}</div>
      )}

      {user.membership &&
        (user.membership.length > 1 || (currentCommunity && currentCommunity.id !== user.membership[0].id)) && (
          <div>
            <div
              className={styles['nav-roleselector-btn']}
              id="roleselector-btn"
              aria-controls="roleselector-menu"
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={event => setAnchorEl(event.currentTarget)}
            >
              {currentCommunity ? currentCommunity.title : ''}
              <ChevronDown />
            </div>

            <Menu
              id="roleselector-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={closeMenu}
              MenuListProps={{
                'aria-labelledby': 'roleselector-btn',
              }}
              className={styles['nav-roleselector-menu']}
            >
              <div className={styles['nav-roleselector-menutitle']}>Meus grupos</div>

              {user.membership &&
                user.membership.map(c => (
                  <OrganizationMenuItem
                    key={c.id}
                    handleSelect={handleCommunityChange}
                    currentOrganization={currentCommunity ? currentCommunity.title : ''}
                    organization={c}
                  />
                ))}
            </Menu>
          </div>
        )}
    </div>
  );
}
