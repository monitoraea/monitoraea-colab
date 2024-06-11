import { useState, useEffect, Fragment } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useQuery } from 'react-query';

export default function AsyncAutocomplete({ label = 'Label', url, query = '', value, titleField, onChange, error }) {
  const [open, _open] = useState(false);
  const [options, _options] = useState([]);
  const [localValue, _localValue] = useState([]);

  const { data, isLoading: isLoadingList } = useQuery(`${url}/${query}`, { enabled: open });

  useEffect(() => {
    if (!data) _options([]);
    else _options(data.list);
  }, [data]);

  useEffect(() => {
    if (!value) _localValue([]);
    else _localValue(value);
  }, [value]);

  const handleChange = (_, value) => {
    _localValue(value);

    onChange(value);
  };

  return (
    <>
      <Autocomplete
        className="input-autocomplete"
        id="asynchronous-demo"
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
        loading={isLoadingList}
        multiple={true}
        filterSelectedOptions={true}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            error={error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <Fragment>
                  {isLoadingList ? <CircularProgress color="inherit" size={20} /> : null}
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
