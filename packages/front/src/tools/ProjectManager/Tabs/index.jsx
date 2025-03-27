import { Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
/* styles */
import styles from './ProjectsTabs.module.scss';

export default function ProjectsTabs({ defaultTab, onTabChange, analysis }) {
  const [infoIsReady, _infoIsReady] = useState(false);
  const [conectionsIsReady, _conectionsIsReady] = useState(false);
  const [indicatorIsReady, _indicatorIsReady] = useState(false);
  const [atuacaoIsReady, _atuacaoIsReady] = useState(false);
  const [indicProblemCounter, _indicProblemCounter] = useState(0);
  const [infoProblemCounter, _infoProblemCounter] = useState(0);

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

    filterCounter = 0;
    const groupByNotReady = filterObj(analysis.analysis.information, item => item === false);
    _infoProblemCounter(filterCounter);

    const isEmpty = obj => {
      return Object.keys(obj).length === 0;
    };

    _infoIsReady(isEmpty(groupByNotReady));
    //_indicatorIsReady(analysis.ready);
    _indicatorIsReady(
      Object.values(analysis.analysis.indics).reduce((acc, i) => {
        if (!i.ready) {
          return false;
        } else {
          return acc;
        }
      }, true),
    );
    _atuacaoIsReady(analysis.analysis.geo);

    _conectionsIsReady(analysis.analysis.connections);
  }, [analysis]);

  return (
    <div className={styles['projects-tabs']}>
      <div className={styles['backdrop']}></div>
      <div className={styles['ptabs-content']}>
        <Tabs className={styles['ptabs-tabs']} onChange={handleChange} value={defaultTab}>
          <Tab
            disableRipple
            label="Informações"
            {...a11yProps('informacao', infoProblemCounter > 0 ? infoProblemCounter : '')}
            className={`${styles.indicator} ${infoIsReady ? styles['ready'] : styles['warning']} ${
              infoProblemCounter < 10 && styles['fixed-size']
            }`}
          />
          <Tab
            disableRipple
            label="Conexões"
            {...a11yProps('conexoes')}
            className={`${styles.indicator} ${conectionsIsReady ? styles['ready'] : styles['not-ready']}`}
          />
          <Tab
            disableRipple
            label="Indicadores"
            className={`${styles.indicator} ${indicatorIsReady ? styles['ready'] : styles['not-ready']} ${
              indicProblemCounter < 10 && styles['fixed-size']
            }`}
            {...a11yProps('indicadores', indicProblemCounter > 0 ? indicProblemCounter : '')}
          />
          <Tab
            disableRipple
            label="Abrangência"
            className={`${styles.indicator} ${atuacaoIsReady ? styles['ready'] : styles['not-ready']} ${
              styles['fixed-size']
            }`}
            {...a11yProps('abrangencia', !atuacaoIsReady ? '1' : '')}
          />
          <Tab disableRipple label="Linha do tempo" {...a11yProps('timeline')} />
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
