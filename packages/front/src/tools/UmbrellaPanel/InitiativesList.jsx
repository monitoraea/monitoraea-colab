import { useEffect, useMemo, useRef, useState } from 'react';

import { CATEGORIA_BY_KEY } from './categorias';
import styles from './styles.module.scss';

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* "Iniciativas do recorte": cadastros dentro do território, com busca. (Convites e completude: fora por ora.) */
export default function InitiativesList({ panel, selected, onSelect, onZoom }) {
  const [search, _search] = useState('');
  const rowRefs = useRef({});

  const rows = useMemo(() => {
    const q = norm(search);
    return (panel?.items || [])
      .filter(i => !q || norm(i.nome).includes(q))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }, [panel, search]);

  // seleção vinda do mapa: leva a primeira iniciativa selecionada para a área visível da lista
  useEffect(() => {
    const first = selected.find(k => rowRefs.current[k]);
    if (first) rowRefs.current[first].scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const clickRow = key => {
    const only = selected.length === 1 && selected[0] === key;
    onSelect(only ? [] : [key]);
    if (!only) onZoom(key);
  };

  return (
    <div className={styles.listBlock}>
      <div className={styles.listTitle}>Iniciativas do recorte</div>

      <div className={styles.tab}>
        Cadastros <span className={styles.badge}>{panel ? panel.total : '–'}</span>
      </div>

      <input
        className={styles.search}
        type="search"
        placeholder="Buscar cadastro"
        value={search}
        onChange={e => _search(e.target.value)}
      />

      <div className={styles.listCount}>
        {rows.length} {rows.length === 1 ? 'cadastro' : 'cadastros'}
      </div>

      <div className={styles.listHead}>INICIATIVA</div>
      <div className={styles.listBody}>
        {!panel && <div className={styles.empty}>Carregando...</div>}
        {panel && !rows.length && <div className={styles.empty}>Nenhum cadastro encontrado.</div>}
        {rows.map(i => {
          const cat = CATEGORIA_BY_KEY[i.categoria];
          const key = `${i.categoria}:${i.id}`;
          return (
            <div
              key={key}
              ref={el => (rowRefs.current[key] = el)}
              className={`${styles.listRow} ${selected.includes(key) ? styles.selected : ''}`}
              onClick={() => clickRow(key)}
            >
              <span className={styles.swatch} style={{ background: cat.color }} title={cat.label} />
              {i.nome || `#${i.id}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
