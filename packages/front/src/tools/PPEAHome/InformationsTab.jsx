import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';

/* components */

import Card from '../../components/Card';

// import HelpBoxButton from './HelpBoxButton';
// import GetHelpButton from './GetHelpButton';

import FilePlus from '../../components/icons/FilePlus';

import { Renderer } from '../../components/FormRenderer'

import form1 from './form1.yml'
import form1_view from './form1_view.yml'
import lists1 from './lists1.yml'

/* style */
// import style from './information.module.scss';

export default function InformationsTab({ entityId }) {
  /* hooks */
  const { server } = useDorothy();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /* states */
  const [originalEntity, _originalEntity] = useState([]);
  const [entity, _entity] = useState([]);

  /* const [mock_data, _mock_data] = useState({
    "nome": "Prefeitura Municipal de Malacacheta - MG",
    "dificuldades": [
      {
        "value": 1,
        "label": "Envolvimento do poder público"
      },
      {
        "value": 3,
        "label": "Equipe"
      },
      {
        "value": 5,
        "label": "Morosidade na etapa de aprovação"
      },
      {
        "value": 7,
        "label": "Descontinuidade"
      }
    ]
  }); */

  //get policy_data
  const { data } = useQuery(['policy_info', { entityId }], {
    queryFn: async () => (await axios.get(`${server}ppea/${entityId}/draft`)).data,
  });

  useEffect(() => {
    if (!data) return;

    _entity(data);
    _originalEntity(data);

    // console.log(data)
  }, [data]);

  const handleDataChange = (field, value) => {
    _entity(entity => ({
      ...entity,
      [field]: value
    }))
  }

  return (
    <>
      {entity && (
        <div className="page-content">
          <div className="page-body">
            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className="p-3">

                <Renderer
                  form={form1}
                  view={form1_view}
                  lists={lists1}
                  data={entity}
                  onDataChange={handleDataChange}
                />

                <div className="section-header">
                  <div className="section-title"></div>
                  <div className="section-actions">
                    <button className="button-primary" onClick={() => console.log(entity)}> {/* TODO: responsabilidade do Renderer */}
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
      )}
    </>
  );
}