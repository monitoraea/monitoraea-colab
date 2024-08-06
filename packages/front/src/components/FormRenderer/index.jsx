import { useEffect, useState, cloneElement } from 'react';
import { TextField, MenuItem, Autocomplete, Chip, FormGroup, FormControl, FormLabel, FormControlLabel, Checkbox } from '@mui/material';
import DatePicker from '../DatePicker';

let context_modules = {}; // TODO: context? 
let context_lists = {}; // TODO: context? 

import { v4 as uuidv4 } from 'uuid';

import styles from './styles.module.scss'

export function Renderer(props) {
    const { form, view, data, lists } = props;
    const [imported, _imported] = useState(false)
    const [imported_lists, _imported_lists] = useState(false)
    const [imported_script, _imported_script] = useState(false)
    const [preparedData, _preparedData] = useState({});

    useEffect(() => {
        async function doImport() {
            // scripts
            for (let s of form.imports.filter(i => i.type === 'script')) {
                // console.log(s)
                const module = await import(/* @vite-ignore */s.url);
                // console.log({ module })
                // console.log(module.isEven(1), module.isEven(2), module.isEven(33))
                context_modules[s.key] = module;
            }

            _imported_script(true);
        }

        if (form.imports && Array.isArray(form.imports)) doImport();
        else _imported_script(true);

    }, [form])

    useEffect(() => {
        if (!!lists) context_lists = { ...context_lists, property: lists.lists }
        _imported_lists(true)
    }, [lists])

    useEffect(() => {
        _imported(true)
    }, [imported_script, imported_lists])

    useEffect(() => {
        // defaults // TODO: and for iterated fields?

        let pData = { ...data };
        for (let f of form.fields.filter(f => f.default !== undefined)) {
            if (!pData[f.key]) pData[f.key] = f.default;
        }

        _preparedData(pData);
    }, [form, data])

    if (!imported) return <></>;

    if (!view) return <BasicRenderer {...props} data={preparedData} />
    else return <ViewRenderer {...props} data={preparedData} />
}

/*****************************************************************
    Basic Renderer
 *****************************************************************/
function BasicRenderer({ form, showOrphans = false, data, onDataChange }) {
    let blocks, otherFields = [];

    if (!form.blocks) {

        blocks = <>
            {form.fields.map(f => <div key={f.key} className='row'>
                <FieldRenderer blocks={form.blocks || []} f={f} size={f.size} keyRef={f.key} data={data} onDataChange={onDataChange} />
            </div>)}
        </>

    } else {

        let inBlock = [];
        // mostrar campos em blocos
        blocks = <>
            {form.blocks.map(b => {
                const k = b.key || uuidv4();

                return <Block key={k} block={b} data={data}>
                    {b.elements.map(f => {
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
        otherFields = <>
            {form.fields.filter(f => !inBlock.includes(f.key)).map(f => <div key={f.key} className='row'>
                <FieldRenderer blocks={form.blocks || []} f={f} size={f.size} keyRef={f.key} data={data} onDataChange={onDataChange} />
            </div>)}
        </>
    }

    return <>
        {blocks}
        {!!showOrphans && otherFields}
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

    if(v.type === 'separator') {
        return <hr className="hr-spacer my-4" />;
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
            show = context_modules[f.show.function.module]?.[f.show.function.name].call(this, data[f.show.function.params[0].value_of]);
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

    const dataValue = data?.[keyRef];

    if (f.type === 'label') Component = <Label f={f} />
    else if (f.type === 'read_only') Component = <ReadOnly f={f} dataValue={dataValue} />
    else if (f.type === 'options') Component = <OptionsField f={f} dataValue={dataValue} onChange={onChange(keyRef)} />
    else if (f.type === 'yearpicker') Component = <DatePickerField f={f} dataValue={dataValue} onChange={onChange(keyRef)} />
    else if (f.type === 'multi_autocomplete') Component = <MultiAutocompleteField
        f={f}
        tag={!!f.tag}
        dataValue={dataValue}
        onChange={onChange(keyRef)}
    />
    else Component = <StringField integer={f.type === 'integer'} multiline={f.type === 'textarea'} rows={f.rows} f={f} dataValue={dataValue} onChange={onChange(keyRef)} />

    if (f.iterate) {
        if (!data[f.iterate.target]) return <></>;

        let iteration = [];
        for (let index = 0; index < data[f.iterate.target]; index++) {
            const IterateElement = cloneElement(Component, { index });
            iteration.push(<div className='row' key={`${f.key}.${index}`}>
                <div className={`col-xs-${size}`}>
                    {IterateElement}
                </div>
            </div>);
        }

        return <div className={`col-xs-12`}>
            {iteration}
        </div>;
    } else return <div className={`col-xs-${size}`}>
        {Component}
    </div>


}

/*****************************************************************
    Field components
 *****************************************************************/

function Label({ f, index }) {
    return <>{f.title.replace('%index%', index + 1)}</>
}

function ReadOnly({ f, index, dataValue }) {
    return <div className={styles.readonly}>
        <div className={styles.title}>{f.title.replace('%index%', index + 1)}</div>
        <div className={styles.value}>{dataValue}</div>
    </div>
}

function StringField({ f, integer, multiline, rows, index, dataValue, onChange }) {
    const [value, _value] = useState('');

    useEffect(() => {
        if (dataValue !== undefined) _value(dataValue);
    }, [dataValue])

    const handleChange = (e) => {
        let value = e.target.value;

        if (integer) {
            value = String(parseInt(value.replace(/[^\d.-]+/g, '')))
            if (isNaN(value)) value = 0;
        }

        onChange(value)
    }

    return <TextField
        className="input-text"
        label={f.title.replace('%index%', index + 1)}
        value={value || ''}
        onChange={handleChange}
        multiline={multiline}
        rows={rows || 2}
    />
}

function OptionsField({ f, index, dataValue, onChange }) {
    const [value, _value] = useState('none');
    const [options, _options] = useState([]);

    useEffect(() => {
        if (f.options) _options(f.options);

        if (f.list) {
            // console.log(context_lists, f.list.module, context_lists[f.list.module])
            _options(context_lists[f.list.module]?.find(l => l.key === f.list.key)?.options || []);
        }
    }, [f])

    useEffect(() => {
        if (dataValue !== undefined) _value(dataValue);
    }, [dataValue])

    return <TextField
        className="input-select"
        label={f.title.replace('%index%', index + 1)}
        value={value || 'none'}
        select
        onChange={(e) => onChange(e.target.value)}
    >
        <MenuItem value="none">Não respondido</MenuItem>
        {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </TextField>
}

function MultiAutocompleteField({ f, index, tag = false, dataValue, onChange }) {
    const [value, _value] = useState([]);
    const [options, _options] = useState([]);

    useEffect(() => {
        if (f.options) _options(f.options);

        if (f.list) {
            // console.log(context_lists, f.list.module, context_lists[f.list.module])
            _options(context_lists[f.list.module]?.find(l => l.key === f.list.key)?.options || []);
        }
    }, [f])

    useEffect(() => {
        _value(dataValue !== undefined ? dataValue : []);
    }, [dataValue])

    const handleCheckChange = o => (e) => {

        const isChecked = e.target.checked;
        const isInValue = value.find(v => v.value === o.value);

        if (!isChecked && isInValue) onChange(value.filter(v => v.value !== o.value));
        if (isChecked && !isInValue) onChange([...value, o]);

    }

    if (tag) return <Autocomplete
        multiple
        id="fixed-tags"
        className="input-autocomplete"
        value={value}
        onChange={(_, value) => onChange(value)}
        options={options}
        // getOptionLabel={(option) => option.label}
        renderOption={(props, option) => {
            return (
                <li {...props} key={option.value}>
                    {option.label}
                </li>
            )
        }}
        renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
                <Chip
                    label={option.label}
                    {...getTagProps({ index })}
                    key={option.value}
                />
            ))
        }
        renderInput={(params) => (<form autoComplete={"new-password"}>
            <TextField
                InputProps={{
                    autoComplete: 'new-password',
                    form: {
                        autoComplete: 'off',
                    }
                }}
                {...params}
                label={f.title.replace('%index%', index + 1)}
            />
        </form>)}
    />

    return <FormControl className={styles.checklist}>
        <FormLabel>{f.title.replace('%index%', index + 1)}</FormLabel>
        <FormGroup>
            {options.map(o => <FormControlLabel
                key={o.value}
                control={<Checkbox checked={value.some(v => v.value === o.value)} />}
                label={o.label}
                onChange={handleCheckChange(o)} />
            )}
        </FormGroup>
    </FormControl>


}

function DatePickerField({ f, index, dataValue, onChange }) {
    const [value, _value] = useState(null);

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <DatePicker
        className="input-datepicker"
        label={f.title.replace('%index%', index + 1)}
        value={value || ''}
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
        const found = b.elements.find(key => key === keyRef);
        if (found) {
            block = b;
            break;
        }
    }

    return block;
}

/*****************************************************************
    Basic Mapper
 *****************************************************************/

export function mapData2Form(data, form) {
    let mappedData = data;

    // multi_autocomplete
    for (let f of form.fields.filter(f => f.type === 'multi_autocomplete')) {
        let value = data[String(f.key)];
        if (!Array.isArray(value)) value = [value]; // legacy

        if (!!value) {
            const nValue = f.options.filter(o => value.includes(o.value));
            data[f.key] = nValue;
        }
    }

    return mappedData;
}