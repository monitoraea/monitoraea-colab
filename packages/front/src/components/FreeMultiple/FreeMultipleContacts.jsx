import { useEffect, useState } from 'react';
import { TextField, Tooltip, IconButton } from '@mui/material';
/* components */
import Plus from '../icons/Plus';
import Trash from '../icons/Trash';
/* styles */
import styles from './FreeMultiple.module.scss';

const FreeMultipleContacts = ({ onChange, data, sectionTitle }) => {
  const [dataObjArr, _dataObjArr] = useState([]);

  useEffect(() => {
    if (!data) _dataObjArr([]);
    else _dataObjArr(data);
  }, [data]);

  const createNewLine = () => {
    _dataObjArr([
      ...dataObjArr,
      {
        tel: '',
        nome: '',
        email: '',
      },
    ]);
  };

  const removeLine = index => {
    dataObjArr.splice(index, 1);
    _dataObjArr([...dataObjArr]);
    handleDataChange();
  };

  const handleTextChange = (field, index) => newValue => {
    let newObjArr = [...dataObjArr];
    newObjArr[index][field] = newValue;
    _dataObjArr(newObjArr);
  };

  const handleDataChange = () => {
    onChange(dataObjArr);
  };

  return (
    <>
      <div className="section-header">
        <div className="section-title">{sectionTitle}</div>
        <div className="section-actions">
          <button className="button-outline" onClick={() => createNewLine()}>
            <Plus></Plus>
            Adicionar
          </button>
        </div>
      </div>

      {dataObjArr &&
        dataObjArr.map((row, index) => {
          return (
            <div key={index}>
              <div className="row mb-3" key={index}>
                <div className="col-xs-4">
                  <TextField
                    className="input-text"
                    label="Nome"
                    value={row.nome || ''}
                    onChange={e => handleTextChange('nome', index)(e.target.value)}
                    onBlur={handleDataChange}
                  />
                </div>
                <div className="col-xs-4">
                  <TextField
                    className="input-text"
                    label="E-mail"
                    value={row.email || ''}
                    onChange={e => handleTextChange('email', index)(e.target.value)}
                    onBlur={handleDataChange}
                  />
                </div>
                <div className="col-xs-3">
                  <TextField
                    className="input-text"
                    label="Telefone"
                    value={row.tel || ''}
                    onChange={e => handleTextChange('tel', index)(e.target.value)}
                    onBlur={handleDataChange}
                  />
                </div>
                <div className="col-xs-1">
                  <div className={styles['svg-icon-box']}>
                    <div>
                      <Tooltip title="Remover">
                        <IconButton onClick={() => removeLine(index)}>
                          <Trash />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
};

export default FreeMultipleContacts;
