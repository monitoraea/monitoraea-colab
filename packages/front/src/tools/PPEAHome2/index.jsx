import { useState } from 'react';
import { Renderer } from '../../components/FormRenderer'

import form1 from '../PPEAHome/form1.yml'
import lists1 from '../PPEAHome/lists1.yml'

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
                            <h4>Teste com formulário sem layout (view)</h4>
                            <hr />
                            <Renderer form={form1} data={data} lists={lists1} onDataChange={handleDataChange} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}