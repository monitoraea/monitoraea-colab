import { useState } from 'react';
import { Renderer } from '../PPEAHome/Renderer'

import form1 from '../PPEAHome/form1.yml'
import form1_view from '../PPEAHome/form1_view.yml'

export default function PPEAHome() {

    const [data, _data] = useState({
        name: 'Ricardo 123',
    });    

    const handleDataChange = (field, value) => {
        _data(data => ({
            ...data,
            [field]: value
        }))
    }

    return (
        <>
            <div className="page width-limiter">
                <div className="page-content">
                    <div className="page-body">
                        <div className="tablebox" style={{ padding: '20px', width: '75%', margin: '0 auto' }}>
                            <h4>Teste com formulário e layout declarativos</h4>
                            <hr />
                            <Renderer form={form1} view={form1_view} data={data} onDataChange={handleDataChange} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}