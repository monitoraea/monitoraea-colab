import { useEffect, useMemo, useState } from 'react';

import { CATEGORIA_BY_KEY } from './categorias';
import styles from './styles.module.scss';

const PAGE_SIZE = 10;

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const keyOf = i => `${i.categoria}:${i.id}`;
const byName = (a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR');

/*
 * "Iniciativas do recorte": cadastros dentro do território, com busca e paginação. As iniciativas selecionadas
 * (no mapa ou aqui) ficam fixas no topo, em "Selecionadas", e saem da lista paginada.
 * (Convites e completude: fora por ora.)
 */
export default function InitiativesList({ panel, selected, onSelect, onZoom }) {
  const [search, _search] = useState('');
  const [page, _page] = useState(0);

  const items = useMemo(() => panel?.items || [], [panel]);

  const selectedItems = useMemo(() => items.filter(i => selected.includes(keyOf(i))).sort(byName), [items, selected]);

  const rows = useMemo(() => {
    const q = norm(search);
    return items.filter(i => !selected.includes(keyOf(i)) && (!q || norm(i.nome).includes(q))).sort(byName);
  }, [items, selected, search]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const pageRows = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  // busca ou novos dados voltam para a primeira página
  useEffect(() => _page(0), [search, panel]);

  const add = key => {
    onSelect([...selected, key]);
    onZoom(key);
  };
  const remove = key => onSelect(selected.filter(k => k !== key));

  const renderName = i => {
    const cat = CATEGORIA_BY_KEY[i.categoria];
    return (
      <>
        <span className={styles.swatch} style={{ background: cat.color }} title={cat.label} />
        <span className={styles.name}>{i.nome || `#${i.id}`}</span>
      </>
    );
  };

  return (
    <div className={styles.listCol}>
      <div className={styles.listBlock}>
        <div className={styles.listTitle}>Iniciativas do recorte</div>

        <div className={styles.tab}>
          Cadastros <span className={styles.badge}>{panel ? panel.total : '–'}</span>
        </div>

        {selectedItems.length > 0 && (
          <div className={styles.selectedBox}>
            <div className={styles.selectedHead}>
              <span>
                Selecionadas <span className={styles.badge}>{selectedItems.length}</span>
              </span>
              <button onClick={() => onSelect([])}>limpar</button>
            </div>
            <div className={styles.selectedBody}>
              {selectedItems.map(i => (
                <div key={keyOf(i)} className={`${styles.listRow} ${styles.selected}`} onClick={() => onZoom(keyOf(i))}>
                  {renderName(i)}
                  <button
                    className={styles.removeBtn}
                    title="Remover da seleção"
                    onClick={e => {
                      e.stopPropagation();
                      remove(keyOf(i));
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
          {panel && !pageRows.length && <div className={styles.empty}>Nenhum cadastro encontrado.</div>}
          {pageRows.map(i => (
            <div key={keyOf(i)} className={styles.listRow} onClick={() => add(keyOf(i))}>
              {renderName(i)}
            </div>
          ))}
        </div>

        {rows.length > PAGE_SIZE && (
          <div className={styles.pager}>
            <button disabled={current === 0} onClick={() => _page(current - 1)}>
              ‹ Anterior
            </button>
            <span>
              {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, rows.length)} de {rows.length}
            </span>
            <button disabled={current >= pages - 1} onClick={() => _page(current + 1)}>
              Próxima ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
