import { Tab, Tabs } from '@mui/material';
/* styles */
import styles from './styles.module.scss';


export default function ToolTabs({ defaultTab, onTabChange }) {
  // const { currentCommunity } = useRouter();

  const handleChange = e => {
    onTabChange(e.target.id);
  };

  return (
    <div className={styles['tool-tabs']}>
      <div className={styles['backdrop']}></div>
      <div className={styles['ptabs-content']}>
        <Tabs className={styles['ptabs-tabs']} onChange={handleChange} value={defaultTab}>
          <Tab disableRipple label="Membros" {...a11yProps('lista')} />
          <Tab disableRipple label="Solicitações" {...a11yProps('solicitacoes')} />
          <Tab disableRipple label="Convites" {...a11yProps('convites')} />
        </Tabs>
      </div>
    </div>
  );
}

function a11yProps(index) {
  return {
    id: index,
    'aria-controls': `simple-tabpanel-${index}`,
    value: index,
  };
}
