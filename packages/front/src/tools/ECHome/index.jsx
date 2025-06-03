/* components */

import Card from '../../components/Card';

/* style */
// import style from './information.module.scss';

export default function ECHomeTab() {

    return (
        <>
            <div className="page-content">
                <div className="page-body">
                    <Card middle headerless>
                        <div className="p-3">
                            [INFO]
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}