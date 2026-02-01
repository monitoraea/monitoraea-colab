import { useDorothy, useRouter } from 'dorothy-dna-react';

import axios from 'axios';

import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from 'react-query';

import styles from './styles.module.scss'

export default function NetworkHomeCIEA() {
  const { server } = useDorothy();
  const { changeRoute } = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const { data } = useQuery(
    ['user_commissions_list'],
    {
      queryFn: async () => (await axios.get(`${server}commission/mine`)).data,
    }
  );

  const doParticipate = async (isADM, commissionId) => {
    const snackKey = enqueueSnackbar('Enviando pedido de participação...', {
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });

    const { data } = await axios.post(
      `${server}commission/${commissionId}/participate`,
      {
        isADM,
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

      queryClient.invalidateQueries(`user_commissions_list`);
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
  };

  return (
    <>
      <div className="page width-limiter">
        <div className="page-content">
          <div className="page-body">
            <div className="tablebox" style={{ padding: '20px' }}>
              <h4>A Rede de Comunidades de Aprendizagens dos Colegiados é composta por:</h4>
              <ul className={styles['commission_list']}>
                {!data && <>Carregando...</>}
                {data && data.map(c => <li key={c.id} className={styles['commission']}>
                  <div className={styles.name}>{c.name}</div>
                  <div className={styles.actions}>
                    {c.is_requesting && <div className={styles.sent}>Solicitação enviada</div>}
                    {!c.is_requesting && <>
                      {c.is_member && <>
                        <button className="button-primary" onClick={() => changeRoute({ community: c.community_id })}>
                          Acessar
                        </button>
                      </>}
                      {!c.is_member && <>
                        {!c.has_members && <button className="button-outline" onClick={() => doParticipate(true, c.id)}>
                          Participar como responsável
                        </button>}
                        <button className="button-primary" onClick={() => doParticipate(false, c.id)}>
                          Participar como colaborador
                        </button>
                      </>}
                    </>}
                  </div>
                </li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
