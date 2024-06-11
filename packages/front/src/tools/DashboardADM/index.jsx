import { useState, Fragment } from 'react';

import { PageTitle } from '../../components/PageTitle/PageTitle';

import VisualizationsTabs from './VisualizationsTabs';

// import { useOptionsStore } from '../../stores/visualizationsStores';

import { ToolMenuContainer } from 'dorothy-dna-react';
import SubMenuRenderer from '../../components/SubMenuRenderer';

import { INDICs } from '../../indics';

import Indic from './Indic';

const Home = () => {
    // const { type } = useOptionsStore();

    const [lae_id, _lae_id] = useState(1);
    const [filters, _filters] = useState([]);

    /* useEffect(()=>{
        console.log(filters, prepareFilters(filters))
    },[filters]) */

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
                <VisualizationsTabs
                    lae_id={lae_id}
                    onLaeChange={_lae_id}
                    onFiltersChange={_filters}
                />

                {!!lae_id && <>
                    {INDICs.filter(indic => indic.lae_id === lae_id).map(indic => <Fragment key={`${lae_id}_${indic.id}`}>

                        <Indic
                            lae_id={lae_id}
                            indic={indic}
                            filters={filters}
                        />
                    </Fragment>)}
                </>}
            </div>
        </div>
    </div >);
};

export default Home;