import { useEffect, useState, cloneElement, Fragment } from 'react';
import { TextField, MenuItem, Autocomplete, Chip, FormGroup, FormControl, FormLabel, FormControlLabel, Checkbox, Tooltip, IconButton } from '@mui/material';
import Plus from '../icons/Plus';
import Trash from '../icons/Trash';
import DatePicker from '../DatePicker';
import UploaderField from '../../components/UploaderField';

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
function BasicRenderer({ form, readonly, showOrphans = false, data, onDataChange, onRemoveIterative, onAddIterative }) {
    const [blocks, _blocks] = useState([]);
    const [otherFields, _otherFields] = useState([]);

    useEffect(() => {
        if (!!data /* && !!Object.keys(data).length - tem que renderizar para vazio */ && !!form) {
            let blocks, otherFields, processedBlocks = [];

            if (!form.blocks) {

                blocks = <>
                    {form.fields.map(f => <div key={f.key} className='row'>
                        <div className={`col-xs-${f.size}`}><FieldRenderer readonly={readonly} blocks={form.blocks || []} f={f} size={f.size} keyRef={f.key} data={data} onDataChange={onDataChange} /></div>
                    </div>)}
                </>

            } else {

                function RenderBlock(k, b, index) {
                    processedBlocks.push(k);
                    return <Block key={`${!index ? k : `${k}.${index}`}`} block={b} data={data} basic={true} iterative={index === undefined ? undefined : { k, index, free: b.iterate.target === 'none' }} onRemoveIterative={onRemoveIterative}>
                        {b.elements.map(e => {
                            if (e.type === 'block') {
                                const innerBlock = form.blocks.find(bl => bl.key === e.key);

                                // handle iteration
                                if (!innerBlock.iterate) return RenderBlock(e.key, innerBlock);
                                else {
                                    if (innerBlock.iterate.target === 'none') {
                                        const childrenBlocks = !data?.[e.key] ? [] : data[e.key].map((v, index) => RenderBlock(e.key, innerBlock, index));
                                        if (!childrenBlocks.length) processedBlocks.push(e.key);

                                        return <div key={`block_${e.key}`}>
                                            {childrenBlocks}
                                            <div className='row'>
                                                <div className='col-xs-12'>
                                                    <button className="button-outline" onClick={() => onAddIterative(innerBlock)}>
                                                        <Plus></Plus>
                                                        {innerBlock.iterate.add || 'Add'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    } else return RenderBlock(e.key, innerBlock); /* TODO: target -> field (integer) */ /* TODO: target -> field (multiple options) */
                                }
                            }

                            const fKey = e.key || e;

                            inBlock.push(fKey);
                            const field = form.fields.find(fi => fi.key === fKey);
                            return <div key={field.key} className='row'>
                                <div className={`col-xs-${field.size}`}><FieldRenderer readonly={readonly} blocks={form.blocks || []} f={field} size={field.size} keyRef={field.key} data={data} iterative={index === undefined ? undefined : { k, index }} onDataChange={onDataChange} /></div>
                            </div>
                        })}
                    </Block>
                }

                let inBlock = [];
                // process blocks (nested!)
                blocks = <>
                    {form.blocks.map(b => {
                        const k = b.key || uuidv4();

                        if (processedBlocks.includes(k)) return null;

                        return RenderBlock(k, b);
                    })}
                </>;

                // mostrar campos sem blocos
                otherFields = <>
                    {form.fields.filter(f => !inBlock.includes(f.key)).map(f => <div key={f.key} className='row'>
                        <div className={`col-xs-${f.size}`}><FieldRenderer readonly={readonly} blocks={form.blocks || []} f={f} size={f.size} keyRef={f.key} data={data} onDataChange={onDataChange} /></div>
                    </div>)}
                </>
            }

            _blocks(blocks);
            _otherFields(otherFields);
        }
    }, [data, form])

    return <>
        {blocks}
        {!!showOrphans && otherFields}
    </>
}

/*****************************************************************
    View Renderer
 *****************************************************************/
// TODO: tentar resolver esta cascata de props - hooks? context?

function ViewRenderer({ form, view, data, readonly, onDataChange, onRemoveIterative, onAddIterative, addBlock }) {
    return <Element v={{ type: 'start', elements: view }} readonly={readonly} form={form} data={data} onDataChange={onDataChange} onRemoveIterative={onRemoveIterative} addBlock={addBlock} onAddIterative={onAddIterative} />
}
function Element(props) {
    const { readonly, form, v, data, iterative, onDataChange, onRemoveIterative, onAddIterative, addBlock } = props;

    if (v.type === 'start') return <>
        {v.elements.map((v, idx) => <Element key={idx} readonly={readonly} form={form} v={v} data={data} onDataChange={onDataChange} onRemoveIterative={onRemoveIterative} addBlock={addBlock} onAddIterative={onAddIterative} />)}
    </>

    if (v.type === 'row') {
        if (!v.block) return <Row {...props} />
        else {
            const block = form.blocks.find(b => b.key === v.block)

            // handle iteration
            if (!block.iterate) {
                return <Block block={block} data={data}>
                    <Row {...props} />
                </Block>
            } else {
                if (block.iterate.target === 'none') {
                    const childrenBlocks = !data?.[block.key] ? [] : data[block.key].map((v, index) => <Block key={`row_${block.key}_${index}`} block={block} data={data}>
                        <Row {...props} iterative={{ k: block.key, index }} />
                    </Block>);


                    return <Fragment key={`block_${block.key}`}>
                        {childrenBlocks}
                    </Fragment>
                } else { /* TODO: target -> field (integer) */ /* TODO: target -> field (multiple options) */
                    return <Block block={block} data={data}>
                        <Row {...props} />
                    </Block>
                }
            }


        }
    }

    if (v.type === 'separator') {
        return <hr className="hr-spacer my-4" />;
    }

    if (v.type === 'remove') {
        return <div className={styles.remove}>
            <div className={styles.iterative}>
                <div className={styles['svg-icon-box']}>
                    <Tooltip title="Remover">
                        <IconButton onClick={() => onRemoveIterative(iterative)}>
                            <Trash />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </div>;
    }

    if (v.type === 'column') {
        if (!!v.key) { /* field */
            const field = form.fields.find(f => f.key === v.key);
            if (!field) return null;

            if (!checkShow(field, data)) return null;
            
            return <div className={`col-xs-${v.size}`}>
                <FieldRenderer readonly={readonly} blocks={form.blocks || []} f={field} size={v.size} keyRef={field.key} data={data} iterative={iterative} onDataChange={onDataChange} />
            </div>
        }

        if (!!v.elements) {
            return <div className={`col-xs-${v.size}`}>{v.elements.map((v, idx) => <Element key={idx} readonly={readonly} form={form} v={v} data={data} iterative={iterative} onDataChange={onDataChange} onRemoveIterative={onRemoveIterative} addBlock={addBlock} onAddIterative={onAddIterative} />)}</div>
        }

        return null;
    }

    if (v.type === 'add') {
        if (!!v.elements) {
            // TODO: verify show rule!!

            const block = form.blocks.find(b => b.key === v.block);

            return <Block key={`add_${block.key}`} block={block} data={data}>
                {v.elements.map((v, idx) => <Element readonly={readonly} key={idx} form={form} v={v} data={data} iterative={iterative} onDataChange={onDataChange} onRemoveIterative={onRemoveIterative} addBlock={block} onAddIterative={onAddIterative} />)}
            </Block>
        }
    }

    if (v.type === 'button') {
        return <button className="button-outline" onClick={() => onAddIterative(addBlock)}>
            <Plus></Plus>
            {v.title || 'Add'}
        </button>
    }

    return null;

}
function Row({ readonly, form, v, data, iterative, onDataChange, onRemoveIterative, addBlock, onAddIterative }) {
    return <div className="row">
        {v.elements.map((v, idx) => <Element key={idx} readonly={readonly} form={form} v={v} data={data} iterative={iterative} onDataChange={onDataChange} onRemoveIterative={onRemoveIterative} addBlock={addBlock} onAddIterative={onAddIterative} />)}
    </div>
}

/*****************************************************************
    Field Renderer
 *****************************************************************/

export function FieldRenderer({ f, size, readonly, keyRef, blocks, data, iterative, onDataChange }) {
    const [doShow, _doShow] = useState(false);

    useEffect(() => {
        let show = checkShow(f, data);

        _doShow(show);

    }, [f, blocks, data])

    const onChange = (field, iterative) => value => {
        onDataChange(field, value, iterative);
    }

    if (!doShow) return null;

    let Component;

    let dataValue = data?.[keyRef];
    if (!!iterative) dataValue = data?.[iterative.k]?.[iterative.index]?.[keyRef];

    if (f.type === 'label') Component = <Label f={f} />
    else if (f.type === 'read_only') Component = <ReadOnly f={f} dataValue={dataValue} />
    else if (f.type === 'options') Component = <OptionsField readonly={readonly} f={f} dataValue={dataValue} onChange={onChange(keyRef, iterative)} />
    else if (f.type === 'yearpicker') Component = <DatePickerField readonly={readonly} f={f} dataValue={dataValue} onChange={onChange(keyRef, iterative)} />
    else if (f.type === 'multi_autocomplete') Component = <MultiAutocompleteField
        readonly={readonly}
        f={f}
        tag={!!f.tag}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
    />
    else if (f.type === 'file') Component = <FileField readonly={readonly} f={f} dataValue={dataValue} onChange={onChange(keyRef, iterative)} accept={f.accept} />
    else if (f.type === 'thumbnail') Component = <ThumbnailField readonly={readonly} f={f} dataValue={dataValue} onChange={onChange(keyRef, iterative)} />
    else Component = <StringField readonly={readonly} integer={f.type === 'integer'} multiline={f.type === 'textarea'} rows={f.rows} f={f} dataValue={dataValue} onChange={onChange(keyRef, iterative)} />

    /* if (f.iterate) {
        // iterative field
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
    } else */ if (!!iterative) {
        // field in iterative block
        const IterateElement = cloneElement(Component, { index: iterative.index });
        return <>{IterateElement}</>

    } else return <>{Component}</>


}

/*****************************************************************
    Aux Components
 *****************************************************************/

/***
    Block 
    - basic, it handles the show rule, the title and the remove button (for iterative - TODO: esta questão do botão, deveria ser responsabilidade deste elemento?)
 ***/
function Block({ block, data, basic = false, iterative, onRemoveIterative, children }) {
    const [doShow, _doShow] = useState(false);

    useEffect(() => {
        let show = checkShow(block, data);

        _doShow(show);

    }, [block, data])

    if (!doShow) return null;

    if (!block.title) {
        if (!basic) return <>{children}</>;
        else {
            return <div className={styles['basic-block']}>
                {!!iterative && iterative.free && <div className={styles['iterative']}>
                    <div className={styles['svg-icon-box']}>
                        <Tooltip title="Remover">
                            <IconButton onClick={() => onRemoveIterative(iterative)}>
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>}
                <div className={!!iterative && iterative.free ? styles['iterative-children'] : ''}>{children}</div>
            </div>;
        }
    }

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

function checkShow(e, data) {
    let show = true;

    // field rules
    if (!!e.show?.function) {
        // console.log(data[f.show.function.params[0].value_of])
        show = context_modules[e.show.function.module]?.[e.show.function.name].call(this, data[e.show.function.params[0].value_of]);
    } else if (!!e.show?.target) {
        // console.log(f.show.target.key, data[f.show.target.key], f.show.target.value)

        if (!Array.isArray(e.show.target.value)) show = (data[e.show.target.key] === e.show.target.value);
        else show = e.show.target.value.includes(data[e.show.target.key])

    }

    return show;
}

function titleAndIndex(title, index) {
    return title.replace('%index%', index !== undefined ? index + 1 : '?');
}

/* function fieldInBlock(keyRef, blocks) {
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
} */

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


/*****************************************************************
    Field components
 *****************************************************************/

function Label({ f, index }) {
    return <>{titleAndIndex(f.title, index)}</>
}

function ReadOnly({ f, index, dataValue }) {
    return <div className={styles.readonly}>
        <div className={styles.title}>{titleAndIndex(f.title, index)}</div>
        <div className={styles.value}>{dataValue}</div>
    </div>
}

let timeoutTest;
function StringField({ f, readonly, integer, multiline, rows, index, dataValue, onChange }) {
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

        _value(value);

        if (timeoutTest) clearTimeout(timeoutTest);
        timeoutTest = setTimeout(() => {
            onChange(value)
        }, 500)
    }

    return <TextField
        className="input-text"
        label={titleAndIndex(f.title, index)}
        value={value || ''}
        onChange={handleChange}
        multiline={multiline}
        rows={rows || 2}
        disabled={readonly}
    />
}

function OptionsField({ f, readonly, index, dataValue, onChange }) {
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
        label={titleAndIndex(f.title, index)}
        value={value || 'none'}
        select
        onChange={(e) => onChange(e.target.value)}
        disabled={readonly}
    >
        <MenuItem value="none">Não respondido</MenuItem>
        {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </TextField>
}

function MultiAutocompleteField({ f, readonly, index, tag = false, dataValue, onChange }) {
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
        disabled={readonly}
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
                label={titleAndIndex(f.title, index)}
            />
        </form>)}
    />

    return <FormControl className={styles.checklist}>
        <FormLabel>{titleAndIndex(f.title, index)}</FormLabel>
        <FormGroup>
            {options.map(o => <FormControlLabel
                key={o.value}
                control={<Checkbox checked={value.some(v => v.value === o.value)} />}
                label={o.label}
                onChange={handleCheckChange(o)}
                disabled={readonly}
            />)}
        </FormGroup>
    </FormControl>


}

function DatePickerField({ f, readonly, index, dataValue, onChange }) {
    const [value, _value] = useState(null);

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <DatePicker
        className="input-datepicker"
        label={titleAndIndex(f.title, index)}
        value={value || ''}
        onChange={onChange}
        views={['year']}
        inputFormat="yyyy"
        disabled={readonly}
    />
}

function FileField({ f, readonly, index, dataValue, accept, onChange }) {
    const [value, _value] = useState(null);

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <UploaderField
        onChange={onChange}
        url={value?.url}
        type="file"
        filename={value?.file?.name}
        accept={accept}
        title={titleAndIndex(f.title, index)}
        disabled={readonly}
    />
}

function ThumbnailField({ f, readonly, index, dataValue, onChange }) {
    const [value, _value] = useState(null);

    useEffect(() => {
        if (!!dataValue) _value(dataValue);
    }, [dataValue])

    return <UploaderField
        onChange={onChange}
        url={value?.url}
        alt={titleAndIndex(f.title, index)}
        title={titleAndIndex(f.title, index)}
        viewer={false}
        disabled={readonly}
    />;
}