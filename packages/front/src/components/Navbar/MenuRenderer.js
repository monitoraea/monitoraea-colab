import { useState } from 'react';
import NavbarMenuItem from './NavbarMenuItem';
import icons from '../../tools/icons';

export default function MenuRenderer({ items }) {
  const [activeMenuItem, setActiveMenuItem] = useState(undefined);

  return (
    <div className='nav-menu' onMouseLeave={() => setActiveMenuItem(undefined)}>

      {items.map(i =>
        <NavbarMenuItem
          key={i.id}
          id={i.id}
          icon={<ToolIcon tool={i} />}
          title={i.title}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          active={i.active} 
          onItemClick={i.onClick}
        />
      )}

    </div>
  );
}

function ToolIcon({ tool }) {

  const EIcon = (tool && tool.icon && icons[tool.icon]) ? icons[tool.icon] : undefined;

  return <>
      {EIcon && <EIcon />}
  </>
}