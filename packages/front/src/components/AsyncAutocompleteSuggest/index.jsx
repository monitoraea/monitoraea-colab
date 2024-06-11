import React, { useState, useEffect, Fragment } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useQuery } from 'react-query';

const filter = createFilterOptions();

export default function AsyncAutocompleteSuggest({
  label = null,
  url,
  urlSingle,
  query = '',
  value,
  invalidText,
  titleField,
  onChange,
  disabled,
  error,
  creatable = false,
  creatableFormat = 'Adicionar "INPUTVALUE"',
  onCreate,
  inputWidth, /* TODO: workaround - remover!! */
  placeholder,
  ...rest
}) {
  const [open, _open] = useState(false);
  const [options, _options] = useState([]);
  const [localValue, _localValue] = useState(null);

  const [creating, _creating] = useState(false);

  const { data: selected, isLoading: isLoadingSelected } = useQuery(`${urlSingle ? urlSingle : url}/${value}`, {
    enabled: !!value && !rest.freeSolo,
  });

  const { data, isLoading: isLoadingList } = useQuery(`${url}/${query}`, {
    enabled: open,
  });

  useEffect(() => {
    if (!data) _options([]);
    else _options(data.list);
  }, [data]);

  useEffect(() => {
    if (!value) _localValue(null);
  }, [value]);

  useEffect(() => {
    if (!selected) return;

    _localValue(selected);
  }, [selected]);

  const handleChange = async (_, value) => {
    _creating(true);
    if (value && value.inputValue) value = await onCreate(value.inputValue);
    _creating(false);

    _localValue(value);

    onChange(value ? value.id : null /* id da entidade */, value ? value : null /* entidade completa */);
  };

  return (
    <>
      <Autocomplete
        className="input-autocomplete"
        id="asynchronous-demo"
        disabled={disabled || creating}
        open={open}
        onOpen={() => {
          _open(true);
        }}
        onClose={() => {
          _open(false);
        }}
        onChange={handleChange}
        value={localValue}
        autoHighlight
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={option => (titleField ? option[titleField] : option.name) || ''}
        options={options}
        noOptionsText="Nenhuma opção"
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          // Suggest the creation of a new value
          const isExisting = options.some(option => inputValue === option.name);
          if (creatable && inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue,
              name: creatableFormat.replace('INPUTVALUE', inputValue),
            });
          }

          return filtered;
        }}
        renderOption={(props, option) => {
          return (
            <li {...props} key={`${option.id}-${option.name}`}>
              {option.name}
            </li>
          );
        }}
        loading={isLoadingSelected || isLoadingList}
        renderInput={params => {
          if (invalidText && params.inputProps.value === '') params.inputProps.value = invalidText;
          return (
            <TextField
              sx={{
                '& legend': { display: 'none' },
                '& fieldset': { top: 0 },
                width: !!inputWidth ? inputWidth : 'inherit',
              }}
              {...params}
              label={label}
              error={error}
              placeholder={placeholder}
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
          );
        }}
        {...rest}
      />
    </>
  );
}
