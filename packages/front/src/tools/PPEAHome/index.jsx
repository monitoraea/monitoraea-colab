import { useState, useEffect } from 'react';

// import Dialog from '@mui/material/Dialog';

import { useDorothy, useRouter } from 'dorothy-dna-react';
import axios from 'axios';
import { useQuery } from 'react-query';
// import { PageTitle } from '../../components/PageTitle/PageTitle';

import /* styles from */ './styles.module.scss';

export default function PPEAHome() {
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();

  const [commissionId, _commissionId] = useState(null);

  //get commission_id
  /* const { data: comissao } = useQuery(['comission', { currentCommunity: currentCommunity.id }], {
    queryFn: async () => (await axios.get(`${server}commission/id_from_community/${currentCommunity.id}`)).data,
  });

  //get comission_data
  const { data } = useQuery(['commission_info', { commissionId }], {
    queryFn: async () => (await axios.get(`${server}commission/${commissionId}`)).data,
    enabled: !!commissionId,
  });

  useEffect(() => {
    if (!comissao) return;
    _commissionId(comissao.id);
  }, [comissao]); */

  return (
    <>
      <div className="page width-limiter">
        <div className="page-content">
          <div className="page-body">
            <div className="tablebox" style={{ padding: '20px' }}>
              <h4>TESTE</h4>
              <hr/>
              [TESTE]
            </div>
          </div>
        </div>
      </div>
    </>
  );
}