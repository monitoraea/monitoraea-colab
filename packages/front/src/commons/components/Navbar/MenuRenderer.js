import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mui/material';
import styles from './nav-menu.module.scss';
import icons from '../../../tools/icons';
import Menu from '../../../components/icons/Menu';
import Close from '../../../components/icons/XCircle';

import { layoutTabletMQ } from '../../../utils/configs';

export default function MenuRenderer({ items }) {
  const [menuItens, _menuItens] = useState([]);
  const [hiddenMenuItems, _hiddenMenuItems] = useState([]);
  const [showHiddenMenu, _showHiddenMenu] = useState(false);
  const [isThereAHiddenMenuItemActive, _isThereAHiddenMenuItemActive] = useState(false);
  const isLayoutTablet = useMediaQuery(layoutTabletMQ);

  useEffect(() => {
    if (!items) return;

    _menuItens(isLayoutTablet ? items.slice(0, 5) : items);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isLayoutTablet]);

  useEffect(() => {
    _hiddenMenuItems(
      isLayoutTablet
        ? items.filter(item => {
            return !menuItens.includes(item);
          })
        : [],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItens]);

  useEffect(() => {
    _isThereAHiddenMenuItemActive(hiddenMenuItems.some(hMenuItem => hMenuItem.active === true));
  }, [hiddenMenuItems]);

  const handleMenuOpening = event => toolId => {
    event(toolId);
    _showHiddenMenu(false);
  };

  return (<>
    {menuItens && menuItens.length > 1 && <>
      <div className={styles['nav-menu']}>
        {menuItens &&
          menuItens.map(i => (
            <NavbarMenuItem
              key={i.id}
              id={i.id}
              icon={<ToolIcon tool={i} />}
              title={i.title}
              active={i.active}
              onItemClick={toolId => handleMenuOpening(i.onClick)(toolId)}
              showTitle={!isLayoutTablet}
            />
          ))}

        {isLayoutTablet && hiddenMenuItems && hiddenMenuItems.length > 0 && (
          <NavbarMenuItem
            id={0}
            icon={showHiddenMenu ? <Close /> : <Menu />}
            title={'Menu'}
            active={isThereAHiddenMenuItemActive}
            onItemClick={() => _showHiddenMenu(!showHiddenMenu)}
            showTitle={!isLayoutTablet}
          />
        )}
      </div>

      {hiddenMenuItems && hiddenMenuItems.length > 0 && (
        <div className={`${showHiddenMenu ? styles['show'] : styles['hide']} ${styles['hidden-menu']}`}>
          {hiddenMenuItems.map(h => (
            <NavbarMenuItem
              key={h.id}
              id={h.id}
              icon={<ToolIcon tool={h} />}
              title={h.title}
              active={h.active}
              onItemClick={toolId => handleMenuOpening(h.onClick)(toolId)}
              showTitle
            />
          ))}
        </div>
      )}
    </>}
  </>);
}

function ToolIcon({ tool }) {
  const EIcon = tool && tool.icon && icons[tool.icon] ? icons[tool.icon] : undefined;

  return <>{EIcon && <EIcon />}</>;
}

function NavbarMenuItem({ title, icon, id, active, onItemClick, showTitle }) {
  return (
    <div className={`${styles['nav-menu-item']} ${active && styles['active']}`} onClick={() => onItemClick(id)}>
      <div className={styles['nav-menu-icon']}>{icon}</div>
      {showTitle && <div className={styles['nav-menu-title']}>{title}</div>}
    </div>
  );
}
