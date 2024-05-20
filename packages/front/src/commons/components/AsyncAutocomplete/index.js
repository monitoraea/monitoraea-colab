import React, { useState, useEffect, Fragment } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useQuery } from 'react-query';

export default function AsyncAutocomplete({
  label = 'Label',
  url,
  urlSingle,
  query = '',
  value,
  titleField,
  onChange,
  disabled,
  error,
}) {
  const [open, _open] = useState(false);
  const [options, _options] = useState([]);
  const [localValue, _localValue] = useState(null);

  const { data: selected, isLoading: isLoadingSelected } = useQuery(`${urlSingle ? urlSingle : url}/${value}`, {
    enabled: !!value,
  });

  const { data, isLoading: isLoadingList } = useQuery(`${url}/${query}`, { enabled: open });

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

  const handleChange = (_, value) => {
    _localValue(value);

    onChange(value ? value.id : null);
  };

  return (
    <>
      <Autocomplete
        className="input-autocomplete"
        id="asynchronous-demo"
        disabled={disabled}
        open={open}
        onOpen={() => {
          _open(true);
        }}
        onClose={() => {
          _open(false);
        }}
        onChange={handleChange}
        value={localValue}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={option => (titleField ? option[titleField] : option.name)}
        options={options}
        noOptionsText="Nenhuma opção"
        loading={isLoadingSelected || isLoadingList}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
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
    </>
  );
}
