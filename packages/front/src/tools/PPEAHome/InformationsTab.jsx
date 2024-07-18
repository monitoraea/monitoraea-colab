import { useState, useEffect } from 'react';
import _ from 'lodash';
/* components */

import Card from '../../components/Card';

// import HelpBoxButton from './HelpBoxButton';
// import GetHelpButton from './GetHelpButton';

import { Renderer } from '../../components/FormRenderer'

import form1 from './form1.yml'
import form1_view from './form1_view.yml'
import lists1 from './lists1.yml'

/* style */
// import style from './information.module.scss';

export default function InformationsTab({ entityId }) {
  const [data, _data] = useState({
    name: 'Prefeitura Municipal de Malacacheta - MG',
  });

  const handleDataChange = (field, value) => {
    _data(data => ({
      ...data,
      [field]: value
    }))
  }

  return (
    <>
      {data && (
        <div className="page-content">
          <div className="page-body">
            <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
              <div className="p-3">

                <Renderer
                  form={form1}
                  view={form1_view}
                  lists={lists1}
                  data={data}
                  onDataChange={handleDataChange}
                />

              </div>
            </Card>

            {/* <Helpbox content={contentText} onClose={() => _contentText(null)} /> */}
          </div>
        </div>
      )}
    </>
  );
}