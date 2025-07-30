import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useRouter, useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';

/* components */

import Card from '../../components/Card';

import FilePlus from '../../components/icons/FilePlus';

import { Renderer, mapData2Form, getFormData } from '../../components/FormRenderer'

import form from '../../../../../forms/educom_clima/form1.yml'
import form_view from '../../../../../forms/educom_clima/form1_view.yml'
import lists from '../../../../../forms/educom_clima/lists1.yml'

/* style */
import style from './information-manager.module.scss';

export default function InformationsManageTab({ entityId }) {
    const { changeRoute } = useRouter();

    /* hooks */
    const { server } = useDorothy()
    const queryClient = useQueryClient()
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()

    /* states */
    const [entity, _entity] = useState({})
    const [files, _files] = useState({})

    const [originalEntity, _originalEntity] = useState({})

    //get policy_data
    const { data } = useQuery(['policy_info', { entityId }], {
        queryFn: async () => (await axios.get(`${server}educom_clima/${entityId}/draft/info`)).data,
        enabled: !!entityId && entityId !== 'novo',
        refetchOnWindowFocus: false,
    })

    useEffect(() => {
        if (data) _originalEntity(data)
    }, [data])

    const handleDataChange = (entity, files) => {
        _entity(entity)
        _files(files)
    }

    const handleCancel = () => {
        changeRoute({ params: [] })
    }

    const handleSave = async () => {

        /* save */
        const data = getFormData(form, entity, files) // prepare information (Renderer)

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

            if (entityId !== 'novo') {

                /* edit */
                method = 'put';
                url = `${server}educom_clima/${entityId}/draft`;
            } else {

                /* add */
                method = 'post';
                url = `${server}educom_clima/draft`;
            }

            await axios({
                method,
                url,
                data,
                config: { headers: { 'Content-Type': 'multipart/form-data' } },
            });

            // console.log(response);

            queryClient.invalidateQueries('educom_list')
            // queryClient.invalidateQueries('policy_analysis')

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
    }

    return (
        <>
            {entity && (
                <div className="page-content">
                    <div className="page-body">
                        <Card middle headerless>
                            <div className="p-3">

                                <div className={`section-header ${style['special-section-header']}`}>
                                    <div className="section-title"></div>
                                    <div className={`section-actions ${style.action}`}>
                                        <button className="button-outline" onClick={handleCancel}>
                                            Cancelar
                                        </button>
                                        <button className="button-primary" onClick={handleSave}>
                                            <FilePlus></FilePlus>
                                            Gravar
                                        </button>
                                    </div>
                                </div>

                                <Renderer
                                    form={form}
                                    view={form_view}
                                    lists={lists}
                                    data={mapData2Form(originalEntity, form, lists)}
                                    /* TODO: problems={problems} */
                                    onDataChange={handleDataChange}
                                />

                                <div className="section-header">
                                    <div className="section-title"></div>
                                    <div className={`section-actions ${style.action}`}>
                                        <button className="button-outline" onClick={handleCancel}>
                                            Cancelar
                                        </button>
                                        <button className="button-primary" onClick={handleSave}>
                                            <FilePlus></FilePlus>
                                            Gravar
                                        </button>
                                    </div>
                                </div>

                            </div>

                        </Card>

                    </div>
                </div>
            )}
        </>
    );
}