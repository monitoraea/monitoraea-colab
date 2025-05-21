import { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { useDorothy, useRouter } from 'dorothy-dna-react';
import axios from 'axios';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { useSnackbar } from 'notistack';

import { useMutation } from 'react-query';

import styles from './styles.module.scss'

import Logo from '../../images/logo.png'
import Lollipop from '../../images/mj-lollipop.png'
import Arrows from '../../images/mj-v-arrows.png'

const mapPerspective = {
    //key: ['TEXT', 'TOOL URL', 'NETWORK PATH']
    ppea: ['Políticas Públicas', 'politica', 'rede_ppea'],
    project: ['Iniciativa', 'projeto', 'rede_zcm'],
    commission: ['Comissão', 'comissao', 'rede_ciea'],
    cne: ['Centro', 'cne', 'rede_cne'],
    iniciativa: ['Iniciativa não governamental', 'iniciativa', 'rede_iniciativas'],
}

export default function MyArea() {

    const { server } = useDorothy();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [showNIDialog, _showNIDialog] = useState(false);

    const mutation = {
        create: useMutation(({name, perspective}) => axios.post(`${server}${perspective}`, { nome: name }), {
            onSuccess: () => {
                //
            },
        }),
        enterNetwork: useMutation((perspective) => axios.post(`${server}${perspective}/enter_in_network`), {
            onSuccess: () => {
                //
            },
        }),
    };

    const handleNInitiative = async (name, perspective) => {
        if (!name || !name.length) return;

        const snackKey = enqueueSnackbar('Criando a iniciativa..', {
            persist: true,
            anchorOrigin: {
                vertical: 'top',
                horizontal: 'right',
            },
        });

        /* save */
        try {
            const { data } = await mutation.create.mutateAsync({name, perspective});

            closeSnackbar(snackKey);

            enqueueSnackbar('Iniciativa gravada com sucesso!', {
                variant: 'success',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });

            _showNIDialog(false);
            window.location = `/colabora/${mapPerspective[perspective][1]}/${data.communityId}`;
        } catch (error) {
            closeSnackbar(snackKey);

            console.error(error);

            enqueueSnackbar('Erro ao gravar a iniciativa!', {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        }
    };

    const handleAsk = (perspective) => async () => {
        const snackKey = enqueueSnackbar(`Acessando a rede de ${mapPerspective[perspective][0]}..`, {
            persist: true,
            anchorOrigin: {
                vertical: 'top',
                horizontal: 'right',
            },
        });

        /* save */
        try {
            const { data } = await mutation.enterNetwork.mutateAsync(perspective);

            closeSnackbar(snackKey);

            _showNIDialog(false);
            window.location = `/colabora/${mapPerspective[perspective][2]}/${data.communityId}`;
        } catch (error) {
            closeSnackbar(snackKey);

            console.error(error);

            enqueueSnackbar(`Erro ao acessar a rede de ${mapPerspective[perspective][0]}!`, {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'right',
                },
            });
        }
    }

    const goTo = (where) => () => {
        document.getElementById(where).scrollIntoView({ behavior: "smooth" })
    }

    return (<div className={styles['my-area']}>
        <div className={styles['header-title']}>
            <div className={styles.journey}>Sua jornada no</div>
            <div className={styles.logo}><img src={Logo} /></div>
        </div>

        <div className={styles.bar}></div>

        <div className={`${styles['menu']} ${styles.first} ${styles['width-limiter']}`}>

            <div onClick={goTo('m1')} className={`${styles.banner} ${styles.clickable}`}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero <br /><span>COLABORAR</span><br />
                        com alguma iniciativa<br />
                        ou instância<br />
                        <span>JÁ CADASTRADA</span>
                    </div>
                </div>
                <div className={styles.arrows}><img src={Arrows} /></div>
            </div>

            <div onClick={goTo('m2')} className={`${styles.banner} ${styles.clickable}`}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero <span>CADASTRAR</span><br />
                        uma<br />
                        <span>NOVA</span><br />
                        iniciativa
                    </div>
                </div>
                <div className={styles.arrows}><img src={Arrows} /></div>
            </div>

            <div onClick={goTo('m3')} className={`${styles.banner} ${styles.clickable}`}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero me<br />
                        tornar um <span>APOIADOR</span><br />
                        do Sistema MonitoraEA
                    </div>
                </div>
                <div className={styles.arrows}><img src={Arrows} /></div>
            </div>

            <div onClick={goTo('m4')} className={`${styles.banner} ${styles.clickable}`}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero<br />
                        <span>CONTRIBUIR</span><br />
                        com o <span>APRIMORAMENTO</span><br />
                        do Sistema MonitoraEA
                    </div>
                </div>
                <div className={styles.arrows}><img src={Arrows} /></div>
            </div>
        </div>

        <div className={styles['header-title']}>
            <div className={styles.journey}>Sua jornada no</div>
            <div className={styles.logo}><img src={Logo} /></div>
        </div>

        <div className={styles.bar}></div>

        <div id="m1" className={`${styles['menu']} ${styles['width-limiter']}`}>

            <div className={styles.banner}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero <br /><span>COLABORAR</span><br />
                        com alguma iniciativa<br />
                        ou instância<br />
                        <span>JÁ CADASTRADA</span>
                    </div>
                </div>
            </div>

            <div className={styles.options}>
                <button onClick={handleAsk('ppea')}>Colaborar com uma <span>Políticas Públicas de EA (PPEA)</span> cadastrada</button>
                <button onClick={handleAsk('iniciativa')}>Colaborar com uma <span>Iniciativa Não Governamental</span> cadastrada</button>
                <button onClick={handleAsk('project')}>Colaborar com um Projeto ou Ações vinculados ao  <span>PPPZCM</span> cadastrada</button>
                <button onClick={handleAsk('commission')}>Colaborar com uma <span>Instância</span> de Acompanhamento e Controle Social de EA cadastrada</button>
                <button onClick={handleAsk('cne')}>Colaborar um <span>Centro de Educação</span> e Cooperação Socioambiental cadastrado</button>
            </div>
        </div>

        <div className={styles['header-title']}>
            <div className={styles.journey}>Sua jornada no</div>
            <div className={styles.logo}><img src={Logo} /></div>
        </div>

        <div className={styles.bar}></div>

        <div id="m2" className={`${styles['menu']} ${styles['width-limiter']}`}>

            <div className={styles.banner}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero <span>CADASTRAR</span><br />
                        uma<br />
                        <span>NOVA</span><br />
                        iniciativa
                    </div>
                </div>
            </div>

            <div className={styles.options}>
                <button onClick={() => _showNIDialog('ppea')}>Cadastrar uma nova <span>Políticas Públicas de EA (PPEA)</span></button>
                <button onClick={() => _showNIDialog('iniciativa')}>Cadastrar uma nova <span>Iniciativa Não Governamental</span></button>
                <button onClick={() => _showNIDialog('project')}>Cadastrar um novo Projeto ou Ação vinculados ao  <span>PPPZCM</span></button>
                <button onClick={() => _showNIDialog('commission')}>Cadastrar uma nova <span>Instância</span> de Acompanhamento e Controle Social de EA</button>
                <button onClick={() => _showNIDialog('cne')}>Cadastrar um novo <span>Centro de Educação</span> e Cooperação Socioambiental </button>
            </div>
        </div>

        <div className={styles['header-title']}>
            <div className={styles.journey}>Sua jornada no</div>
            <div className={styles.logo}><img src={Logo} /></div>
        </div>

        <div className={styles.bar}></div>

        <div id="m3" className={`${styles['menu']} ${styles['width-limiter']}`}>

            <div className={styles.banner}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero me<br />
                        tornar um <span>APOIADOR</span><br />
                        do Sistema MonitoraEA
                    </div>
                </div>
            </div>

            <div className={styles.options}>
                <button>Conheça a política de Colaboração e Apoio do Sistema MonitoraEA</button>
                <button className={styles.outline}>FORMULÁRIO DE COLABORAÇÃO</button>
            </div>
        </div>

        <div className={styles['header-title']}>
            <div className={styles.journey}>Sua jornada no</div>
            <div className={styles.logo}><img src={Logo} /></div>
        </div>

        <div className={styles.bar}></div>

        <div id="m4" className={`${styles['menu']} ${styles['width-limiter']}`}>

            <div className={styles.banner}>
                <div className={styles.lollipop}><img src={Lollipop} /></div>
                <div className={styles['text-box']}>
                    <div>
                        Quero<br />
                        <span>CONTRIBUIR</span><br />
                        com o <span>APRIMORAMENTO</span><br />
                        do Sistema MonitoraEA
                    </div>
                </div>
            </div>

            <div className={styles.options}>
                <button>Relate bugs e nos ajude a corrigí-los</button>
                <button>Proponha novos recursos e ajude a moldar o futuro do sistema</button>
            </div>
        </div>

        <NewInitiativeDialog open={!!showNIDialog} type={showNIDialog} onCreate={handleNInitiative} onClose={() => _showNIDialog(false)} />
    </div>)
}

function NewInitiativeDialog({ open, type, onCreate, onClose }) {
    const [name, _name] = useState('');

    useEffect(() => {
        if (open) _name('');
    }, [open]);

    return (
        <div>
            <Dialog
                open={open}
                onClose={onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="alert-dialog-title">Nova iniciativa de {mapPerspective[type || 'ppea'][0]}</DialogTitle>
                <DialogContent>
                    <div className="row">
                        <div className="col-xs-12">
                            <TextField
                                className="input-text"
                                label="Nome da nova iniciativa"
                                value={name}
                                onChange={e => _name(e.target.value)}
                            />
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose()} autoFocus>
                        Cancelar
                    </Button>
                    <button className="button-primary" onClick={() => onCreate(name, type)}>
                        Criar
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}