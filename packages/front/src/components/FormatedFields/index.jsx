import React from "react";

import NumberFormat from "react-number-format";

export const FloatNumberFormat = React.forwardRef(function (props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: parseFloat(values.value)
          }
        });
      }}
      decimalSeparator=","
      thousandSeparator="."
      allowNegative={false}
    /* isNumericString */
      fixedDecimalScale={true}
      decimalScale={2}
    />
  );
});

export const IntegerNumberFormat = React.forwardRef(function (props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: parseInt(values.value, 10)
          }
        });
      }}
      decimalSeparator={false}
      thousandSeparator="."
      allowNegative={false}
      /* isNumericString */
    />
  );
});

export const MoneyNumberFormat = React.forwardRef(function (props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: parseFloat(values.value)
          }
        });
      }}
      decimalSeparator=","
      thousandSeparator="."
      allowNegative={false}
      /* isNumericString */
      fixedDecimalScale={true}
      decimalScale={2}
    />
  );
});

export const CPFFormat = React.forwardRef(function (props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value
          }
        });
      }}
      format="###.###.###-##"
    />
  );
});