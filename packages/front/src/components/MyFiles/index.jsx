import { useQuery } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { PageTitle } from '../../components/PageTitle/PageTitle';

/* components */

import Card from '../../components/Card';

/* style */
import styles from './styles.module.scss';

export default function InformationsTab() {
  /* hooks */
  const { server } = useDorothy();

  /* states */

  //get commission_data
  const { data } = useQuery(['user_info'], {
    queryFn: async () => (await axios.get(`${server}user/files`)).data,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!data) return <></>;

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title="Meus arquivos" />
      </div>
      <div className="page-content">
        <div className="page-body">
          <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>

            {/* TODO: NENHUM ARQUIVO ENCONTRADO! */}
            {!data.length && <div className={`p-3 ${styles.nenhum}`}>
              Nenhum arquivo encontrado!
            </div>}

            {!!data.length && <div className={`p-3 ${styles.files}`}>
              {data.map(f =><ul key={f.id}>
                <li onClick={()=>window.open(f.url, '_blank')} className={styles.url}>{f.title}</li>
              </ul>)}
            </div>}
          </Card>
          
        </div>
      </div>
    </div>
  );
}
