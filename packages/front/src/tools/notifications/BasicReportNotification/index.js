import React, { useState, useEffect } from 'react';

import dayjs from 'dayjs';
import { Box, Tabs, Tab } from '@mui/material';
import robot from '../../../images/robot.png';

import styles from './styles.module.scss';

import { useQuery } from 'react-query';
import axios from 'axios';

import { useDorothy, useRouter } from 'dorothy-dna-react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TableBody,
    TableRow,
} from '@mui/material';

export default function BasicReportNotification({ data }) {
    const { server } = useDorothy();
    // const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [date, _date] = useState('');
    const [dateShort, _dateShort] = useState('');
    const [open, _open] = useState(false);

    const [tab, _tab] = useState('projects');

    const [projectsCounter, _projectsCounter] = useState(0);
    const [publishedCounter, _publishedCounter] = useState(0);
    const [indicationsCounter, _indicationsCounter] = useState(0);
    const [institutionsCounter, _institutionsCounter] = useState(0);

    const { data: reportData } = useQuery(['report_data', {
        reportId: data.content.reportId,
    }], {
        queryFn: async () => (await axios.get(`${server}adm/report/${data.content.reportId}`)).data,
        enabled: !!data.content.reportId,
    });

    useEffect(() => {
        if (!data) return;

        _date(dayjs(data.createdAt).format('DD/MM/YYYY HH:mm'));
        _dateShort(dayjs(data.createdAt).format('DD/MM/YYYY'));
    }, [data]);

    useEffect(()=>{
        if(!!reportData) {
            _projectsCounter(reportData.content.projects.length);
            _publishedCounter(reportData.content.published.length);
            _indicationsCounter(reportData.content.indications.length);
            _institutionsCounter(reportData.content.institutions.length);
        }

    },[reportData])

    return (<>
        <Box
            sx={{
                padding: '24px',
                marginTop: '48px',
                backgroundColor: 'white',
                position: 'relative',
                zIndex: '1',
                minHeight: '100px',
                width: '100%',
                boxShadow: '0px 0px 8px #0000001A',
                borderRadius: '8px',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex' }}>
                    <Box
                        as="img"
                        src={robot}
                        alt="salve"
                        sx={{ borderRadius: '50%', width: '48px', height: '48px' }}
                    />
                    <Box sx={{ marginLeft: '8px' }}>
                        <Box sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                            Relatório Administrativo
                        </Box>
                        <Box sx={{ fontSize: '14px' }}>{date}</Box>
                    </Box>
                </Box>
                {/* <Box>
            <ArrowRightCircle size="32px" />
          </Box> */}
            </Box>
            <Box sx={{ marginTop: '8px' }}>
                {/* {JSON.stringify(data)} */}

                <div className={styles.mainDiv}>
                    <div>
                        <div>
                            {data && data.content.result === 'success' && <>Um novo relatório administrativo foi emitido</>}
                            {data && data.content.result === 'error' && <div>
                                <div>Houve um problema na emissão do relatório administrativo:</div>
                                <div className={styles.error}>{data.content.error}</div>
                            </div>}
                        </div>
                    </div>
                    {data && data.content.result === 'success' && <div className={styles.actions}>

                        <button className='button-primary' size="small" onClick={() => _open(true)}>Abrir</button>

                    </div>}
                </div>
            </Box>
        </Box>

        <Dialog
            open={open}
            onClose={() => _open(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            fullWidth
            maxWidth="md"
        >
            <DialogTitle id="alert-dialog-title">Relatório de {dateShort}</DialogTitle>
            <DialogContent id="alert-dialog-description">
                <div className='row'>
                    <div className="col-md-12">
                        {reportData && <>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <div className={styles['ptabs-content']}>
                                    <Tabs className={styles['ptabs-tabs']} value={tab} onChange={(e) => _tab(e.target.id)} aria-label="basic tabs example">
                                        <Tab
                                            disableRipple
                                            label="Novas iniciativas"
                                            {...a11yProps('projects', projectsCounter)}
                                            className={`${styles.indicator} ${projectsCounter < 10 && styles['fixed-size']
                                                }`}
                                        />
                                        <Tab
                                            disableRipple
                                            label="Iniciativas publicadas"
                                            {...a11yProps('published', publishedCounter)}
                                            className={`${styles.indicator} ${publishedCounter < 10 && styles['fixed-size']
                                                }`}
                                        />
                                        <Tab
                                            disableRipple
                                            label="Iniciativas indicadas"
                                            {...a11yProps('indications', indicationsCounter)}
                                            className={`${styles.indicator} ${indicationsCounter < 10 && styles['fixed-size']
                                                }`}
                                        />
                                        <Tab
                                            disableRipple
                                            label="Novas instituições"
                                            {...a11yProps('institutions', institutionsCounter)}
                                            className={`${styles.indicator} ${institutionsCounter < 10 && styles['fixed-size']
                                                }`}
                                        />
                                    </Tabs>
                                </div>
                            </Box>

                            {tab === 'projects' && <Projects elements={reportData.content.projects} />}
                            {tab === 'published' && <PublishedProjects elements={reportData.content.published} />}
                            {tab === 'indications' && <Indications elements={reportData.content.indications} />}
                            {tab === 'institutions' && <Institutions elements={reportData.content.institutions} />}

                        </>}
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => _open(false)} autoFocus>
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    </>)
}

function Projects({ elements }) {
    const { changeRoute } = useRouter();

    return (<>
        <div className="tablebox">
            <div className="tbox-body">
                <table className="tbox-table">
                    <thead>
                        <tr>
                            <th>Quando</th>
                            <th>Nome</th>
                        </tr>
                    </thead>

                    <TableBody>
                        {elements.map(item => <TableRow key={item.id}>
                            <td>{dayjs(item.when).format('DD/MM/YYYY')}</td>
                            <td><span className={styles.community} onClick={() => changeRoute({ community: item.community_id })}>{item.nome}</span></td>
                        </TableRow>)}
                    </TableBody>

                </table>
            </div>
        </div>
    </>)
}
function PublishedProjects({ elements }) {
    const { changeRoute } = useRouter();

    return (<>
        <div className="tablebox">
            <div className="tbox-body">
                <table className="tbox-table">
                    <thead>
                        <tr>
                            <th>Quando</th>
                            <th>Nome</th>
                        </tr>
                    </thead>

                    <TableBody>
                        {elements.map(item => <TableRow key={item.id}>
                            <td>{dayjs(item.when).format('DD/MM/YYYY')}</td>
                            <td><span className={styles.community} onClick={() => changeRoute({ community: item.community_id })}>{item.nome}</span></td>
                        </TableRow>)}
                    </TableBody>

                </table>
            </div>
        </div>
    </>)
}
function Indications({ elements }) {
    const { changeRoute } = useRouter();

    return (<>
        <div className={`tablebox ${styles.maxh}`}>
            <div className="tbox-body">
                <table className="tbox-table">
                    <thead>
                        <tr>
                            <th>Quando</th>
                            <th>Nome</th>
                            <th>Nome do contato</th>
                            <th>E-mail do contato</th>
                            <th>Telefone do contato</th>
                            <th>Site</th>
                        </tr>
                    </thead>

                    <TableBody>
                        {elements.map(item => <TableRow key={item.id}>
                            <td>{dayjs(item.when).format('DD/MM/YYYY')}</td>
                            {!item.community_id && <td>{item.name}</td>}
                            {!!item.community_id && <td><span className={styles.community} onClick={() => changeRoute({ community: item.community_id })}>{item.name}</span></td>}
                            <td>{item.contact_name}</td>
                            <td>{item.contact_email}</td>
                            <td>{item.contact_phone}</td>
                            <td>{item.website}</td>
                        </TableRow>)}
                    </TableBody>

                </table>
            </div>
        </div></>)
}
function Institutions({ elements }) {
    return (<>
        <div className="tablebox">
            <div className="tbox-body">
                <table className="tbox-table">
                    <thead>
                        <tr>
                            <th>Quando</th>
                            <th>Nome</th>
                        </tr>
                    </thead>

                    <TableBody>
                        {elements.map(item => <TableRow key={item.id}>
                            <td>{dayjs(item.when).format('DD/MM/YYYY')}</td>
                            <td>{item.nome}</td>
                        </TableRow>)}
                    </TableBody>

                </table>
            </div>
        </div>
    </>)
}



function a11yProps(index, problemCounter = '') {
    return {
        id: index,
        'aria-controls': `simple-tabpanel-${index}`,
        value: index,
        'data-problems': problemCounter,
    };
}