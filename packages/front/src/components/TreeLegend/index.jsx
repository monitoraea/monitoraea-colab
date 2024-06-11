export default function TreeLegend({ data, options }) {
    return (<ul className="chart-legend">
      {data.map(({ id, name, total }) => <li key={`terr_${id}`}>
        <div className="list-item">
          <div className="value">{(total).toFixed(0)}<span className="legend-percentage"></span></div>
          {!options && <div className="label">{name}</div>}
          {options && <div className="label">{options[name]}</div>}
        </div>
      </li>)}
    </ul>);
  }