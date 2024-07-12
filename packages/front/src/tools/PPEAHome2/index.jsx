import FieldRenderer from '../PPEAHome/FieldRenderer'

import form1 from '../PPEAHome/form1.yml'
import form1_view from '../PPEAHome/form1_view.yml'

export default function PPEAHome() {
    return (
        <>
            <div className="page width-limiter">
                <div className="page-content">
                    <div className="page-body">
                        <div className="tablebox" style={{ padding: '20px', width: '75%', margin: '0 auto' }}>
                            <h4>Teste com formulário e layout declarativos</h4>
                            <hr />
                            <Renderer form={form1} view={form1_view} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

function Renderer({ form, view }) {
    return <Element form={form} v={{ type: 'start', elements: view }}/>
}
function Element({ form, v }) {
    if (v.type === 'start') return <>
        {v.elements.map((v, idx) => <Element key={idx} form={form} v={v} />)}
    </>

    if (v.type === 'row') return <div className="row">
        {v.elements.map((v, idx) => <Element key={idx} form={form} v={v} />)}
    </div>

    const field = form.fields.find(f => f.key === v.key);
    return <div className={`col-xs-${v.size}`}>
        <FieldRenderer f={field} />
    </div>
}