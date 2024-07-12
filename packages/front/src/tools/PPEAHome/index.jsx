import FieldRenderer from './FieldRenderer'

import form1 from './form1.yml'

export default function PPEAHome() {
    return (
        <>
            <div className="page width-limiter">
                <div className="page-content">
                    <div className="page-body">
                        <div className="tablebox" style={{ padding: '20px', width: '75%', margin: '0 auto' }}>
                            <h4>Teste com formulário declarativo</h4>
                            <hr />
                            <Renderer form={form1} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

function Renderer({ form }) {
    return <>
        {form.fields.map(f => <div key={f.key} className='row'>
            <div className={`col-xs-${f.size}`}>
                <FieldRenderer f={f} />
            </div>
        </div>)}
    </>
}