import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import _ from 'lodash';
import { /* useDorothy, */ useRouter } from 'dorothy-dna-react';

/* components */
import Card from '../../components/Card';
import ConfirmationDialog from '../../components/ConfirmationDialogAdvanced';
import { Renderer, mapData2Form, getFormData } from '../../components/FormRenderer'

/* icons */
import CheckCircle from '../../components/icons/CheckCircle';
import XCircle from '../../components/icons/XCircle';
import FilePlus from '../../components/icons/FilePlus';

/* style */
import styles from './indicators.module.scss';

import tree from './indics';

export default function IndicatorsTab({ entityId }) {/* hooks */
    const { server } = useDorothy();
    const { currentCommunity, changeRoute, params } = useRouter();
    const queryClient = useQueryClient();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [currentIndics, _currentIndics] = useState(null);

    const [openedBranch, _openedBranch] = useState(null);
    const [navBranch, _navBranch] = useState(null);

    const [toNavigate, _toNavigate] = useState(null);

    const [changed, _changed] = useState(false);

    const [currentForm, _currentForm] = useState(null);

    /* states */
    const [entity, _entity] = useState([]);
    const [files, _files] = useState({});

    //get policy_data
    const { data } = useQuery(['policy_info', { entityId }], {
        queryFn: async () => (await axios.get(`${server}ppea/${entityId}/draft/indics/${currentIndics}`)).data,
        enabled: !!currentIndics,
        retry: false,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (params && params[1]) _currentIndics(params[1]);
        else _currentIndics('1_1');
    }, [params]);

    useEffect(() => {
        if (!!currentIndics) {
            // console.log({ currentIndics })
            const branch_id = currentIndics.split('_')[0];
            _openedBranch(branch_id);

            const branch = tree.find(b => b.id === branch_id);
            const indic = branch.indics.find(i => i.id === currentIndics);
            _currentForm(indic.form);
        }
    }, [currentIndics]);

    const handleNavBranch = id => {
        if (navBranch !== id) _navBranch(id);
        else _navBranch(null);
    };

    const handleNavigation = (childId, rootId) => () => {
        _navBranch(rootId);
        if (!changed) changeRoute({ params: ['indicadores', childId] });
        else _toNavigate(childId);
    };

    const handleConfirmation = async action => {
        if (action === 'confirm') changeRoute({ params: ['indicadores', toNavigate] });

        _toNavigate(null);
    };

    const handleDataChange = (entity, files) => {
        _entity(entity)
        _files(files)
    }

    const handleSave = async () => {

        /* save */
        const data = getFormData(currentForm, entity, files) // prepare information (Renderer)
        data.set('indic', currentIndics)

        const snackKey = enqueueSnackbar('Gravando...', {
            /* variant: 'info', */
            /* hideIconVariant: true, */
            persist: true,
            anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
            },
        });

        try {
            let method, url;
            /* edit */
            method = 'put';
            url = `${server}ppea/${entityId}/draft/indics/${currentIndics}`;

          /* const { data: response } =  */await axios({
                method,
                url,
                data,
                config: { headers: { 'Content-Type': 'multipart/form-data' } },
            });

            // console.log(response);

            queryClient.invalidateQueries('policy_info');

            // onSave(!_.isEqual(originalEntity, entity));

            closeSnackbar(snackKey);

            enqueueSnackbar('Registro gravado com sucesso!', {
                variant: 'success',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
            });
        } catch (error) {
            closeSnackbar(snackKey);

            console.error(error);

            enqueueSnackbar('Erro ao gravar o registro!', {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
            });
        }
    };

    if (!data) return <></>

    return (
        <>
            <div className="page-content">
                <div className="page-sidebar">
                    <div className={`sidebar-body ${styles.tree}`}>
                        {tree && (
                            <ul>
                                {tree.map(d => (
                                    <li key={d.id} className={`mb-3 ${styles.li_lae_titles}`} onClick={() => handleNavBranch(d.id)}>
                                        <ListItemStatus
                                            title={d.title}
                                            ready={d.ready}
                                            className={openedBranch === d.id || navBranch === d.id ? styles.strong : ''}
                                        />
                                        <ul className={`${openedBranch === d.id || navBranch === d.id ? styles.show : styles.hide}`}>
                                            {d.indics.map(i => (
                                                <li key={i.id} className={`${styles.li_indicators}`} onClick={handleNavigation(i.id, d.id)}>
                                                    <ListItemStatus
                                                        title={i.title}
                                                        ready={i.ready}
                                                        className={`${styles.indic} ${currentIndics === i.id ? styles.selected : ''}`}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="page-body">
                    <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
                        <div className="p-3">
                            {!!currentForm && <Renderer
                                form={currentForm}
                                data={mapData2Form(data, currentForm)}
                                onDataChange={handleDataChange}
                                readonly={true}
                            />}

                            <div className="section-header">
                                <div className="section-title"></div>
                                <div className="section-actions">
                                    <button className="button-primary" onClick={handleSave}>
                                        <FilePlus></FilePlus>
                                        Gravar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* <Helpbox content={contentText} onClose={() => _contentText(null)} /> */}
                </div>
            </div>

            <ConfirmationDialog
                open={!!toNavigate}
                content="Você deseja sair do indicador sem salvar as alterações?"
                confirmButtonText="Confirmar"
                onClose={handleConfirmation}
            />
        </>
    );
}

function ListItemStatus({ title, ready, className }) {
    let icon = ready ? <CheckCircle /> : <XCircle />;

    return (
        <div className={`${styles['item-container']} ${className}`}>
            <div className={`${styles[ready ? 'done' : 'error']}`}>{icon}</div>
            <div>{title}</div>
        </div>
    );
}