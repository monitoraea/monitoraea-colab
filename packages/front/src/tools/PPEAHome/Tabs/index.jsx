import { Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
/* styles */
import styles from './styles.module.scss';

export default function CommissionTabs({ defaultTab, onTabChange, analysis }) {
  const [infoIsReady, _infoIsReady] = useState(false);  

  const handleChange = e => {
    onTabChange(e.target.id);
  };

  /* useEffect(() => {
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
    _indicatorIsReady(Object.values(analysis.analysis.indics).reduce((acc, i) => { if (!i.ready) { return false } else { return acc } }, true));
    _atuacaoIsReady(analysis.analysis.geo);

    _conectionsIsReady(analysis.analysis.connections);
  }, [analysis]); */

  return (
    <div className={styles['projects-tabs']}>
      <div className={styles['backdrop']}></div>
      <div className={styles['ptabs-content']}>
        <Tabs className={styles['ptabs-tabs']} onChange={handleChange} value={defaultTab}>
          <Tab
            disableRipple
            label="Cadastro"
            {...a11yProps('informacao'/* , infoProblemCounter */)}
            className={`${styles.indicator} ${infoIsReady ? styles['ready'] : styles['warning']} `} /* TODO: <<--${infoProblemCounter < 10 && styles['fixed-size']
            } */
          />
          <Tab
            disableRipple
            label="Enquadramento"
            {...a11yProps('enquadramento')}
          />  
          <Tab
            disableRipple
            label="Indicadores legados"
            {...a11yProps('indicadores')}
          /> 
          <Tab
            disableRipple
            label="Atuação"
            {...a11yProps('atuacao')}
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
