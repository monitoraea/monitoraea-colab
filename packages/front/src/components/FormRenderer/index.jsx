import { useEffect, useState, cloneElement, Fragment } from 'react';
import {
  TextField,
  MenuItem,
  Autocomplete,
  Chip,
  FormGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Tooltip,
  IconButton,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Plus from '../icons/Plus';
import Trash from '../icons/Trash';
import DatePicker from '../DatePicker';
import UploaderField from '../../components/UploaderField';

let context_modules = {}; // TODO: context?
let context_lists = {}; // TODO: context?

import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import styles from './styles.module.scss';

import axios from 'axios';

import { useDorothy } from 'dorothy-dna-react';
import { useQuery } from 'react-query';

import Helpbox from '../../tools/CMS/helpbox';
import HelpBoxButton from './HelpBoxButton';
import HelpCircle from '../icons/HelpCircle.jsx';

export function Renderer(props) {
  const { form, view, data, lists } = props;
  const [imported, _imported] = useState(false);
  const [imported_lists, _imported_lists] = useState(false);
  const [imported_script, _imported_script] = useState(false);

  const [contentData, _contentData] = useState(null);

  const [entity, _entity] = useState({});
  const [files, _files] = useState({});

  useEffect(() => {
    _files(
      form.fields
        .filter(f => ['thumbnail', 'file'].includes(f.type))
        .reduce((acc, f) => ({ ...acc, [f.key]: null }), {}),
    );
  }, [form]);

  useEffect(() => {
    async function doImport() {
      // scripts
      for (let s of form.imports.filter(i => i.type === 'script')) {
        // console.log(s)
        const module = await import(/* @vite-ignore */ s.url);
        // console.log({ module })
        // console.log(module.isEven(1), module.isEven(2), module.isEven(33))
        context_modules[s.key] = module;
      }

      _imported_script(true);
    }

    if (form.imports && Array.isArray(form.imports)) doImport();
    else _imported_script(true);
  }, [form]);

  useEffect(() => {
    if (!!lists) context_lists = { ...context_lists, property: lists.lists };
    _imported_lists(true);
  }, [lists]);

  useEffect(() => {
    _imported(true);
  }, [imported_script, imported_lists]);

  useEffect(() => {
    // defaults // TODO: and for iterated fields?

    let pData = { ...data };
    for (let f of form.fields.filter(f => f.default !== undefined)) {
      if (!pData[f.key]) pData[f.key] = f.default;
    }

    _entity(pData);
  }, [form, data]);

  useEffect(() => {
    props.onDataChange(entity, files);
  }, [entity]);

  const handleDataChange = (field, value, iterative /* k = block key, index */) => {
    if (iterative === undefined) {
      /* campos fora de blocos ou em blocos não iterativos */

      let newEntity = { ...entity };

      // handle files
      if (Object.keys(files).includes(String(field))) {
        newEntity = {
          ...newEntity,
          [field]: value ? value : 'remove',
        };

        _files({ ...files, [field]: value?.file });
      } else {
        newEntity = {
          ...newEntity,
          [field]: value,
        };
      }

      // onchange
      const onchange = form.fields.find(f => f.key === field)?.onchange;
      if (onchange)
        for (let c of onchange) {
          newEntity = {
            ...newEntity,
            [c.key]: c.value,
          };

          // handle files
          if (Object.keys(files).includes(String(c.key))) {
            _files({ ...files, [c.key]: null });
          }
        }

      console.log(`changing ${field}:`, value, newEntity);

      _entity(newEntity);
    } else {
      /* campos em blocos iterativos */

      /* TODO: files */
      /* TODO: onchange */

      let complexValue = entity[iterative.k];
      if (!!complexValue && Array.isArray(complexValue)) {
        complexValue[iterative.index][field] = value;

        _entity(entity => {
          const newEntity = {
            ...entity,
            [iterative.k]: complexValue,
          };

          console.log(`changing iterative ${iterative.k}:`, complexValue, newEntity);

          return newEntity;
        });
      }
    }
  };

  const handleRemoveIterative = iterative => {
    let complexValue = entity[iterative.k];
    complexValue.splice(iterative.index, 1);

    _entity(entity => ({
      ...entity,
      [iterative.k]: complexValue,
    }));
  };

  const handleAddIterative = block => {
    block = mergeBlockElement(block, form);

    let newEmptyValue = {};
    for (let field of block.elements) newEmptyValue[field] = null;

    let newComplexValue;
    if (!entity[block.key]) newComplexValue = [newEmptyValue];
    else newComplexValue = [...entity[block.key], newEmptyValue];

    _entity(entity => ({
      ...entity,
      [block.key]: newComplexValue,
    }));
  };

  if (!imported) return <></>;

  const props_ext = {
    ...props,
    problems: props.problems || [],
    handleDataChange,
    onRemoveIterative: handleRemoveIterative,
    onAddIterative: handleAddIterative,
  };

  return (
    <>
      {!view && <BasicRenderer {...props_ext} data={entity} onContentData={_contentData} />}
      {view && <ViewRenderer {...props_ext} data={entity} onContentData={_contentData} />}
      <Helpbox content={contentData} onClose={() => _contentData(null)} />
    </>
  );
}

/*****************************************************************
    Basic Renderer
 *****************************************************************/
function BasicRenderer({
  form,
  readonly,
  showOrphans = false,
  data,
  handleDataChange,
  onRemoveIterative,
  onAddIterative,
  problems,
  onContentData,
}) {
  const [blocks, _blocks] = useState([]);
  const [otherFields, _otherFields] = useState([]);

  useEffect(() => {
    if (!!data /* && !!Object.keys(data).length - tem que renderizar para vazio */ && !!form) {
      let blocks,
        otherFields,
        processedBlocks = [];

      if (!form.blocks) {
        blocks = (
          <>
            {form.fields.map(f => (
              <div key={f.key} className="row">
                <div className={`col-xs-${f.size || 12}`}>
                  <FieldRenderer
                    readonly={readonly}
                    problems={problems}
                    blocks={form.blocks || []}
                    f={f}
                    size={f.size || 12}
                    keyRef={f.key}
                    data={data}
                    handleDataChange={handleDataChange}
                    onContentData={onContentData}
                  />
                </div>
              </div>
            ))}
          </>
        );
      } else {
        function RenderBlock(k, b, index) {
          processedBlocks.push(k);

          b = mergeBlockElement(b, form);

          return (
            <Block
              key={`${!index ? k : `${k}.${index}`}`}
              block={b}
              data={data}
              basic={true}
              iterative={index === undefined ? undefined : { k, index, free: b.iterate.target === 'none' }}
              onRemoveIterative={onRemoveIterative}
            >
              {b.elements.map(e => {
                if (e.type === 'block') {
                  const innerBlock = form.blocks.find(bl => bl.key === e.key);

                  // handle iteration
                  if (!innerBlock.iterate) return RenderBlock(e.key, innerBlock);
                  else {
                    if (innerBlock.iterate.target === 'none') {
                      const childrenBlocks = !data?.[e.key]
                        ? []
                        : data[e.key].map((v, index) => RenderBlock(e.key, innerBlock, index));
                      if (!childrenBlocks.length) processedBlocks.push(e.key);

                      return (
                        <div key={`block_${e.key}`}>
                          {childrenBlocks}
                          <div className="row">
                            <div className="col-xs-12">
                              <button className="button-outline" onClick={() => onAddIterative(innerBlock, form)}>
                                <Plus></Plus>
                                {innerBlock.iterate.add || 'Add'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    } else
                      return RenderBlock(
                        e.key,
                        innerBlock,
                      ); /* TODO: target -> field (integer) */ /* TODO: target -> field (multiple options) */
                  }
                }

                const fKey = e.key || e;

                inBlock.push(fKey);
                const field = form.fields.find(fi => fi.key === fKey);
                return (
                  <div key={field.key} className="row">
                    <div className={`col-xs-${field.size || 12}`}>
                      <FieldRenderer
                        readonly={readonly}
                        problems={problems}
                        blocks={form.blocks || []}
                        f={field}
                        size={field.size || 12}
                        keyRef={field.key}
                        data={data}
                        iterative={index === undefined ? undefined : { k, index }}
                        handleDataChange={handleDataChange}
                        onContentData={onContentData}
                      />
                    </div>
                  </div>
                );
              })}
            </Block>
          );
        }

        let inBlock = [];
        // process blocks (nested!)
        blocks = (
          <>
            {form.blocks.map(b => {
              const k = b.key || uuidv4();

              if (processedBlocks.includes(k)) return null;

              return RenderBlock(k, b);
            })}
          </>
        );

        // mostrar campos sem blocos
        otherFields = (
          <>
            {form.fields
              .filter(f => !inBlock.includes(f.key))
              .map(f => (
                <div key={f.key} className="row">
                  <div className={`col-xs-${f.size}`}>
                    <FieldRenderer
                      readonly={readonly}
                      problems={problems}
                      blocks={form.blocks || []}
                      f={f}
                      size={f.size || 12}
                      keyRef={f.key}
                      data={data}
                      handleDataChange={handleDataChange}
                      onContentData={onContentData}
                    />
                  </div>
                </div>
              ))}
          </>
        );
      }

      _blocks(blocks);
      _otherFields(otherFields);
    }
  }, [data, form, problems]);

  return (
    <>
      {blocks}
      {!!showOrphans && otherFields}
    </>
  );
}

/*****************************************************************
    View Renderer
 *****************************************************************/
// TODO: tentar resolver esta cascata de props - hooks? context?

function ViewRenderer({
  form,
  view,
  data,
  readonly,
  handleDataChange,
  onRemoveIterative,
  onAddIterative,
  addBlock,
  problems,
  onContentData,
}) {
  return (
    <Element
      v={{ type: 'start', elements: view }}
      readonly={readonly}
      problems={problems}
      form={form}
      data={data}
      handleDataChange={handleDataChange}
      onRemoveIterative={onRemoveIterative}
      addBlock={addBlock}
      onAddIterative={onAddIterative}
      onContentData={onContentData}
    />
  );
}
function Element(props) {
  const {
    readonly,
    form,
    v,
    data,
    iterative,
    handleDataChange,
    onRemoveIterative,
    onAddIterative,
    addBlock,
    problems,
    onContentData,
  } = props;

  if (v.type === 'start')
    return (
      <>
        {v.elements.map((v, idx) => (
          <Element
            key={idx}
            readonly={readonly}
            problems={problems}
            form={form}
            v={v}
            data={data}
            handleDataChange={handleDataChange}
            onRemoveIterative={onRemoveIterative}
            addBlock={addBlock}
            onAddIterative={onAddIterative}
            onContentData={onContentData}
          />
        ))}
      </>
    );

  if (v.type === 'row') {
    if (!v.block) return <Row {...props} />;
    else {
      const block = form.blocks.find(b => b.key === v.block);

      // handle iteration
      if (!block.iterate) {
        return (
          <Block block={block} data={data}>
            <Row {...props} />
          </Block>
        );
      } else {
        if (block.iterate.target === 'none') {
          const childrenBlocks = !data?.[block.key]
            ? []
            : data[block.key].map((v, index) => (
                <Block key={`row_${block.key}_${index}`} block={block} data={data}>
                  <Row {...props} iterative={{ k: block.key, index }} />
                </Block>
              ));

          return <Fragment key={`block_${block.key}`}>{childrenBlocks}</Fragment>;
        } else {
          /* TODO: target -> field (integer) */ /* TODO: target -> field (multiple options) */
          return (
            <Block block={block} data={data}>
              <Row {...props} />
            </Block>
          );
        }
      }
    }
  }

  if (v.type === 'separator') {
    return <hr className="hr-spacer my-4" />;
  }

  if (v.type === 'remove') {
    return (
      <div className={styles.remove}>
        <div className={styles.iterative}>
          <div className={styles['svg-icon-box']}>
            <Tooltip title="Remover">
              <IconButton onClick={() => onRemoveIterative(iterative)}>
                <Trash />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  if (v.type === 'column') {
    if (!!v.key) {
      /* field */
      const field = form.fields.find(f => f.key === v.key);
      if (!field) return null;

      if (!checkShow(field, data)) return null;

      return (
        <div className={`col-xs-${v.size || 12}`}>
          <FieldRenderer
            readonly={readonly}
            problems={problems}
            blocks={form.blocks || []}
            f={field}
            size={v.size || 12}
            keyRef={field.key}
            data={data}
            iterative={iterative}
            handleDataChange={handleDataChange}
            onContentData={onContentData}
          />
        </div>
      );
    }

    if (!!v.elements) {
      return (
        <div className={`col-xs-${v.size || 12}`}>
          {v.elements.map((v, idx) => (
            <Element
              key={idx}
              readonly={readonly}
              problems={problems}
              form={form}
              v={v}
              data={data}
              iterative={iterative}
              handleDataChange={handleDataChange}
              onRemoveIterative={onRemoveIterative}
              addBlock={addBlock}
              onAddIterative={onAddIterative}
              onContentData={onContentData}
            />
          ))}
        </div>
      );
    }

    return null;
  }

  if (v.type === 'add') {
    if (!!v.elements) {
      // TODO: verify show rule!!

      const block = form.blocks.find(b => b.key === v.block);

      return (
        <Block key={`add_${block.key}`} block={block} data={data}>
          {v.elements.map((v, idx) => (
            <Element
              readonly={readonly}
              problems={problems}
              key={idx}
              form={form}
              v={v}
              data={data}
              iterative={iterative}
              handleDataChange={handleDataChange}
              onRemoveIterative={onRemoveIterative}
              addBlock={block}
              onAddIterative={onAddIterative}
              onContentData={onContentData}
            />
          ))}
        </Block>
      );
    }
  }

  if (v.type === 'button') {
    return (
      <button className="button-outline" onClick={() => onAddIterative(addBlock, form)}>
        <Plus></Plus>
        {v.title || 'Add'}
      </button>
    );
  }

  return null;
}
function Row({
  readonly,
  form,
  v,
  data,
  iterative,
  handleDataChange,
  onRemoveIterative,
  addBlock,
  onAddIterative,
  problems,
  onContentData,
}) {
  // console.log(v.elements)

  return (
    <div className="row">
      {v.elements.map((v, idx) => (
        <Element
          key={idx}
          readonly={readonly}
          problems={problems}
          form={form}
          v={v}
          data={data}
          iterative={iterative}
          handleDataChange={handleDataChange}
          onRemoveIterative={onRemoveIterative}
          addBlock={addBlock}
          onAddIterative={onAddIterative}
          onContentData={onContentData}
        />
      ))}
    </div>
  );
}

/*****************************************************************
    Field Renderer
 *****************************************************************/

export function FieldRenderer({
  f,
  size,
  readonly,
  keyRef,
  blocks,
  data,
  iterative,
  handleDataChange,
  problems,
  onContentData,
}) {
  const [doShow, _doShow] = useState(false);

  useEffect(() => {
    let show = checkShow(f, data);

    _doShow(show);
  }, [f, blocks, data]);

  const onChange = (field, iterative) => value => {
    handleDataChange(field, value, iterative);
  };

  if (!doShow) return null;

  let Component;

  let dataValue = data?.[keyRef];
  if (!!iterative) dataValue = data?.[iterative.k]?.[iterative.index]?.[keyRef];

  if (f.type === 'label') Component = <Label f={f} />;
  else if (f.type === 'read_only') Component = <ReadOnly f={f} dataValue={dataValue} />;
  else if (f.type === 'options')
    Component = (
      <OptionsField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
      />
    );
  else if (['yearpicker', 'monthpicker'].includes(f.type))
    Component = (
      <DatePickerField
        type={f.type}
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
      />
    );
  else if (f.type === 'async_autocomplete')
    Component = (
      <AsyncAutocompleteField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
        data={data}
      />
    );
  else if (f.type === 'autocomplete')
    Component = (
      <AutocompleteField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
      />
    );
  else if (f.type === 'multi_autocomplete')
    Component = (
      <AutocompleteField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        tag={!!f.tag}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
        multiple
      />
    );
  else if (f.type === 'file')
    Component = (
      <FileField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
        accept={f.accept}
      />
    );
  else if (f.type === 'thumbnail')
    Component = (
      <ThumbnailField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
      />
    );
  else
    Component = (
      <StringField
        readonly={readonly}
        error={problems.includes(String(f.key))}
        integer={f.type === 'integer'}
        multiline={f.type === 'textarea'}
        rows={f.rows}
        f={f}
        dataValue={dataValue}
        onChange={onChange(keyRef, iterative)}
      />
    );

  /* if (f.iterate) {
        // iterative field
        if (!data[f.iterate.target]) return <></>;

        let iteration = [];
        for (let index = 0; index < data[f.iterate.target]; index++) {
            const IterateElement = cloneElement(Component, { index });
            iteration.push(<div className='row' key={`${f.key}.${index}`}>
                <div className={`col-xs-${size || 12}`}>
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
    return <>{IterateElement}</>;
  } else
    return (
      <div className={styles.component}>
        {Component}
        {f.helpbox && f.helpbox.type && f.helpbox.keyref && (
          <div>
            <HelpBoxButton type={f.helpbox.type} keyRef={f.helpbox.keyref} openHelpbox={onContentData} />
          </div>
        )}
        {f.helpbox && f.helpbox.file && (
          <div>
            <button
              className={`button-link ${styles.helpbox_button}`}
              onClick={() => window.open(f.helpbox.file,'_blank')}
            >
              <HelpCircle />
            </button>
          </div>
        )}
      </div>
    );
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
  }, [block, data]);

  if (!doShow) return null;

  if (!block.title) {
    if (!basic) return <>{children}</>;
    else {
      return (
        <div className={styles['basic-block']}>
          {!!iterative && iterative.free && (
            <div className={styles['iterative']}>
              <div className={styles['svg-icon-box']}>
                <Tooltip title="Remover">
                  <IconButton onClick={() => onRemoveIterative(iterative)}>
                    <Trash />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          )}
          <div className={!!iterative && iterative.free ? styles['iterative-children'] : ''}>{children}</div>
        </div>
      );
    }
  }

  return (
    <section id={block.key}>
      <div className="section-header">
        <div className="section-title">{block.title}</div>
      </div>
      <>{children}</>
    </section>
  );
}

/*****************************************************************
    Aux functions
 *****************************************************************/

function checkShow(e, data) {
  let show = true;

  // field rules
  if (!!e.show?.function) {
    // console.log(data[f.show.function.params[0].value_of])
    show = context_modules[e.show.function.module]?.[e.show.function.name].call(
      this,
      data[e.show.function.params[0].value_of],
    );
  } else if (!!e.show?.target) {
    // console.log(f.show.target.key, data[f.show.target.key], f.show.target.value)

    if (!Array.isArray(e.show.target.value)) show = data[e.show.target.key] === e.show.target.value;
    else show = e.show.target.value.includes(data[e.show.target.key]);
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

  // yearpicker
  for (let f of form.fields.filter(f => f.type === 'yearpicker')) {
    let value = data[String(f.key)];

    if (!!value) {
      const nValue = dayjs(`01/01/${value}`, 'DD/MM/YYYY').toDate();
      data[f.key] = nValue;
    }
  }

  return mappedData;
}

export function mapForm2Data(data, form) {
  /* TODO: vai para o getFormData, abaixo?? */
  let mappedData = { ...data };

  // multi_autocomplete
  for (let f of form.fields.filter(f => f.type === 'multi_autocomplete')) {
    mappedData[f.key] = data[f.key].map(d => d.value);
  }

  // async_autocomplete
  for (let f of form.fields.filter(f => f.type === 'async_autocomplete')) {
    mappedData[f.key] = data[f.key]?.id || data[f.key];
  }

  return mappedData;
}

/*****************************************************************
    Create FormData: data + files
 *****************************************************************/

export function getFormData(form, entity, files) {
  let data = new FormData();

  console.log({ entity }, mapForm2Data(entity, form));

  for (let key of Object.keys(files)) if (!!files[key]) data.append(dbFieldKey(form, key), files[key]);

  data.set('entity', JSON.stringify(mapForm2Data(entity, form)));

  return data;
}
function dbFieldKey(form, key) {
  const db_field = form.fields.find(f => f.key === key)?.db_field;
  return db_field || key;
}

/*****************************************************************
    Field components
 *****************************************************************/

function Label({ f, index }) {
  return <>{titleAndIndex(f.title, index)}</>;
}

function ReadOnly({ f, index, dataValue }) {
  return (
    <div className={styles.readonly}>
      <div className={styles.title}>{titleAndIndex(f.title, index)}</div>
      <div className={styles.value}>{dataValue}</div>
    </div>
  );
}

let timeoutTest;
function StringField({ f, readonly, integer, multiline, rows, index, dataValue, onChange, error }) {
  const [value, _value] = useState('');

  useEffect(() => {
    if (dataValue !== undefined) _value(dataValue);
  }, [dataValue]);

  const handleChange = e => {
    let value = e.target.value;

    if (integer) {
      value = String(parseInt(value.replace(/[^\d.-]+/g, '')));
      if (isNaN(value)) value = 0;
    }

    _value(value);

    if (timeoutTest) clearTimeout(timeoutTest);
    timeoutTest = setTimeout(() => {
      onChange(value);
    }, 500);
  };

  return (
    <TextField
      className="input-text"
      label={titleAndIndex(f.title, index)}
      value={value || ''}
      onChange={handleChange}
      multiline={multiline}
      rows={rows || 2}
      disabled={readonly}
      error={error}
    />
  );
}

function OptionsField({ f, readonly, index, dataValue, onChange, error }) {
  const { server } = useDorothy();

  const [value, _value] = useState(-1);
  const [options, _options] = useState([]);
  const [ready, _ready] = useState(false);

  useEffect(() => {
    async function retrieveOptions() {
      const { data } = await axios.get(`${server}${f.remote}/?${f.query ? f.query : ''}`);

      _options(data.list);
      _ready(true);
    }

    if (f.options) _options(f.options);

    if (f.list) {
      // console.log(context_lists, f.list.module, context_lists[f.list.module])
      _options(context_lists[f.list.module]?.find(l => l.key === f.list.key)?.options || []);
    }

    if (f.remote) {
      retrieveOptions();
    } else {
      _ready(true);
    }
  }, [f]);

  useEffect(() => {
    if (dataValue !== undefined && dataValue !== null) _value(dataValue);
  }, [dataValue]);

  return (
    <TextField
      className="input-select"
      label={titleAndIndex(f.title, index)}
      value={value !== undefined ? value : -1}
      select
      onChange={e => onChange(e.target.value)}
      disabled={readonly || !ready}
      error={error}
    >
      {!ready && (
        <MenuItem value={-1} disabled>
          Carregando...
        </MenuItem>
      )}
      {ready &&
        options.map(o => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
    </TextField>
  );
}

let timer;
function buildFilter(data, filters) {
  let filterQuery = '';
  for (let f of filters) filterQuery = `${filterQuery}&${f}=${data[f]}`;
  return filterQuery;
}
function AsyncAutocompleteField({ f, readonly, index, dataValue, onChange, error, /* multiple, */ data: formData }) {
  const { server } = useDorothy();

  const [open, _open] = useState(false);
  const [value, _value] = useState(dataValue || null);
  const [options, _options] = useState([]);
  const [searchValue, _searchValue] = useState('');

  const { data: selected, isLoading: isLoadingSelected } = useQuery(
    `${f.remote_single ? f.remote_single : f.remote_list}/${value?.id}`,
    {
      enabled: !!value?.id,
    },
  );

  const { data, isLoading: isLoadingList } = useQuery(
    `${f.remote_list}/?${f.query ? f.query : ''}${searchValue?.length ? `&search=${searchValue}` : ''}${
      f.filter && Array.isArray(f.filter) ? buildFilter(formData, f.filter) : ''
    }`,
    { enabled: open },
  );

  useEffect(() => {
    if (!data) _options([]);
    else _options(data.list);
  }, [data]);

  useEffect(() => {
    if (!dataValue) _value(null);
  }, [dataValue]);

  useEffect(() => {
    if (!selected) return;

    _value(selected);
  }, [selected?.id]);

  const handleChange = (_, value) => {
    _value(value);

    console.log({ value });

    onChange(value ? value.id : null);
  };

  const handleInputChange = e => {
    if (!e) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      _searchValue(e.target.value);
    }, 500);
  };

  return (
    <Autocomplete
      className="input-autocomplete"
      id="asynchronous-demo"
      open={open}
      onOpen={() => {
        _open(true);
      }}
      onClose={() => {
        _open(false);
      }}
      disabled={readonly}
      filterOptions={x => x}
      /* multiple={multiple} */
      onChange={handleChange}
      onInputChange={handleInputChange}
      value={value}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={option => (f.title_field ? option[f.title_field] : option.name || '')}
      options={options}
      noOptionsText="Nenhuma opção"
      loading={isLoadingSelected || isLoadingList}
      renderInput={params => (
        <TextField
          {...params}
          label={titleAndIndex(f.title, index)}
          error={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <Fragment>
                {isLoadingSelected || isLoadingList ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </Fragment>
            ),
          }}
        />
      )}
    />
  );
}

function AutocompleteField({ f, readonly, index, tag = false, dataValue, onChange, error, multiple }) {
  const { server } = useDorothy();

  const [value, _value] = useState([]);
  const [options, _options] = useState([]);
  const [ready, _ready] = useState(false);

  useEffect(() => {
    async function retrieveOptions() {
      const { data } = await axios.get(`${server}${f.remote}`);

      _options(data.list);
      _ready(true);
    }

    if (f.options) _options(f.options);

    if (f.list) {
      // console.log(context_lists, f.list.module, context_lists[f.list.module])
      _options(context_lists[f.list.module]?.find(l => l.key === f.list.key)?.options || []);
    }

    if (f.remote) {
      retrieveOptions();
    } else {
      _ready(true);
    }
  }, [f]);

  useEffect(() => {
    _value(dataValue !== undefined ? dataValue : []);
  }, [dataValue]);

  const handleCheckChange = o => e => {
    const isChecked = e.target.checked;
    const isInValue = value.find(v => v.value === o.value);

    if (!isChecked && isInValue) onChange(value.filter(v => v.value !== o.value));
    if (isChecked && !isInValue) onChange([...value, o]);
  };

  if (!multiple || tag)
    return (
      <Autocomplete
        multiple={multiple}
        id="fixed-tags"
        className="input-autocomplete"
        value={value}
        onChange={(_, value) => onChange(value)}
        disabled={readonly}
        options={options}
        error={error}
        // getOptionLabel={(option) => option.label}
        renderOption={(props, option) => {
          return (
            <li {...props} key={option.value}>
              {option.label}
            </li>
          );
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => <Chip label={option.label} {...getTagProps({ index })} key={option.value} />)
        }
        renderInput={params => (
          <form autoComplete={'new-password'}>
            <TextField
              InputProps={{
                autoComplete: 'new-password',
                form: {
                  autoComplete: 'off',
                },
              }}
              {...params}
              label={titleAndIndex(f.title, index)}
            />
          </form>
        )}
      />
    );

  return (
    <FormControl error={error} className={`${styles.checklist} ${error && styles.error}`}>
      <FormLabel>{titleAndIndex(f.title, index)}</FormLabel>
      <FormGroup>
        {options.map(o => (
          <FormControlLabel
            key={o.value}
            control={<Checkbox checked={value.some(v => v.value === o.value)} />}
            label={o.label}
            onChange={handleCheckChange(o)}
            disabled={readonly}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}

function DatePickerField({ f, type, readonly, index, dataValue, onChange, error }) {
  const [value, _value] = useState(null);
  const [views, _views] = useState(['year']);
  const [inputFormat, _inputFormat] = useState('yyyy');

  useEffect(() => {
    if (!!dataValue) _value(dataValue);
  }, [dataValue]);

  useEffect(() => {
    if (type === 'monthpicker') {
      _views(['month', 'year']);
      _inputFormat('MM/yyyy');
    } else {
      _views(['year']);
      _inputFormat('yyyy');
    }
  }, [type]);

  return (
    <DatePicker
      className="input-datepicker"
      label={titleAndIndex(f.title, index)}
      value={value || ''}
      onChange={onChange}
      views={views}
      inputFormat={inputFormat}
      disabled={readonly}
      error={error}
    />
  );
}

function FileField({ f, readonly, index, dataValue, accept, onChange, error }) {
  const [value, _value] = useState(null);

  useEffect(() => {
    if (!!dataValue) _value(dataValue);
  }, [dataValue]);

  return (
    <UploaderField
      onChange={onChange}
      url={value?.url}
      type="file"
      filename={value?.file?.name}
      accept={accept}
      title={titleAndIndex(f.title, index)}
      disabled={readonly}
      error={error}
    />
  );
}

function ThumbnailField({ f, readonly, index, dataValue, onChange, error }) {
  const [value, _value] = useState(null);

  useEffect(() => {
    if (!!dataValue) _value(dataValue);
  }, [dataValue]);

  return (
    <UploaderField
      onChange={onChange}
      url={value?.url}
      alt={titleAndIndex(f.title, index)}
      title={titleAndIndex(f.title, index)}
      viewer={false}
      disabled={readonly}
      error={error}
    />
  );
}

function mergeBlockElement(b, form) {
  // insere os campos com propriedade block em elements
  let elements = b.elements ? [...b.elements] : [];
  for (let f of form.fields.filter(f => f.block === b.key)) {
    elements.push(f.key);
  }
  // SORT: block por ultimo - TODO: não é o ideal
  elements.sort((a, b) => (a.type === 'block' ? 1 : 0));

  return { ...b, elements };
}
