import { useEffect, useState, cloneElement } from 'react';
import { TextField, Tooltip, IconButton } from '@mui/material';
/* components */
import Plus from '../icons/Plus';
import Trash from '../icons/Trash';
/* styles */
import styles from './styles.module.scss';

const GenericMultiple = ({
  children,
  data,
  newData,
  sectionTitle,
  addtype = 'top',
  addtitle = 'Adicionar',
  onFieldChange /* optional */,
  onChange
}) => {
  const [dataObjArr, _dataObjArr] = useState([]);

  useEffect(() => {
    if (!data) _dataObjArr([]);
    else _dataObjArr(data);
  }, [data]);

  const createNewLine = () => {
    _dataObjArr([
      ...dataObjArr,
      { ...newData },
    ]);
  };

  const removeLine = index => () => {
    dataObjArr.splice(index, 1);
    _dataObjArr([...dataObjArr]);
    handleDataChange();
  };

  const handleChange = index => field => value => {
    let newObjArr;

    if (!!onFieldChange && typeof onFieldChange === 'function') newObjArr = onFieldChange(); /* custom data change */
    else {
      newObjArr = [...dataObjArr]
      newObjArr[index][field] = value;
    }
    _dataObjArr(newObjArr);
  };

  const handleDataChange = () => { /* TODO: é necessário */
    /* onChange(dataObjArr); */
  };

  return (
    <>
      {(!!sectionTitle || addtype === 'top') && <div className="section-header">
        {!!sectionTitle && <div className="section-title">{sectionTitle}</div>}
        <div className="section-actions">
          <button className="button-outline" onClick={() => createNewLine()}>
            <Plus></Plus>
            {addtitle}
          </button>
        </div>
      </div>}

      {dataObjArr &&
        dataObjArr.map((row, index) => {
          /* create Children w/ properties */
          const Children = cloneElement(children, {
            row,
            index,
            DefaultRemove: <DefaultRemove index={index} removeLine={removeLine(index)} />,
            handleChange: handleChange(index),
            handleRemove: removeLine(index), /* custom remove */
          })

          return (
            <div key={index}>
              {Children}
            </div>
          );
        })}

      {addtype === 'bottom' && <div className="section-header">
        <div className="section-actions">
          <button className="button-outline" onClick={() => createNewLine()}>
            <Plus></Plus>
            {addtitle}
          </button>
        </div>
      </div>}
    </>
  );
};

function DefaultRemove({ index, removeLine }) {
  return <div className={styles['svg-icon-box']}>
    <div>
      <Tooltip title="Remover">
        <IconButton onClick={() => removeLine(index)}>
          <Trash />
        </IconButton>
      </Tooltip>
    </div>
  </div>
}

export default GenericMultiple;