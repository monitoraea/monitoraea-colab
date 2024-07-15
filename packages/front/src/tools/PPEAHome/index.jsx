import { useState } from 'react'
import { BasicRenderer } from './Renderer'

import form1 from './form1.yml'

export default function PPEAHome() {
    const [data, _data] = useState({
        name: 'Ricardo',
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
                            <h4>Teste com formulário declarativo</h4>
                            <hr />
                            <BasicRenderer form={form1} data={data} onDataChange={handleDataChange} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}