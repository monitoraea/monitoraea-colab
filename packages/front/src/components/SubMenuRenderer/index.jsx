/* import icons from '../../tools/icons'; */

import styles from './styles.module.scss';

export default function SubMenuRenderer({ items, analytics=false }) {
  /* TODO: Criar uma tool Projects(->organizacoes) e incluir, junto com organizacoes, em um grupo de "entidades"*" ou "cadastros"*/

  return (
    <>
      {items && (
        <ul>
          {items.map(i => (
            <li key={i.id} className={`${styles.item} ${i.active ? styles.active : ''}`}>
              {/* <ToolIcon tool={i} /> */}
              <button disabled={i.active} className={styles.item} onClick={() => i.onClick(i.id)}>
                {i.title}
              </button>
            </li>
          ))}
          {analytics && <li className={`${styles.item}`}>
            {/* <ToolIcon tool={i} /> */}
            <button className={styles.item} onClick={() => window.open(import.meta.env.VITE_GOOGLE_ANALYTICS, 'analytics')}>
              Analytics
            </button>
          </li>}
          
        </ul>
      )}
    </>
  );
}

/* function ToolIcon({ tool }) {

  const EIcon = (tool && tool.icon && icons[tool.icon]) ? icons[tool.icon] : undefined;

  return <>
    {EIcon && <EIcon />}
  </>
} */
