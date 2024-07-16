import { useState, useEffect } from 'react';
import { TextField, Switch, FormGroup, Stack, MenuItem } from '@mui/material';
import Helpbox from '../CMS/helpbox';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import _ from 'lodash';
/* components */

import Card from '../../components/Card';

// import HelpBoxButton from './HelpBoxButton';
// import GetHelpButton from './GetHelpButton';

import { Renderer } from '../PPEAHome/Renderer'

import form1 from '../PPEAHome/form1.yml'
import form1_view from '../PPEAHome/form1_view.yml'

/* style */
import style from './information.module.scss';

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
                <Renderer form={form1} view={form1_view} data={data} onDataChange={handleDataChange} />

              </div>
            </Card>

            {/* <Helpbox content={contentText} onClose={() => _contentText(null)} /> */}
          </div>
        </div>
      )}
    </>
  );
}