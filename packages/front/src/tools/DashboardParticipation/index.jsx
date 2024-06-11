import { PageTitle } from '../../components/PageTitle/PageTitle';

import { ToolMenuContainer } from 'dorothy-dna-react';
import SubMenuRenderer from '../../components/SubMenuRenderer';

import NumberOfMembers from './NumberOfMembers';
import NumberOfMembersRank from './NumberOfMembersRank';

import styles from './styles.module.scss';

const DashboardParticipation = () => {

    return (<div className='page' id="adm-home">
        <div className="page-header">
            <PageTitle title="Painel" />
        </div>
        <div className="page-content">
            <div className="page-sidebar">
                <div className="sidebar-body">
                    <ToolMenuContainer submenu>
                        <SubMenuRenderer analytics={true} />
                    </ToolMenuContainer>
                </div>
            </div>
            <div className="page-body">
                <div className={`${styles.visualizations_grid} ${styles.question}`}>
                    <NumberOfMembers />
                    <NumberOfMembersRank />
                </div>
            </div>
        </div>
    </div >);
};

export default DashboardParticipation;