import { Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
/* styles */
import styles from './styles.module.scss';

export default function CommissionTabs({ defaultTab, onTabChange, analysis }) {
  const [infoIsReady, _infoIsReady] = useState(false);

  const handleChange = e => {
    onTabChange(e.target.id);
  };

  return (
    <div className={styles['projects-tabs']}>
      <div className={styles['backdrop']}></div>
      <div className={styles['ptabs-content']}>
        <Tabs className={styles['ptabs-tabs']} onChange={handleChange} value={defaultTab}>
          <Tab
            disableRipple
            label="Cadastros"
            {...a11yProps('informacao'/* , infoProblemCounter */)}
            disabled = {defaultTab === 'gerenciar'}
            style={{ color: defaultTab === 'gerenciar' ? '#aaa' : 'inherit' }}
          />
          <Tab
            disableRipple
            label="Linha do tempo"
            {...a11yProps('linha_tempo')}
            disabled = {defaultTab === 'gerenciar'}
            style={{ color: defaultTab === 'gerenciar' ? '#aaa' : 'inherit' }}
          />
          {defaultTab === 'gerenciar' && <Tab
            disableRipple
            label="Gerenciar"
            {...a11yProps('gerenciar')}
          />}
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
