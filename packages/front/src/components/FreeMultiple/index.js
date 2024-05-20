import { useEffect, useState } from 'react';
import { TextField, Tooltip, IconButton } from '@mui/material';
/* components */
import Plus from './../../components/icons/Plus';
import Trash from './../../components/icons/Trash';
import XCircle from '../../components/icons/XCircle';
/* styles */
import styles from './FreeMultiple.module.scss';

const FreeMultiple = ({ onChange, data, sectionTitle, hasError }) => {
  const [dataObjArr, _dataObjArr] = useState([]);

  useEffect(() => {
    if (!data) _dataObjArr([]);
    else _dataObjArr(data.split('\n'));
  }, [data]);

  const createNewLine = () => {
    _dataObjArr([...dataObjArr, '']);
  };

  const removeLine = index => {
    dataObjArr.splice(index, 1);
    _dataObjArr([...dataObjArr]);

    onChange([...dataObjArr].join('\n'));
  };

  const handleChange = (index, newValue) => {
    let newObjArr = [...dataObjArr];
    newObjArr[index] = newValue;
    _dataObjArr(newObjArr);

    onChange(newObjArr.join('\n'));
  };

  return (
    <>
      {sectionTitle && (
        <div className="section-header">
          <div className="section-title">
            <div className={styles.title}>
              {hasError && (
                <div className={`mr-2 ${styles.error}`}>
                  <XCircle />
                </div>
              )}
              {sectionTitle}
            </div>
          </div>
          <div className="section-actions">
            <button className="button-outline" onClick={() => createNewLine()}>
              <Plus></Plus>
              Adicionar
            </button>
          </div>
        </div>
      )}

      {!sectionTitle && (
        <div className={styles.new_line}>
          <button className="button-outline" onClick={() => createNewLine()}>
            <Plus></Plus>
            Adicionar
          </button>
        </div>
      )}

      {dataObjArr &&
        dataObjArr.map((row, index) => {
          return (
            <div key={index}>
              <div className="row mb-3" key={index}>
                <div className="col-xs-11">
                  <TextField
                    className="input-text"
                    value={row}
                    onChange={e => handleChange(index, e.target.value)}
                    multiline
                    minRows={1}
                    maxRows={5}
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

export default FreeMultiple;
