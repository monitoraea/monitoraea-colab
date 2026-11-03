import { useEffect, useRef } from 'react';

import { CATEGORIAS, TERRITORIO_COLOR } from './categorias';
import styles from './styles.module.scss';

/* Mini-figuras do critério de pertinência: limite tracejado + elipse (iniciativa) dentro / cruzando / fora. */
function Fig({ ellipse }) {
  const dash = { fill: 'none', stroke: TERRITORIO_COLOR, strokeWidth: 2, strokeDasharray: '4 3' };
  const e = { fill: '#9bbbe3', fillOpacity: 0.7, stroke: '#2f7fd1', strokeWidth: 1.5 };
  return (
    <svg width="44" height="30" viewBox="0 0 44 30" aria-hidden="true">
      <rect x="2" y="2" width="40" height="26" rx="2" {...dash} />
      {ellipse === 'in' && <ellipse cx="22" cy="15" rx="9" ry="6" {...e} />}
      {ellipse === 'cross' && <ellipse cx="40" cy="15" rx="9" ry="6" {...e} />}
      {ellipse === 'out' && <ellipse cx="22" cy="40" rx="9" ry="6" {...e} style={{ ...e, opacity: 0.5 }} />}
    </svg>
  );
}

/*
 * LEGENDA: camadas (com marcação geral "Cadastros existentes") + critério de pertinência territorial.
 * `visible`: { [categoria]: boolean }; `counts`: { [categoria]: number }.
 */
export default function Legend({ visible, counts, onChange }) {
  const masterRef = useRef();

  const total = CATEGORIAS.reduce((acc, c) => acc + (counts?.[c.key] || 0), 0);
  const on = CATEGORIAS.filter(c => visible[c.key]).length;

  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = on > 0 && on < CATEGORIAS.length;
  }, [on]);

  const toggleAll = checked => onChange(Object.fromEntries(CATEGORIAS.map(c => [c.key, checked])));

  return (
    <div className={styles.legendBox}>
      <div className={styles.legendHead}>
        <span>LEGENDA</span>
        <span>marque as camadas que deseja ver</span>
      </div>

      <div className={styles.legendCols}>
        <div>
          <div className={styles.legendColTitle}>CAMADAS</div>
          <label className={styles.layerRow}>
            <input
              ref={masterRef}
              type="checkbox"
              checked={on === CATEGORIAS.length}
              onChange={e => toggleAll(e.target.checked)}
            />
            <b>Cadastros existentes</b>
            <b className={styles.count}>{total}</b>
          </label>
          {CATEGORIAS.map(c => (
            <label key={c.key} className={`${styles.layerRow} ${styles.sub}`}>
              <input
                type="checkbox"
                checked={!!visible[c.key]}
                onChange={e => onChange({ ...visible, [c.key]: e.target.checked })}
              />
              <span className={styles.swatch} style={{ background: c.color }} />
              {c.label}
              <span className={styles.count}>{counts?.[c.key] ?? ''}</span>
            </label>
          ))}
        </div>

        <div>
          <div className={styles.legendColTitle}>CRITÉRIO DE PERTINÊNCIA TERRITORIAL</div>
          <p className={styles.rule}>
            Entra no recorte toda iniciativa cuja área <b>toca ou cruza o limite tracejado</b> do território.
          </p>
          <div className={styles.ruleRow}>
            <Fig ellipse="in" />
            <span>Dentro do limite</span>
            <em className={styles.yes}>ENTRA</em>
          </div>
          <div className={styles.ruleRow}>
            <Fig ellipse="cross" />
            <span>Toca ou cruza o limite</span>
            <em className={styles.yes}>ENTRA</em>
          </div>
          <div className={styles.ruleRow}>
            <Fig ellipse="out" />
            <span>Fora do limite</span>
            <em className={styles.no}>NÃO ENTRA</em>
          </div>
          <div className={styles.ruleLine}>
            <svg width="30" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="30" y2="3" stroke={TERRITORIO_COLOR} strokeWidth="3" strokeDasharray="6 4" />
            </svg>
            <span>Limite do território. Só a parte em terra conta; o mar fica de fora.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
