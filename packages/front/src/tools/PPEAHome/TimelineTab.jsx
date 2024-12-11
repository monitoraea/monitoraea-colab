import { useState, useEffect } from 'react';
import { TextField, Switch, FormGroup, Stack, MenuItem } from '@mui/material';
import Helpbox from '../CMS/helpbox';
import { useDorothy } from 'dorothy-dna-react';
import axios from 'axios';
import _ from 'lodash';
/* components */

import Card from '../../components/Card';

/* style */
import style from './information.module.scss';

export default function TimelineTab({ entityId }) {

    return (
        <>
            <div className="page-content">
                <div className="page-body">
                    <Card middle /*  sx={{ button: { color: 'inherit' } }} */ headerless>
                        <div className="p-3">
                            [LINHA DO TEMPO]
                        </div>
                    </Card>

                    {/* <Helpbox content={contentText} onClose={() => _contentText(null)} /> */}
                </div>
            </div>
        </>
    );
}