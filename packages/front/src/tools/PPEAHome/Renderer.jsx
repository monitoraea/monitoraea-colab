import { useEffect, useState } from 'react';
import { TextField, MenuItem } from '@mui/material';
import DatePicker from '../../components/DatePicker';

let modules = {};

export function BasicRenderer({ form, data, onDataChange }) {

    const [imported, _imported] = useState(false)

    useEffect(() => {
        async function doImport() {
            for (let s of form.imports) {
                console.log(s)
                const module = await import(/* @vite-ignore */s.url);
                // console.log({ module })
                // console.log(module.isEven(1), module.isEven(2), module.isEven(33))
                modules[s.name] = module;
            }
            _imported(true);
        }

        doImport()
    }, [form])

    if(!imported) return <></>;
    
    return <>
        {form.fields.map(f => <div key={f.key} className='row'>
            <div className={`col-xs-${f.size}`}>
                <FieldRenderer f={f} keyRef={f.key} data={data} onDataChange={onDataChange} />
            </div>
        </div>)}
    </>
}


export function Renderer({ form, view, data, onDataChange }) {
    const [imported, _imported] = useState(false)

    useEffect(() => {
        async function doImport() {
            for (let s of form.imports) {
                console.log(s)
                const module = await import(/* @vite-ignore */s.url);
                // console.log({ module })
                // console.log(module.isEven(1), module.isEven(2), module.isEven(33))
                modules[s.name] = module;
            }
            _imported(true);
        }

        doImport()
    }, [form])

    if(!imported) return <></>;

    return <Element form={form} v={{ type: 'start', elements: view }} data={data} onDataChange={onDataChange} />
}
function Element({ form, v, data, onDataChange }) {
    if (v.type === 'start') return <>
        {v.elements.map((v, idx) => <Element key={idx} form={form} v={v} data={data} onDataChange={onDataChange} />)}
    </>

    if (v.type === 'row') return <div className="row">
        {v.elements.map((v, idx) => <Element key={idx} form={form} v={v} data={data} onDataChange={onDataChange} />)}
    </div>

    const field = form.fields.find(f => f.key === v.key);
    return <div className={`col-xs-${v.size}`}>
        <FieldRenderer f={field} keyRef={field.key} data={data} onDataChange={onDataChange} />
    </div>
}

export function FieldRenderer({ f, keyRef, data, onDataChange }) {
    const [doShow, _doShow] = useState(false);

    useEffect(()=>{
        // rules
        if (!!f.show) {
            // console.log(data[f.show.function.params[0].value_of])
            _doShow(modules[f.show.function.module]?.[f.show.function.name].call(this, data[f.show.function.params[0].value_of]));           
        } else _doShow(true);
    },[f, data])

    const onChange = field => value => {
        onDataChange(field, value);
    }

    if(!doShow) return <></>;

    if (f.type === 'options') return <OptionsField f={f} dataValue={data?.[keyRef]} onChange={onChange(keyRef)} />

    if (f.type === 'yearpicker') return <DatePickerField f={f} dataValue={data?.[keyRef]} onChange={onChange(keyRef)} />
    
    return <StringField f={f} dataValue={data?.[keyRef]} onChange={onChange(keyRef)} />
}

function StringField({ f, dataValue, onChange }) { 
    const [value, _value] = useState('');

    useEffect(()=>{
        if(!!dataValue) _value(dataValue);
    },[dataValue])

    return <TextField
        className="input-text"
        label={f.title}
        value={value}
        onChange={(e) => onChange(e.target.value)}
    />
}

function OptionsField({ f, dataValue, onChange }) {
    const [value, _value] = useState('none');

    useEffect(()=>{
        if(!!dataValue) _value(dataValue);
    },[dataValue])

    return <TextField
        className="input-text"
        label={f.title}
        value={value}
        select
        onChange={(e) => onChange(e.target.value)}
    >
        <MenuItem value="none">Não respondido</MenuItem>
        {f.options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </TextField>
}

function DatePickerField({ f, dataValue, onChange }) {
    const [value, _value] = useState(new Date());

    useEffect(()=>{
        if(!!dataValue) _value(dataValue);
    },[dataValue])

    return <DatePicker
        className="input-datepicker"
        label={f.title}
        value={value}
        onChange={onChange}
        views={['year']}
        inputFormat="yyyy"
    />
}