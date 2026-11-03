import { CATEGORIAS } from './categorias';
import styles from './styles.module.scss';

const R = 52; // raio do anel
const STROKE = 22;
const C = 2 * Math.PI * R;

/* "Iniciativas por perspectiva": rosca + tabela (categoria, nº e total). Sem percentuais, por ora. */
export default function PerspectiveBlock({ panel }) {
  const counts = panel?.porCategoria;
  const total = panel?.total || 0;

  // cada fatia é um círculo com traço tracejado: o "dash" é a fatia e o deslocamento posiciona o início
  let acc = 0;
  const slices = CATEGORIAS.map(c => {
    const len = total ? ((counts?.[c.key] || 0) / total) * C : 0;
    const slice = { c, len, offset: -acc };
    acc += len;
    return slice;
  });

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <b>Iniciativas por perspectiva</b>
        <span className={styles.sub}>no recorte</span>
      </div>

      <div className={styles.donutWrap}>
        <svg viewBox="0 0 140 140" className={styles.donut} role="img" aria-label="Iniciativas por perspectiva">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#eceff4" strokeWidth={STROKE} />
            {slices
              .filter(s => s.len > 0)
              .map(s => (
                <circle
                  key={s.c.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.c.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={s.offset}
                />
              ))}
          </g>
          <text x="70" y="70" textAnchor="middle" className={styles.donutTotal}>
            {panel ? total : '–'}
          </text>
          <text x="70" y="86" textAnchor="middle" className={styles.donutLabel}>
            iniciativas
          </text>
        </svg>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>CATEGORIA</th>
            <th>Nº</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIAS.map(c => (
            <tr key={c.key}>
              <td>
                <span className={styles.swatch} style={{ background: c.color }} /> {c.label}
              </td>
              <td>{panel ? counts[c.key] : '–'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td>{panel ? total : '–'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
