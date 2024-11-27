export default function MenuItem({ title/* , icon */, id/*,  setActiveMenuItem */, active, onItemClick }) {
  /* const handleMouseEnter = () => setActiveMenuItem(id); */

  return (
    <div className={active ? 'nav-menu-item-new active' : 'nav-menu-item-new'} onClick={() => onItemClick(id)} /* onMouseEnter={handleMouseEnter} */>
      <button className="button-outline">{title}</button>
    </div>
  );
}