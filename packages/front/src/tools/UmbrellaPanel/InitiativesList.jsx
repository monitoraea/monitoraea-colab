import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CATEGORIA_BY_KEY } from './categorias';
import styles from './styles.module.scss';

const ROW_H = 46; // altura fixa de cada linha (2 linhas de texto): a quantidade por página é calculada em cima dela
const FALLBACK_PAGE_SIZE = 10; // antes da 1ª medição e no layout de coluna única (altura da lista livre)
const MIN_PAGE_SIZE = 5;
const STACKED = '(max-width: 1000px)';

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
  const [start, _start] = useState(0); // índice do 1º item visível (mantém o "lugar" quando a página muda de tamanho)
  const [pageSize, _pageSize] = useState(FALLBACK_PAGE_SIZE);
  const [expanded, _expanded] = useState(null); // chave da linha com o nome completo aberto
  const bodyRef = useRef();

  const items = useMemo(() => panel?.items || [], [panel]);

  const selectedItems = useMemo(() => items.filter(i => selected.includes(keyOf(i))).sort(byName), [items, selected]);

  const rows = useMemo(() => {
    const q = norm(search);
    return items.filter(i => !selected.includes(keyOf(i)) && (!q || norm(i.nome).includes(q))).sort(byName);
  }, [items, selected, search]);

  const first = Math.min(start, Math.max(0, rows.length - 1));
  const pageRows = rows.slice(first, first + pageSize);

  // busca ou novos dados voltam ao começo
  useEffect(() => _start(0), [search, panel]);

  // quantas linhas cabem: mede a altura da lista (ela preenche o card) e recalcula quando muda de tamanho
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const stacked = window.matchMedia(STACKED);

    const measure = () => {
      const n = stacked.matches
        ? FALLBACK_PAGE_SIZE // coluna única: a altura da lista depende do conteúdo, não dá para medir
        : Math.max(MIN_PAGE_SIZE, Math.floor(el.clientHeight / ROW_H));
      _pageSize(prev => (prev === n ? prev : n));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    stacked.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      stacked.removeEventListener('change', measure);
    };
  }, []);

  const add = key => {
    onSelect([...selected, key]);
    onZoom(key);
  };
  const remove = key => onSelect(selected.filter(k => k !== key));

  // abre o nome completo só se ele estiver cortado (2 linhas)
  const maybeExpand = (key, e) => {
    const name = e.currentTarget.querySelector(`.${styles.name}`);
    _expanded(name && name.scrollHeight > name.clientHeight + 1 ? key : null);
  };
  const rowProps = (key, onActivate) => ({
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
    onMouseEnter: e => maybeExpand(key, e),
    onFocus: e => maybeExpand(key, e),
    onMouseLeave: () => _expanded(null),
    onBlur: () => _expanded(null),
  });

  const renderName = i => {
    const cat = CATEGORIA_BY_KEY[i.categoria];
    return (
      <>
        <span className={styles.swatch} style={{ background: cat.color }} title={cat.label} />
        <span className={styles.name} title={i.nome}>
          {i.nome || `#${i.id}`}
        </span>
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
                <div
                  key={keyOf(i)}
                  className={`${styles.listRow} ${styles.selected} ${styles.free}`}
                  onClick={() => onZoom(keyOf(i))}
                >
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
        <div className={styles.listBody} ref={bodyRef} style={{ '--row-h': `${ROW_H}px` }}>
          {!panel && <div className={styles.empty}>Carregando...</div>}
          {panel && !pageRows.length && <div className={styles.empty}>Nenhum cadastro encontrado.</div>}
          {pageRows.map(i => (
            <div
              key={keyOf(i)}
              className={`${styles.listRow} ${expanded === keyOf(i) ? styles.open : ''}`}
              {...rowProps(keyOf(i), () => add(keyOf(i)))}
            >
              {renderName(i)}
            </div>
          ))}
        </div>

        {rows.length > pageSize && (
          <div className={styles.pager}>
            <button disabled={first === 0} onClick={() => _start(Math.max(0, first - pageSize))}>
              ‹ Anterior
            </button>
            <span>
              {first + 1}–{Math.min(first + pageSize, rows.length)} de {rows.length}
            </span>
            <button disabled={first + pageSize >= rows.length} onClick={() => _start(first + pageSize)}>
              Próxima ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
