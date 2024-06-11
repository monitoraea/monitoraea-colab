import { useState } from 'react';
import LoginAbout from './LoginAbout';
import Card from '../Card';

import { useSnackbar } from 'notistack';
import axios from 'axios';

import { useDorothy } from 'dorothy-dna-react';
import {
  Link,
  useParams
} from 'react-router-dom';

import { useQuery } from 'react-query';

const ParticipatePanel = () => {
  const params = useParams();

  const { server } = useDorothy();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [status, _status] = useState('participate');

  const { data } = useQuery(
    ['participate', { project_id: params.project_id }],
    {
      queryFn: async () => (await axios.get(`${server}project/for_participation/${params.project_id}`)).data,
      enabled: !!params.project_id
    },
  );

  const doParticipate = async (isADM) => {
    const snackKey = enqueueSnackbar('Enviando pedido de participação...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    const { data } = await axios.post(
      `${server}project/${params.project_id}/participate`,
      {
        isADM,
      },
      {
        headers: {
          'X-Dorothy-Token': localStorage.getItem('pppzcm-dorothy-token'),
        },
      },
    );

    closeSnackbar(snackKey);

    if (data.success) {
      enqueueSnackbar('Seu pedido de participação foi enviado! Uma notificação será enviada, no momento da aprovação', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    } else {
      if (data.error === 'already_member') {
        enqueueSnackbar('Você já é membro deste grupo!', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      } else if (data.error === 'already_in_list') {
        enqueueSnackbar('Você já está na lista de aprovação deste grupo!', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      } else {
        enqueueSnackbar('Erro ao enviar seu pedido de participação! Por favor, entre em contato com a administração', {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      }
    }

    _status('done');
  };

  return (
    <div className='page width-limiter centered'>
      <div className='page-content'>
        <div className='row middle-xs'>
          <div className="col" style={{ padding: '0 50px' }}>
            <LoginAbout />
          </div>
          <div className="col">

            <Card title="" headerless>
              <div className='p-4'>
                <div className='row mb-3'>
                  <h4>Pedido de participação</h4>
                </div>

                {!data && <>
                  <div className='row mb-3'>
                    Carregando...
                  </div>
                </>}

                {!!data && status === 'participate' && <>
                  <div className='row mb-3'>
                    {data.nome}
                  </div>
                  <div className='row mb-3 end-xs middle-xs' style={{ gap: '10px' }}>
                    <button className='button-primary' onClick={() => doParticipate(false)}>Participar como colaborador</button>
                    {data.total_members <= 0 && <button className='button-outline' onClick={() => doParticipate(true)}>Participar como responsável</button>}
                  </div>
                </>}

                <div className='row mb-3' style={{ display: 'flex', flexDirection: 'column' }}>
                  <div><a href={`${import.meta.env.VITE_PORTAL_URL}projeto-single/${params.project_id}`} style={{ color: 'inherit', fontWeight: '600' }}>« Voltar à página da iniciativa</a></div>
                  <div><Link to="/" style={{ color: 'inherit', fontWeight: '600' }}>Acessar a área colaborativa »</Link></div>
                </div>

              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipatePanel;