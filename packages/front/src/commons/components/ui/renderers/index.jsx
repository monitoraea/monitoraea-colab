import dayjs from 'dayjs';
import NumberFormat from 'react-number-format';
import { Checkbox } from '@mui/material';
import { parseTime } from './../../../../utils';

// eslint-disable-next-line no-unused-vars
import styles from './renderers.module.scss';

export function Date({ value, format = 'DD/MM/YYYY' }) {
  return !value ? null : dayjs(value).format(format);
}

export function Float({ value, ...rest }) {
  return (
    <NumberFormat
      displayType={'text'}
      value={value}
      decimalSeparator=","
      thousandSeparator="."
      fixedDecimalScale={true}
      decimalScale={2}
      {...rest}
    />
  );
}

export function Money({ value, ...rest }) {
  return (
    <NumberFormat
      displayType={'text'}
      value={value}
      decimalSeparator=","
      thousandSeparator="."
      fixedDecimalScale={true}
      decimalScale={2}
      prefix="R$"
      {...rest}
    />
  );
}

export function ID({ value }) {
  return <>{value ? `#${value}` : '+'}</>;
}

export function Delay({ value, ...rest }) {
  return parseTime(value);
}

export function NullableBoolean({ value }) {
  return <>{value ? 'Sim' : 'Não'}</>;
}

export function EstimationHours({ value, detailedValues = null }) {
  return (
    <>
      {value ? `${value} ${value > 1 ? 'horas' : 'hora'}` : 'sem estimativa'}
      {detailedValues && (
        <small className={styles.estimation_hours}>
          {detailedValues.map((detailed, index, { length }) => {
            return (
              <>
                {detailed.estimation_type}: {EstimationHours({ value: detailed.hours })}
                {index + 1 !== length && ' | '}
              </>
            );
          })}
        </small>
      )}
    </>
  );
}

// TODO: suggestion to implement. expectedResultTypeRenderer: can be used to determine if a Checkbox is expected or text with 'Yes or No'
export function Bool({ value, row, index, expectedResultTypeRenderer = 'text', enabled, onChangeEventHandler }) {
  let polishedResult = '';

  switch (expectedResultTypeRenderer) {
    case 'checkbox':
      polishedResult = (
        <>
          <Checkbox
            checked={value}
            onChange={onChangeEventHandler}
            disabled={!enabled}
            size="small"
            inputProps={{
              'data-row': row,
              'data-index': index,
            }}
          />
        </>
      );
      break;
    case 'text':
    default:
      polishedResult = value ? 'Sim' : 'Não';
  }

  return <>{polishedResult}</>;
}
