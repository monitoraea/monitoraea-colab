import { /* useEffect,  */useState } from 'react';
import { /* InputBase, */ Menu, MenuItem } from '@mui/material';
import { useUser, useRouter } from 'dorothy-dna-react';

import PerspectiveRenderer from './PerspectiveRenderer';

const OrganizationMenuItem = ({ handleSelect, currentOrganization, organization }) =>
  currentOrganization !== organization.name ? <MenuItem onClick={() => handleSelect(organization.id)}>{organization.name}</MenuItem> : null;

export default function NavbarRoleSelector({ perspectives }) {

  const { user } = useUser();
  const { currentCommunity, changeRoute } = useRouter();

  const [anchorEl, setAnchorEl] = useState(null);
  const closeMenu = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  /* const [searchField, _searchField] = useState(''); */

  const handleCommunityChange = (community) => {
    changeRoute({ community });

    closeMenu();
  }

  /* useEffect(()=>{
    if(!!currentCommunity) console.log({ currentCommunity })
  },[currentCommunity]) */


  return (
    <div className="nav-roleselector">
      <div>
        <div
          className='nav-roleselector-btn'
          id="roleselector-btn"
          aria-controls="roleselector-menu"
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
         /*  onClick={event => setAnchorEl(event.currentTarget)} */
        >
          <PerspectiveRenderer perspectives={perspectives} community={currentCommunity} />
          {currentCommunity ? currentCommunity.title : ''}
        </div>


        <Menu
          id="roleselector-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={closeMenu}
          MenuListProps={{
            'aria-labelledby': 'roleselector-btn',
          }}
          className='nav-roleselector-menu'
        >
          <div className='nav-roleselector-menutitle'>
              Meus grupos
          </div>
          {/* <Box sx={{ borderBottom: '1px solid #E6E6E6' }}>
            <StyledInputBase
              sx={{ paddingLeft: 2 }}
              placeholder="Pesquisar..."
              inputProps={{ 'aria-label': 'pesquisar' }}
              value={searchField}
              onChange={(e)=>_searchField(e.target.value)}
            />
          </Box> */}

          {user.membership && user.membership.map(c =>
            <OrganizationMenuItem key={c.id} handleSelect={handleCommunityChange} currentOrganization={currentCommunity ? currentCommunity.title : ''} organization={c} />
          )}
        </Menu>

      </div>

    </div>
  );
}

/* const StyledInputBase = styled(InputBase)({
  ml: 1,
  flex: 1,
  maxWidth: 600,
  '& input::placeholder': {
    color: '#444',
  },
  '& input': {
    marginLeft: 1,
  },
}); */
