import { useState } from 'react';
import NavbarMenuItem from './NavbarMenuItem';
import icons from '../../tools/icons';

export default function MenuItems({ tools, currentTool, handleToolChange }) {
  const [activeMenuItem, setActiveMenuItem] = useState(undefined);

  return (
    <div className='nav-menu' onMouseLeave={() => setActiveMenuItem(undefined)}>

      {tools.map(t =>
        <NavbarMenuItem
          key={t.id}
          id={t.id}
          icon={<ToolIcon tool={t} />}
          title={t.title}
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          currentId={currentTool.id} 
          handleToolChange={handleToolChange}
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