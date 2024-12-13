
import styles from './styles.module.scss'

import Logo from '../../images/logo.png'
import Lollipop from '../../images/mj-lollipop.png'
import Arrows from '../../images/mj-v-arrows.png'

export default function MyArea() {

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
                <button>Pedir para colaborar com uma <span>PPEA</span> cadastrada</button>
                <button>Pedir para colaborar com um <span>Projeto ou Ação</span> de EA cadastrada</button>
                <button>Pedir para colaborar com uma iniciativa vinculada ao <span>PPPZCM</span></button>
                <button>Pedir para colaborar uma <span>instância</span> de EA cadastrada</button>
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
                <button>Cadastrar uma nova <span>PPEA</span></button>
                <button>Cadastrar novo <span>Projeto ou Ação</span> de EA</button>
                <button>Cadastrar nova iniciativa vinculada ao <span>PPPZCM</span></button>
                <button>Cadastrar nova <span>instância</span> de EA</button>
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
    </div>)
}