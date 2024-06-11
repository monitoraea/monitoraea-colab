import React from "react";

import NumberFormat from "react-number-format";

export const FloatFormat = ({ value }) => {
  return (<NumberFormat
    displayType={'text'}
    value={value}
    decimalSeparator=","
    thousandSeparator="."
    fixedDecimalScale={true}
    decimalScale={2}
  />)
}

export const MoneyFormat = ({ value }) => {
  return (
    <NumberFormat
      displayType={'text'}
      value={value}
      decimalSeparator=","
      thousandSeparator="."
      fixedDecimalScale={true}
      decimalScale={2}
      prefix="R$"
    />)
}

export function shortFloatFormat(value) {
  let formattedValue = value;
  let suffix = '';

  if (formattedValue > 1000000000) {
    formattedValue = Math.ceil(formattedValue / 1000000000);
    suffix = 'B';
  } else if (formattedValue > 1000000) {
    formattedValue = Math.ceil(formattedValue / 1000000);
    suffix = 'MM';
  } else if (formattedValue > 1000) {
    formattedValue = `${Math.trunc(formattedValue / 1000)}.${Math.trunc(formattedValue % 1000)}`
  } else {
    formattedValue = Math.trunc(formattedValue)
  }

  return {
    formattedValue,
    suffix,
    full: `${formattedValue}${suffix}`,
  }
}

export const ShortFloatFormat = ({ value }) => {
  const { formattedValue, suffix } = shortFloatFormat(value);

  return (<>{formattedValue}<span className="suffix">{suffix}</span></>)
}

export const ShortMoneyFormat = ({ value }) => {
  return (<><span className="prefix">R$</span><ShortFloatFormat value={value} /></>)
}

export const BNMoneyFormat = ({ value }) => {
  return (
    <>
      <span className="prefix">R$</span>
      <NumberFormat
        displayType={'text'}
        value={value}
        decimalSeparator=","
        thousandSeparator="."
        fixedDecimalScale={true}
        decimalScale={0}
      />
    </>)
}