import { useState, useEffect } from 'react';

// import Dialog from '@mui/material/Dialog';

import { useDorothy, useRouter } from 'dorothy-dna-react';
import axios from 'axios';
import { useQuery } from 'react-query';
// import { PageTitle } from '../../components/PageTitle/PageTitle';

import /* styles from */ './styles.module.scss';

export default function CIEAHome() {
  const { server } = useDorothy();
  const { currentCommunity } = useRouter();

  const [commissionId, _commissionId] = useState(null);

  //get commission_id
  const { data: comissao } = useQuery(['comission', { currentCommunity: currentCommunity.id }], {
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
  }, [comissao]);

  return (
    <>
      <div className="page width-limiter">
        <div className="page-content">
          <div className="page-body">
            <div className="tablebox" style={{ padding: '20px' }}>
              <h4>INFORMAÇÕES COLETADAS</h4>
              <hr/>
              {!!data && <ul>
                <li><strong>Estado:</strong> {data.nm_estado} ({data.nm_regiao})</li>
                <li><strong>Link:</strong> <ShowLink link={data.link} /></li>
                <li><strong>Criação:</strong> {data.data_criacao} (<ShowLink link={data.documento_criacao_arquivo} text={data.documento_criacao} />)</li>
                <li><strong>Regimento interno:</strong> <ShowLink link={data.regimento_interno_arquivo} text={data.regimento_interno} /></li>
                <ShowPPEA data={data} />
              </ul>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ShowLink({ link, text }) {
  if (!link?.length && !text) return <></>;
  if (!link?.length) return <>{text}</>;

  return (<a href={link} rel="noreferrer" target="_blank">
    {(!!text || link.length <= 250) && <>{text || link}</>}
    {link.length > 250 && <>{link.slice(0, 100)}...</>}
  </a>)
}

function ShowPPEA({ data }) {
  if(!data.ppea_tem) return <li><strong>PPEA:</strong> Não</li>

  return (<li>
    <strong>PPEA</strong>
    <ul>
      <li><strong>Decreto:</strong> {data.ppea_decreto}</li>
      <li><strong>Lei:</strong> <ShowLink link={data.ppea_arquivo} text={data.ppea_lei} /></li>
    </ul>
  </li>)
}