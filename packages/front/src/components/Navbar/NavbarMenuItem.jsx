export default function MenuItem({ title, icon, id, setActiveMenuItem, active, onItemClick }) {
  const handleMouseEnter = () => setActiveMenuItem(id);

  return (
    <div className={active ? 'nav-menu-item active' : 'nav-menu-item'} onClick={() => onItemClick(id)} onMouseEnter={handleMouseEnter}>
      <div className='nav-menu-icon'>
        {icon}
      </div>
      <div className='nav-menu-title'>
        {title}
      </div>
    </div>
  );
}