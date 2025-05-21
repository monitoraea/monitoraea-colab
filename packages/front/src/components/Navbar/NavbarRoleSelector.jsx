import { useHistory, useLocation } from 'react-router-dom';

import { useEffect, useState } from 'react';
// import { /* InputBase, */ Menu, MenuItem } from '@mui/material';
import { useUser/* , useRouter */ } from 'dorothy-dna-react';

// import PerspectiveRenderer from './PerspectiveRenderer';

// const OrganizationMenuItem = ({ perspectives, handleSelect, currentOrganization, organization }) => {
//   return currentOrganization !== organization.name ? <MenuItem onClick={() => handleSelect(organization.id)}>      
//     <PerspectiveRenderer perspectives={perspectives} community={{...organization, perspective: organization.descriptor_json?.perspective}} />    
//     {organization.name}
//   </MenuItem> : null;
// }

export default function NavbarRoleSelector({ perspectives }) {
  const location = useLocation();
  const history = useHistory();

  const { user } = useUser();
  // const { currentCommunity, changeRoute } = useRouter();

  const [membership, _membership] = useState(null);

  // const [anchorEl, setAnchorEl] = useState(null);
  // const closeMenu = () => setAnchorEl(null);

  // const open = Boolean(anchorEl);

  /* const [searchField, _searchField] = useState(''); */

  useEffect(() => {
    _membership(user.membership.sort((a, b) => a.descriptor_json.perspective > b.descriptor_json.perspective ? 1 : -1));
  }, [user])

  // const handleCommunityChange = (community) => {
  //   changeRoute({ community });

  //   closeMenu();
  // }


  return (
    <div className="nav-roleselector">

      <div style={{ display: 'flex', gap: '5px' }}>
        <button disabled={location.pathname==='/minha_area'} className={location.pathname==='/minha_area' ? 'button-invert' : 'button-outline'} onClick={()=>history.push("/minha_area")}>
          Minha área
        </button>

        {user.membership && user.membership.length > 1 && <button disabled={location.pathname==='/'} className={location.pathname==='/' ? 'button-invert' : 'button-outline'} onClick={() => history.push('/')}>
          Meus grupos de trabalho
        </button>}
        
      </div>

      {/* user.membership && (user.membership.length > 1 || (currentCommunity && currentCommunity.id !== user.membership[0].id)) && <div>


        <button className="button-outline" onClick={event => setAnchorEl(event.currentTarget)}>
          Mudar de grupo de trabalho
        </button> 


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

          {!!membership && membership.map(c =>
            <OrganizationMenuItem key={c.id} perspectives={perspectives} handleSelect={handleCommunityChange} currentOrganization={currentCommunity ? currentCommunity.title : ''} organization={c} />
          )}
        </Menu>

      </div> */}

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
