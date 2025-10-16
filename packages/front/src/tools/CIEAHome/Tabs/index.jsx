import { Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';

/* styles */
import styles from './styles.module.scss';

export default function CommissionTabs({ defaultTab, onTabChange, analysis }) {
  const [indicatorIsReady, _indicatorIsReady] = useState(false);
  const [indicProblemCounter, _indicProblemCounter] = useState(0);

  const handleChange = e => {
    onTabChange(e.target.id);
  };

  useEffect(() => {
    if (!analysis) return;

    let filterCounter = 0;

    const filterObj = (Object.filter = (obj, predicate) =>
      Object.keys(obj)
        .filter(key => {
          if (predicate(obj[key])) filterCounter++;
          return predicate(obj[key]);
        })
        // eslint-disable-next-line no-sequences
        .reduce((res, key) => ((res[key] = obj[key]), res), {}));

    filterObj(analysis.analysis.indics, x => x.ready === false);
    _indicProblemCounter(filterCounter);
    _indicatorIsReady(Object.values(analysis.analysis.indics).reduce((acc, i) => { if (!i.ready) { return false } else { return acc } }, true));

  }, [analysis]);

  return (
    <div className={styles['projects-tabs']}>
      <div className={styles['backdrop']}></div>
      <div className={styles['ptabs-content']}>
        <Tabs className={styles['ptabs-tabs']} onChange={handleChange} value={defaultTab}>
          <Tab
            disableRipple
            label="Cadastro"
            {...a11yProps('informacao')}
          />
          <Tab
            disableRipple
            label="Indicadores"
            {...a11yProps('indicadores', indicProblemCounter > 0 ? indicProblemCounter : '')}
            className={`${styles.indicator} ${indicatorIsReady ? styles['ready'] : styles['not-ready']} ${indicProblemCounter < 10 && styles['fixed-size']
              }`}
          />
          <Tab
            disableRipple
            label="Linha do tempo"
            {...a11yProps('linha_tempo')}
          />
        </Tabs>
      </div>
    </div>
  );
}

function a11yProps(index, problemCounter = '') {
  return {
    id: index,
    'aria-controls': `simple-tabpanel-${index}`,
    value: index,
    'data-problems': problemCounter,
  };
}
