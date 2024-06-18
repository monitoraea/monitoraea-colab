/* libs */
import { useEffect, useState } from 'react';

/* mui */
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

/* styles */
import styles from './cms.module.scss';

/*  */
import { INDICs, LAEs } from './../../indics';
import ContentRenderer from './../../commons/components/ContentRenderer';

import { formFields } from './formFields';
import { dynamicContents } from './dynamicContents';

export default function Helpbox({ open, onSelected, onClose, manage = false, content = null, preselectedType, portal }) {
  const [helpboxType, _helpboxType] = useState(null);

  useEffect(() => {
    if (!!preselectedType) _helpboxType(preselectedType)
  }, [preselectedType])

  useEffect(() => {
    _helpboxType(portal === 'pppzcm' ? 'indic' : null)
  }, [portal])

  const handleSelected = selectedIndicator => {
    if (!selectedIndicator) return;

    selectedIndicator['type'] = helpboxType;

    onSelected(selectedIndicator);
  };
  return (
    <>
      <Dialog
        id="helpbox_modal"
        className="modal"
        open={!!open || !!content}
        maxWidth="md"
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Caixa de ajuda </DialogTitle>
        <DialogContent dividers={true}>
          {manage && <>
            {['main', 'monitoraea','pp', 'anppea', 'ciea', 'risco'].includes(portal) && <div className="row">
              <FormLabel>
                Campos
              </FormLabel>
              <div className={`col-xs-12`}>
                <DynamicView
                  portal={portal}
                  helpboxType={helpboxType}
                  onSelected={selectedIndicator => handleSelected(selectedIndicator)}
                  onClose={onClose}
                />
              </div>
            </div>}
            {portal === 'pppzcm' && <div>
              <div className="row">
                <FormLabel id="select-helpbox">Tipo de conteúdo auxiliar:</FormLabel>
                <div className={`col-xs-12`}>
                  <RadioGroup
                    aria-labelledby="select-helpbox"
                    onChange={e => _helpboxType(e.target.value)}
                    name="helpbox-type-group"
                    value={helpboxType}
                    size="small"
                    row
                    className={`${styles.helpbox_type_radio_group}`}
                  >
                    <FormControlLabel
                      value={'info'}
                      control={<Radio />}
                      label={'informações'}
                      className={`${styles.radio_input}`}
                    />
                    <FormControlLabel
                      value={'redes'}
                      control={<Radio />}
                      label={'Redes'}
                      className={`${styles.radio_input}`}
                    />
                    <FormControlLabel
                      value={'indic'}
                      control={<Radio />}
                      label={'indicadores'}
                      className={`${styles.radio_input}`}
                    />
                    <FormControlLabel
                      value={'other'}
                      control={<Radio />}
                      label={'Outros'}
                      className={`${styles.radio_input}`}
                    />
                  </RadioGroup>
                </div>
              </div>

              {helpboxType === 'indic' && <div className="row">
                <FormLabel>
                  Árvore <small>(clique para expandir):</small>
                </FormLabel>
                <div className={`col-xs-12`}>
                  <TreeView
                    root={LAEs}
                    branches={INDICs}
                    onSelected={selectedIndicator => handleSelected(selectedIndicator)}
                    onClose={onClose}
                  />
                </div>
              </div>}

              {helpboxType !== 'indic' && <div className="row">
                <FormLabel>
                  Campos
                </FormLabel>
                <div className={`col-xs-12`}>
                  {!!helpboxType && <InfoView
                    helpboxType={helpboxType}
                    onSelected={selectedIndicator => handleSelected(selectedIndicator)}
                    onClose={onClose}
                  />}
                </div>
              </div>}
            </div>}
          </>}
          {content && <ContentRenderer text={content} />}
          {!content && !manage && <>...</>}
        </DialogContent>
        <DialogActions>
          <button onClick={onClose} autoFocus className="button-outline">
            sair
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const InfoView = ({ helpboxType, onSelected, onClose }) => {

  const handleSelected = (keyref, description) => {
    onSelected({
      keyref,
      description,
    });
    onClose();
  };

  return (
    <ul className={styles.helpbox_indicator_tree}>
      <li>
        {formFields[helpboxType]?.map(([field, title]) => <FormItem key={field} question={title} handleSelected={() => handleSelected(field, title)} />)}
      </li>
    </ul>
  );
};

const DynamicView = ({ portal, onSelected, onClose }) => {

  const handleSelected = (keyref, description) => {
    onSelected({
      keyref,
      description,
    });
    onClose();
  };

  if(!dynamicContents[portal]?.length) return (<>Não há conteúdos dinâmicos neste portal</>);

  return (
    <ul className={styles.helpbox_indicator_tree}>
      <li>
        {dynamicContents[portal].map(([field, title]) => <FormItem key={field} question={title} handleSelected={() => handleSelected(field, title)} />)}
      </li>
    </ul>
  );
};

const TreeView = ({ root, branches, onSelected, onClose }) => {
  useEffect(() => {
    if (!root || !branches) return;
  }, [root, branches]);

  const [childToRender, _childToRender] = useState([]);
  const [selectedLaeId, _selectedLaeId] = useState(null);

  const [questionsToRender, _questionsToRender] = useState([]);
  const [selectedIndicId, _selectedIndicId] = useState(null);

  const toggleExpandChilds = laeId => {
    _selectedLaeId(laeId);
    _childToRender(branches.filter(branch => branch.lae_id === laeId));
  };

  const toggleExpandQuestions = indic => {
    _selectedIndicId(indic.id);
    _questionsToRender(indic.questions);
  };

  const handleSelected = (keyref, { lae, indic, question }) => {
    onSelected({
      keyref,
      description: `${lae} ${indic ? `>> ${indic}` : ''} ${question ? `>> ${question}` : ''}`.trim(),
    });
    onClose();
  };

  return (
    <>
      {root && (
        <ul className={styles.helpbox_indicator_tree}>
          {root.map(lae => (
            <li key={lae.id} onClick={() => toggleExpandChilds(lae.id)}>
              <div className={styles.lae}>
                <span>
                  <strong>{lae.title}</strong>
                </span>
                <>
                  {childToRender && childToRender.length > 0 && lae.id === selectedLaeId && (
                    <div className={styles.indic}>
                      <ul>
                        {childToRender.map(indic => (
                          <li key={indic.id} onClick={() => toggleExpandQuestions(indic)}>
                            <ListItem indic={indic.name} />
                            <>
                              {questionsToRender && questionsToRender.length > 0 && indic.id === selectedIndicId && (
                                <div className={styles.questions}>
                                  <ul>
                                    <li>
                                      <ListItem
                                        question={indic.base_question}
                                        handleSelected={() =>
                                          handleSelected(`${lae.id}.${indic.id}.base`, {
                                            lae: lae.title,
                                            indic: indic.name,
                                            question: indic.base_question,
                                          })
                                        }
                                      />
                                    </li>
                                    {questionsToRender.map(question => (
                                      <li key={question.id}>
                                        <ListItem
                                          question={question.title}
                                          handleSelected={() =>
                                            handleSelected(`${lae.id}.${indic.id}.${question.id}`, {
                                              lae: lae.title,
                                              indic: indic.name,
                                              question: question.title,
                                            })
                                          }
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const ListItem = ({ question, indic, handleSelected }) => {
  return (
    <>
      <div className={styles.indic_to_select}>
        <span>
          {indic && <>{indic}</>}
          {question && <em>{question}</em>}
        </span>
        {handleSelected && (
          <button className="button-primary" onClick={handleSelected}>
            selecionar
          </button>
        )}
      </div>
    </>
  );
};

const FormItem = ({ question, handleSelected }) => {
  return (
    <>
      <div className={styles.indic_to_select}>
        <span>
          {question && <em>{question}</em>}
        </span>
        {handleSelected && (
          <button className="button-primary" onClick={handleSelected}>
            selecionar
          </button>
        )}
      </div>
    </>
  );
};
