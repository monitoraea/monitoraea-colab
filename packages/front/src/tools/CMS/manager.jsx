/* react, libs */
import { useState, useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';

import {
  ClassicEditor,
  AccessibilityHelp,
  Alignment,
  AutoLink,
  Autosave,
  BlockQuote,
  Bold,
  CodeBlock,
  Essentials,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  ImageBlock,
  ImageCaption,
  ImageInline,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  SelectAll,
  Style,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TodoList,
  Undo
} from 'ckeditor5';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import _ from 'lodash';

import { secureFindIndex } from '../../utils/index.jsx';

/* dorothy */
import { useRouter, useDorothy } from 'dorothy-dna-react';

/* mui */
import { InputAdornment, IconButton, FormGroup, FormControlLabel, Switch, TextField, Button } from '@mui/material';

/* components */
import AsyncAutocompleteMultiple from '../../components/AsyncAutocompleteMultiple';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import Card from '../../components/Card';
import SimpleSelect from '../../components/SimpleSelect';

/* modals */
import Gallery from './gallery.jsx';
import Helpbox from './helpbox.jsx';

/* images */
import ImageIcon from '../../components/icons/image.svg?react';
import Layout from '../../components/icons/layout.svg?react';
import Cancel from '../../components/icons/x-circle.svg?react';

/* styles */
import styles from './cms.module.scss';

/*  */
import { INDICs, LAEs } from './../../indics';
import { types, formFields } from './formFields';
import { portals, dynamicContents } from './dynamicContents.jsx';

import 'ckeditor5/ckeditor5.css';

const emptyEntity = {
  title: '',
  portal: 'none',
  type: 'news',
  text: '',
  categories: [],
  tags: [],
  featured_images: '',
  helpbox: { keyref: '', description: '' },
  level: 0,
  published: false,
};

export default function CMS({ id, onClose, onSave }) {
  // const { changeRoute } = useRouter();

  const editor = useRef();

  const [galleryTarget, _galleryTarget] = useState(null);
  const [openGallery, _openGallery] = useState(false);
  const [openHelpbox, _openHelpbox] = useState(false);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const { server } = useDorothy();

  const { currentCommunity } = useRouter();

  const queryClient = useQueryClient();

  const [entity, _entity] = useState(emptyEntity);
  const [originalEntity, _originalEntity] = useState(null);

  const [editing, _editing] = useState(false);

  const [errors, _errors] = useState({});

  const [confirm, _confirm] = useState(false);

  const [data_loaded, _data_loaded] = useState(false);

  const [helpbox_description, _helpbox_description] = useState('');

  const { data } = useQuery(`content/${id}`, { enabled: !!id && id !== 'novo' });

  const { data: helpbox } = useQuery(`helpbox/content/${id}`, {
    enabled: !!id && id !== 'novo',
  });

  const mutation = useMutation(
    entity => {
      if (entity.id) {
        /* edit */
        return axios.put(`${server}content/${entity.id}`, entity);
      } else {
        /* insert */
        // entity.communityId = currentCommunity.id;
        return axios.post(`${server}content`, entity);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(`content/${id}`); // TODO: precisa?
        queryClient.invalidateQueries('contents_list');
        queryClient.invalidateQueries(`helpbox/content/${id}`);
      },
    },
  );

  useEffect(() => {
    _editing(false);
    _errors({});

    _entity(emptyEntity);
  }, [id]);

  useEffect(() => {
    if (!data) return;

    _entity({ ...data, helpbox });
    _originalEntity({ ...data, helpbox });

    _data_loaded(true);

  }, [data, helpbox]);

  useEffect(() => {

    if (!entity.helpbox) return;

    const helpbox = entity.helpbox;

    let hd = '';

    if (entity.portal === 'pppzcm' && !!helpbox.type) hd = helpbox.type === 'indic' ? getDescription(helpbox?.keyref) : secureFindIndex(formFields[helpbox.type], helpbox.keyref, 1);
    else if (entity.portal === 'pppzcm') hd = secureFindIndex(formFields['other'], helpbox.keyref, 1);
    else if (entity.portal !== 'none') hd = !!entity.portal ? secureFindIndex(dynamicContents[entity.portal], helpbox.keyref, 1) : '';

    _helpbox_description(hd);

  }, [entity.helpbox, entity.portal]);

  useEffect(() => {
    _originalEntity(id !== 'novo' ? data : emptyEntity);
  }, [id, data]);

  const getDescription = keyref => {
    if (!keyref) return '';

    // split the keyref
    const [lae_id, indic_id, question_id] = keyref.split('.');

    const lae = LAEs.find(lae => lae.id === parseInt(lae_id))?.title;
    const indicObj = INDICs.find(indic => indic.id === parseInt(indic_id));
    const indic = indicObj?.name;
    const question =
      question_id === 'base'
        ? indicObj?.base_question
        : indicObj?.questions.find(question => question.id === parseInt(question_id))?.title;

    return `${lae} ${indic ? `>> ${indic}` : ''} ${question ? `>> ${question}` : ''}`.trim();
  };

  const handleFieldChange = field => value => {
    _editing(true);

    /* Protecao para comportamento inicil do CKEditor */
    if (field === 'text' && id !== 'novo' && !data_loaded) return;

    let newEntity = { ...entity, [field]: value };

    if (field === 'portal') {
      newEntity.helpbox = emptyEntity.helpbox;
      _errors(errors => ({ ...errors, portal: false }))
    }

    if (field === 'type') {
      newEntity.title = '';
      newEntity.featured_images = '';
      newEntity.categories = [];
      newEntity.tags = [];
    }

    if (field === 'helpbox') {
      newEntity.title = value?.description || '';
    }

    console.log(`changing ${field}:`, value, newEntity);
    _entity(newEntity);
  };

  const handleSave = async () => {
    _editing(false);

    let hasErrors = false;
    let newErrors = {};

    if (!entity.title) {
      newErrors.title = true;
      hasErrors = true;
    }

    if (entity.portal === 'none') {
      newErrors.portal = true;
      hasErrors = true;
    }

    if (entity.level === 1 && !entity.featured_images.length) {
      newErrors.featured_images = true;
      hasErrors = true;
    }

    if (hasErrors) {
      _errors(newErrors);

      enqueueSnackbar('Alguns campos obrigatórios não foram preenchidos!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });

      return;
    }

    const snackKey = enqueueSnackbar('Gravando...', {
      /* variant: 'info', */
      /* hideIconVariant: true, */
      persist: true,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
    });

    /* save */
    try {
      /* const { data: response } =  */await mutation.mutateAsync(entity);

      // console.log('response:', response);

      onSave(!_.isEqual(originalEntity, entity));

      closeSnackbar(snackKey);

      enqueueSnackbar('Registro gravado com sucesso!', {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
        action: snackKey => (
          <>
            <Button size="small" className={'button-link'} onClick={() => closeSnackbar(snackKey)}>
              <Cancel />
            </Button>
          </>
        ),
      });
    } catch (error) {
      closeSnackbar(snackKey);

      console.error(error);

      enqueueSnackbar('Erro ao gravar o registro!', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  };

  const handleClose = () => {
    // ignore helpbox
    let oEt = originalEntity;
    delete oEt.helpbox;
    let et = entity;
    delete et.helpbox;

    /* verificar se ha alteracao */
    if (!_.isEqual(oEt, et)) {
      _confirm(true);
      return;
    }

    onClose();
  };

  const handleConfirmation = response => {
    _confirm(false);
    if (response === 'confirm') onClose();
  };

  /* const handleGenerateHTML = () => {
        console.log(content)
    } */

  const handleGetImageFromGallery = target => () => {
    _galleryTarget(target);
    _openGallery(true);
  };

  const handleSelected = source => {
    // console.log({ selected  })
    if (galleryTarget === 'wysiwyg') editor.current.execute('insertImage', { source });
    else handleFieldChange('featured_images')(source);

    _openGallery(false);
  };

  const handleIndicatorKeyRef = selectedIndicator => {
    if (!selectedIndicator) return;

    handleFieldChange('helpbox')(selectedIndicator);
  };

  /* const handleNewTag = (name) => {
        console.log({ tag: name })
    } */

  const handleOpenHelpbox = () => {
    if (entity.portal === 'none') {
      _errors(errors => ({ ...errors, portal: true }));
      return;
    }
    _openHelpbox(true)
  }

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle
          title={
            <>
              <span className={styles.contents} onClick={handleClose}>
                Conteúdos
              </span>
              {' » '}
              {id === 'novo' && !entity?.title.length ? 'Novo' : entity?.title}
            </>
          }
        />

        <div className="page-header-buttons">
          <div className={styles['header-buttons']}>
            <button className="button-outline" onClick={handleClose}>
              Voltar
            </button>
            <button className="button-primary" onClick={handleSave}>
              Gravar
            </button>
          </div>
        </div>
      </div>
      <div className="page-content">
        <div className="page-body">
          <Card title="" headerless bottom>
            <div className="p-3">
              <div className="row">
                <div className="col-md-3">
                  <SimpleSelect
                    label="Portal"
                    value={entity.portal}
                    onChange={e => handleFieldChange('portal')(e.target.value)}
                    style={{ minWidth: '120px' }}
                    options={[
                      { value: 'none', title: ' -- selecione -- ' },
                      { value: 'main', title: 'Principal' },
                      { value: 'monitoraea', title: 'MonitoraEA' },
                      { value: 'pp', title: 'MonitoraEA-Políticas públicas' },
                      { value: 'pppzcm', title: 'MonitoraEA-PPPZCM' },
                      { value: 'ciea', title: 'MonitoraEA-CIEA' },
                      { value: 'risco', title: 'MonitoraEA-Risco Climático' },
                      { value: 'anppea', title: 'ANPPEA' },
                    ]}
                    error={errors.portal}
                  />
                </div>
                <div className="col-md-2">
                  <SimpleSelect
                    label="Tipo de conteúdo"
                    value={entity.type}
                    onChange={e => handleFieldChange('type')(e.target.value)}
                    style={{ minWidth: '120px' }}
                    options={[
                      { value: 'news', title: 'Novidade' },
                      { value: 'page', title: 'Página' },
                      { value: 'helpbox', title: 'Conteúdo auxiliar' },
                      { value: 'learning', title: 'Processo formativo' },
                      { value: 'publication', title: 'Publicação' },
                      { value: 'faq', title: 'Pergunta frequente' },
                    ]}
                  />
                </div>
                {entity.type !== 'helpbox' && (<div className="col-md-5">
                  <TextField
                    className="input-text"
                    label="Título"
                    shrink="false"
                    value={entity.title}
                    onChange={e => handleFieldChange('title')(e.target.value)}
                    error={!editing && errors.title}
                  />
                </div>)}
                <div className="col-md-2">
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!entity.published}
                          onChange={e => handleFieldChange('published')(e.target.checked)}
                        />
                      }
                      label="Publicado"
                    />
                  </FormGroup>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <CKEditor
                    editor={ClassicEditor}
                    config={{
                      toolbar: {
                        items: [
                          'undo',
                          'redo',
                          '|',
                          'selectAll',
                          '|',
                          'heading',
                          'style',
                          '|',
                          'bold',
                          'italic',
                          '|',
                          'horizontalLine',
                          'link',
                          'insertTable',
                          'blockQuote',
                          'codeBlock',
                          '|',
                          'alignment',
                          '|',
                          'bulletedList',
                          'numberedList',
                          'multiLevelList',
                          'todoList',
                          'indent',
                          'outdent',
                          '|',
                          'accessibilityHelp'
                        ],
                        shouldNotGroupWhenFull: false
                      },
                      plugins: [
                        AccessibilityHelp,
                        Alignment,
                        AutoLink,
                        Autosave,
                        BlockQuote,
                        Bold,
                        CodeBlock,
                        Essentials,
                        GeneralHtmlSupport,
                        Heading,
                        HorizontalLine,
                        ImageBlock,
                        ImageCaption,
                        ImageInline,
                        ImageResize,
                        ImageStyle,
                        ImageTextAlternative,
                        ImageToolbar,
                        Indent,
                        IndentBlock,
                        Italic,
                        Link,
                        List,
                        ListProperties,
                        Paragraph,
                        SelectAll,
                        Style,
                        Table,
                        TableCaption,
                        TableCellProperties,
                        TableColumnResize,
                        TableProperties,
                        TableToolbar,
                        TodoList,
                        Undo
                      ],
                      heading: {
                        options: [
                          {
                            model: 'paragraph',
                            title: 'Paragraph',
                            class: 'ck-heading_paragraph'
                          },
                          {
                            model: 'heading1',
                            view: 'h1',
                            title: 'Heading 1',
                            class: 'ck-heading_heading1'
                          },
                          {
                            model: 'heading2',
                            view: 'h2',
                            title: 'Heading 2',
                            class: 'ck-heading_heading2'
                          },
                          {
                            model: 'heading3',
                            view: 'h3',
                            title: 'Heading 3',
                            class: 'ck-heading_heading3'
                          },
                          {
                            model: 'heading4',
                            view: 'h4',
                            title: 'Heading 4',
                            class: 'ck-heading_heading4'
                          },
                          {
                            model: 'heading5',
                            view: 'h5',
                            title: 'Heading 5',
                            class: 'ck-heading_heading5'
                          },
                          {
                            model: 'heading6',
                            view: 'h6',
                            title: 'Heading 6',
                            class: 'ck-heading_heading6'
                          }
                        ]
                      },
                      htmlSupport: {
                        allow: [
                          {
                            name: /^.*$/,
                            styles: true,
                            attributes: true,
                            classes: true
                          }
                        ]
                      },
                      image: {
                        toolbar: [
                          'toggleImageCaption',
                          'imageTextAlternative',
                          '|',
                          'imageStyle:inline',
                          'imageStyle:wrapText',
                          'imageStyle:breakText',
                          '|',
                          'resizeImage'
                        ]
                      },
                      link: {
                        addTargetToExternalLinks: true,
                        defaultProtocol: 'https://',
                        decorators: {
                          toggleDownloadable: {
                            mode: 'manual',
                            label: 'Downloadable',
                            attributes: {
                              download: 'file'
                            }
                          }
                        }
                      },
                      list: {
                        properties: {
                          styles: true,
                          startIndex: true,
                          reversed: true
                        }
                      },
                      placeholder: 'Type or paste your content here!',
                      style: {
                        definitions: [
                          {
                            name: 'Article category',
                            element: 'h3',
                            classes: ['category']
                          },
                          {
                            name: 'Title',
                            element: 'h2',
                            classes: ['document-title']
                          },
                          {
                            name: 'Subtitle',
                            element: 'h3',
                            classes: ['document-subtitle']
                          },
                          {
                            name: 'Info box',
                            element: 'p',
                            classes: ['info-box']
                          },
                          {
                            name: 'Side quote',
                            element: 'blockquote',
                            classes: ['side-quote']
                          },
                          {
                            name: 'Marker',
                            element: 'span',
                            classes: ['marker']
                          },
                          {
                            name: 'Spoiler',
                            element: 'span',
                            classes: ['spoiler']
                          },
                          {
                            name: 'Code (dark)',
                            element: 'pre',
                            classes: ['fancy-code', 'fancy-code-dark']
                          },
                          {
                            name: 'Code (bright)',
                            element: 'pre',
                            classes: ['fancy-code', 'fancy-code-bright']
                          }
                        ]
                      },
                      table: {
                        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
                      },
                      initialData: '',
                    }}
                    data={entity.text}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      handleFieldChange('text')(data);
                    }}
                    onReady={ed => {
                      editor.current = ed;
                    }}
                  />
                  {/* <button onClick={handleGenerateHTML}>Gerar HTML</button> */}

                  <button onClick={handleGetImageFromGallery('wysiwyg')}>Abrir galeria de imagens</button>

                  {/* <div dangerouslySetInnerHTML={{ __html: content }}></div> */}
                </div>
              </div>
              {['news', 'learning', 'publication', 'page'].includes(entity.type) && (
                <>
                  <div className="row">
                    <div className="col-xs-4">
                      <AsyncAutocompleteMultiple
                        label="Categorias"
                        url="content_category/related"
                        urlSingle="content_category"
                        query={`?communityId=${currentCommunity.id}`}
                        onChange={handleFieldChange('categories')}
                        value={entity.categories}
                        multiple
                      />
                    </div>
                    <div className="col-md-2">
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={entity.level === 1}
                              onChange={e => handleFieldChange('level')(e.target.checked ? 1 : 0)}
                            />
                          }
                          label="Destaque"
                        />
                      </FormGroup>
                    </div>
                    {/* <div className="col-xs-4">
                                <AsyncAutocompleteSuggest
                                    label="Tags"
                                    url="content_tag/related"
                                    urlSingle="content_tag"
                                    query={`?communityId=${currentCommunity.id}`}
                                    onChange={handleFieldChange('tags')}
                                    value={entity.categories}
                                    multiple
                                    creatable={true}
                                    onCreate={name => handleNewTag(name)}
                                />
                            </div> */}
                  </div>

                  {(['news', 'learning', 'publication'].includes(entity.type) || (entity.type === 'page' && entity.level === 1)) && (
                    <div className="row">
                      <div className="col-md-6">
                        <TextField
                          className="input-text"
                          label="Imagem de destaque"
                          shrink="false"
                          value={entity.featured_images}
                          onChange={e => handleFieldChange('featured_images')(e.target.value)}
                          error={!editing && errors.featured_images}
                          InputProps={{
                            endAdornment: (
                              <>
                                {entity.featured_images !== '' && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      aria-label="image gallery"
                                      onClick={() => handleFieldChange('featured_images')('')}
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </InputAdornment>
                                )}
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="image gallery"
                                    onClick={handleGetImageFromGallery('featured')}
                                  >
                                    <ImageIcon />
                                  </IconButton>
                                </InputAdornment>
                              </>
                            ),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {entity.type === 'helpbox' && (
                <div className="row">
                  <div className="col-md-3">
                    <button className={'button-primary'} onClick={handleOpenHelpbox}>
                      <Layout />
                      {`${entity.helpbox?.keyref ? 'Alterar' : 'Selecionar'} vínculo`}
                    </button>
                  </div>
                  <div className="col-md-9">
                    <p className={styles.indicator_description}>
                      <span>{entity.helpbox?.type ? types[entity.helpbox?.type] : portals[entity.portal] || ''}: {helpbox_description || ''}</span>
                    </p>
                  </div>
                </div>
              )}

              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
            </div>
          </Card>

          <Gallery open={openGallery} onSelected={handleSelected} onClose={() => _openGallery(false)} />

          <Helpbox
            open={openHelpbox}
            onSelected={handleIndicatorKeyRef}
            onClose={() => _openHelpbox(false)}
            manage={true}
            portal={entity.portal}
            preselectedType={entity.helpbox?.type}
          />

          <ConfirmationDialog
            open={confirm}
            content="Você deseja sair sem gravar as alterações?"
            confirmButtonText="Descartar alterações"
            onClose={handleConfirmation}
          />
        </div>
      </div>
    </div>
  );
}
