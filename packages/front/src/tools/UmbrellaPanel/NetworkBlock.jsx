import styles from './styles.module.scss';

const METRICS = [
  ['Nós · arestas', '–'],
  ['Densidade', '–'],
  ['Grau médio', '–'],
  ['Componentes', '–'],
];

/* "Conexões entre iniciativas": ainda em desenvolvimento — desenhada como no mock, com os números trocados por hífen. */
export default function NetworkBlock() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <b>Conexões entre iniciativas</b>
        <span className={styles.sub}>sem centro · só medidas do conjunto</span>
      </div>

      <p className={styles.netText}>
        Parcerias declaradas entre as iniciativas do recorte. Nenhuma iniciativa é tratada como centro.
      </p>

      <div className={styles.graph}>
        <div className={styles.graphBar}>
          <span>GRAFO DA REDE</span>
          <span className={styles.graphBtns}>
            <button disabled title="Aproximar">
              +
            </button>
            <button disabled title="Afastar">
              −
            </button>
            <button disabled title="Tela cheia">
              ⤢
            </button>
            <button disabled>Layout</button>
          </span>
        </div>
        <div className={styles.graphBody}>
          <div className={styles.graphPlaceholder}>
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <g fill="none" stroke="#6b7280" strokeWidth="1.6">
                <circle cx="6" cy="7" r="3" />
                <circle cx="22" cy="8" r="3" />
                <circle cx="14" cy="21" r="3" />
                <path d="M8.6 8.2l10.8-.4M7.6 9.6l5 8.6M20.4 10.6l-5 8.2" />
              </g>
            </svg>
            <b>Espaço reservado para o grafo</b>
            <span>
              Visualização interativa da rede: zoom, arrastar nós, destacar comunidades e filtrar por perspectiva.
            </span>
            <em>EM DESENVOLVIMENTO</em>
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        {METRICS.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
