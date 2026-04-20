import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy, useUser } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';
import styles from './styles.module.scss';

import {
    TextField,
    MenuItem,
} from '@mui/material';

/* components */

import Card from '../../components/Card';

// import HelpBoxButton from './HelpBoxButton';
// import GetHelpButton from './GetHelpButton';

import FilePlus from '../../components/icons/FilePlus';

import { Renderer, mapData2Form, mapForm2Data } from '../../components/FormRenderer';

import form from '../../../../../forms/connections/form1.yml';
import form_view from '../../../../../forms/connections/form1_view.yml';
import lists from '../../../../../forms/connections/lists1.yml';

export default function ConectionsTab({ entityName = 'zcm', entityId, onSave }) {
    /* hooks */
    const { server } = useDorothy();
    const queryClient = useQueryClient();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [entity, _entity] = useState({});
    const [originalEntity, _originalEntity] = useState({});

    const [indicacao_relations_recebe_it, _indicacao_relations_recebe_it] = useState([]);
    const [indicacao_relations_oferece_it, _indicacao_relations_oferece_it] = useState([]);

    // // get connections data
    const { data } = useQuery(['connections_info', { entityName, entityId }], {
        queryFn: async () => (await axios.get(`${server}entity/${entityName}/${entityId}`)).data,
        retry: false,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (data) {
            _originalEntity({ ...data, my_entity_type: entityName, my_entity_id: entityId });

            _indicacao_relations_recebe_it(data.indicacao_relations_recebe_it);
            _indicacao_relations_oferece_it(data.indicacao_relations_oferece_it);

        } else _originalEntity({ my_entity_type: entityName, my_entity_id: entityId });
    }, [data]);

    const handleDataChange = (entity) => {
        _entity(entity);
    };

    const handleSave = async () => {
        /* save */
        const data = mapForm2Data(entity, form) // prepare information (Renderer)
        data.indicacao_relations_recebe_it = indicacao_relations_recebe_it;
        data.indicacao_relations_oferece_it = indicacao_relations_oferece_it;

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
            url = `${server}entity/${entityId}`;

          /* const { data: response } =  */ await axios({
                method,
                url,
                data,
                config: { headers: { 'Content-Type': 'multipart/form-data' } },
            });

            // console.log(response);

            queryClient.invalidateQueries('connections_info');
            
            if(onSave && typeof onSave === 'function') onSave();

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

    const handleIndicacaoChange = (type, id, field, value) => {
        const _func = type === 'recebe' ? _indicacao_relations_recebe_it : _indicacao_relations_oferece_it;

        _func(currentValue => {
            return currentValue.map(v => {
                if (v.id === id) v[field] = value;
                return v;
            });
        })

        // console.log({ type, id, field, value })
    }

    if (!data) return <></>;


    return (
        <>
            {entity && (
                <div className="page-content">
                    <div className="page-body">
                        <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
                            <div className="p-3">

                                <Renderer
                                    form={form}
                                    view={form_view}
                                    lists={lists}
                                    data={mapData2Form(originalEntity, form)}
                                    onDataChange={handleDataChange}
                                // helpbox={}
                                />

                                <div className="section-header">
                                    <div className="section-title">Relações onde sua iniciativa foi INDICADA</div>
                                </div>
                                <div className="row">
                                    <div className="col-xs-12">

                                        {indicacao_relations_recebe_it?.map(i => <Indicacao key={i.id} type="recebe" data={i} onChange={handleIndicacaoChange} />)}


                                        {indicacao_relations_oferece_it?.map(i => <Indicacao key={i.id} type="oferece" data={i} onChange={handleIndicacaoChange} />)}

                                    </div>
                                </div>

                                <hr className="hr-spacer my-4" />

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
                    </div >
                </div >
            )
            }
        </>
    );
}

function Indicacao({ data, type, onChange }) {

    return (<div className={styles.row_indicacao}>
        {/* [{data.confirmedByOther}] */}

        <div className={`${styles.title} ${styles[type]}`}>{type === 'recebe' ? 'RECEBE' : 'OFERECE'}</div>
        <div className={styles.info}>
            {data.other_organizacao_name?.length && <div className={styles.line}>
                <div className={styles.label}>Organização</div>
                <div>{data.other_organizacao_name}</div>
            </div>}
            <div className={styles.line}>
                <div className={styles.label}>Iniciativa</div>
                <div>{data.other_iniciativa_name}</div>
            </div>
            <div className={styles.line}>
                <div className={styles.label}>Relação</div>
                <div>{data.relacao_name}</div>
            </div>
        </div>
        <div className={styles.reconheco}>
            <div className={styles.resposta}>
                <TextField
                    className="input-select"
                    label="Reconhece esta relação?"
                    value={data.confirmedByOther || 'non'}
                    select
                    onChange={(e) => onChange(type, data.id, 'confirmedByOther', e.target.value)}
                >
                    <MenuItem value={'yes'}>
                        Sim
                    </MenuItem>

                    <MenuItem value={'no'}>
                        Não
                    </MenuItem>
                </TextField>
            </div>
            {data.confirmedByOther === 'no' && <div className={styles.justificativa}>
                <TextField
                    className="input-text"
                    label="Justificativa"
                    value={data.justification || ''}
                    onChange={(e) => onChange(type, data.id, 'justification', e.target.value)}
                />
            </div>}
        </div>
    </div>)
}