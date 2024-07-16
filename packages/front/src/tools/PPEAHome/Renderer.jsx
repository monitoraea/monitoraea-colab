import { useEffect, useState, cloneElement, Fragment } from 'react';
import { TextField, MenuItem } from '@mui/material';
import DatePicker from '../../components/DatePicker';

let modules = {}; // TODO: context?

import { v4 as uuidv4 } from 'uuid';

export function Renderer(props) {
    const { form, view } = props;
    const [imported, _imported] = useState(false)

    useEffect(() => {
        async function doImport() {
            for (let s of form.imports) {
                // console.log(s)
                const module = await import(/* @vite-ignore */s.url);
                // console.log({ module })
                // console.log(module.isEven(1), module.isEven(2), module.isEven(33))
                modules[s.name] = module;
            }
            _imported(true);
        }

        if (form.imports && Array.isArray(form.imports)) doImport();
        else _imported(true);
    }, [form])

    if (!imported) return <></>;

    if (!view) return <BasicRenderer {...props} />
    else return <ViewRenderer {...props} />
}

/*****************************************************************
    Basic Renderer
 *****************************************************************/
function BasicRenderer({ form, showOrphan = false, data, onDataChange }) {
    let inBlock = [];
    // mostrar campos em blocos
    const blocks = <>
        {form.blocks.map(b => {
            const k = b.key || uuidv4();

            return <Block key={k} block={b} data={data}>
                {b.fields.map(f => {
                    inBlock.push(f);
                    const field = form.fields.find(fi => fi.key === f);
                    return <div key={field.key} className='row'>
                        <FieldRenderer blocks={form.blocks || []} f={field} size={field.size} keyRef={field.key} data={data} onDataChange={onDataChange} />
                    </div>
                })}
            </Block>
        })}
    </>;

    // mostrar campos sem blocos
    const otherFields = <>
        {form.fields.filter(f => !inBlock.includes(f.key)).map(f => <div key={f.key} className='row'>
            <FieldRenderer blocks={form.blocks || []} f={f} size={f.size} keyRef={f.key} data={data} onDataChange={onDataChange} />
        </div>)}
    </>

    return <>
        {blocks}
        {!!showOrphan && otherFields}
    </>
}

/*****************************************************************
    View Renderer
 *****************************************************************/

function ViewRenderer({ form, view, data, onDataChange }) {

    return <Element form={form} v={{ type: 'start', elements: view }} data={data} onDataChange={onDataChange} />
}
function Element(props) {
    const { form, v, data, onDataChange } = props;

    if (v.type === 'start') return <>
        {v.elements.map((v, idx) => <Element key={idx} form={form} v={v} data={data} onDataChange={onDataChange} />)}
    </>

    if (v.type === 'row') {
        if (!v.block) return <Row {...props} />
        else {
            const block = form.blocks.find(b => b.key === v.block)
            return <Block block={block} data={data}><Row {...props} /></Block>
        }
    }

    const field = form.fields.find(f => f.key === v.key);
    if (!field) return <></>;
    return <FieldRenderer blocks={form.blocks || []} f={field} size={v.size} keyRef={field.key} data={data} onDataChange={onDataChange} />
}
function Row({ form, v, data, onDataChange }) {
    return <div className="row">
        {v.elements.map((v, idx) => <Element key={idx} form={form} v={v} data={data} onDataChange={onDataChange} />)}
    </div>
}

/*****************************************************************
    Field Renderer
 *****************************************************************/

export function FieldRenderer({ f, size, keyRef, blocks, data, onDataChange }) {
    const [doShow, _doShow] = useState(false);

    useEffect(() => {
        let show = true;

        // field rules
        if (!!f.show?.function) {
            // console.log(data[f.show.function.params[0].value_of])
            show = modules[f.show.function.module]?.[f.show.function.name].call(this, data[f.show.function.params[0].value_of]);
        } else if (!!f.show?.target) {
            // console.log(f.show.target.key, data[f.show.target.key], f.show.target.value)
            // TODO: can be an array
            show = (data[f.show.target.key] === f.show.target.value);

        }

        // TODO: dá para juntar as verificações de regras de campos soltos, campos de blocos e blocos!!!

        // block rules
        const block = fieldInBlock(keyRef, blocks);
        // TODO: TODO acima, pois todas as regras devem ser implementadas para campos de bloco
        if (block && block.show?.target) show = (data[block.show.target.key] === block.show.target.value);

        _doShow(show);

    }, [f, blocks, data])

    const onChange = field => value => {
        onDataChange(field, value);
    }

    if (!doShow) return null;

    let Component;

    if (f.type === 'options') Component = <OptionsField f={f} dataValue={data?.[keyRef]} onChange={onChange(keyRef)} />
    else if (f.type === 'yearpicker') Component = <DatePickerField f={f} dataValue={data?.[keyRef]} onChange={onChange(keyRef)} />
    else Component = <StringField f={f} dataValue={data?.[keyRef]} onChange={onChange(keyRef)} />

    return <div className={`col-xs-${size}`}>
        {Component}
    </div>


}

/*****************************************************************
    Field components
 *****************************************************************/

function StringField({ f, dataValue, onChange }) {
    const [value, _value] = useState('');

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <TextField
        className="input-text"
        label={f.title}
        value={value}
        onChange={(e) => onChange(e.target.value)}
    />
}

function OptionsField({ f, dataValue, onChange }) {
    const [value, _value] = useState('none');

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <TextField
        className="input-select"
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

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <DatePicker
        className="input-datepicker"
        label={f.title}
        value={value}
        onChange={onChange}
        views={['year']}
        inputFormat="yyyy"
    />
}

/*****************************************************************
    Aux Components
 *****************************************************************/

function Block({ block, data, children }) {
    let show = true;
    if (block.show?.target) show = (data[block.show.target.key] === block.show.target.value);

    if (!show) return null;

    if (!block.title) return <>{children}</>;

    return <section id={block.key}>
        <div className="section-header">
            <div className="section-title">{block.title}</div>
        </div>
        <>{children}</>
    </section>
}

/*****************************************************************
    Aux functions
 *****************************************************************/

function fieldInBlock(keyRef, blocks) {
    let block = false;

    // console.log(keyRef, blocks)
    for (let b of blocks) {
        // console.log({ b })
        const found = b.fields.find(key => key === keyRef);
        if (found) {
            block = b;
            break;
        }
    }

    return block;
}