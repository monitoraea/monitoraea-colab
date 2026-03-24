import React, { useState, useEffect, Fragment } from 'react';

import { useDorothy } from 'dorothy-dna-react';
import removeAccents from 'remove-accents';
import { v4 as uuidv4 } from 'uuid';

import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions }  from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import axios from 'axios';

import { useQuery } from 'react-query';
typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const filter = createFilterOptions();

let timer;
export default function RealAsyncAutocomplete({
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
    /* hooks */
    const { server } = useDorothy();

    const [open, _open] = useState(false);
    const [options, _options] = useState([]);
    const [localValue, _localValue] = useState(null);
    const [inputValue, _inputValue] = useState('');
    const [debouncedInputValue, _debouncedInputValue] = useState('');

    const [creating, _creating] = useState(false);

    const { data: selected, isLoading: isLoadingSelected } = useQuery(`${urlSingle ? urlSingle : url}/${value}`, {
        enabled: !!value && !rest.freeSolo,
    });
    const { data, isLoading: isLoadingList } = useQuery(['org_candidates', { url, debouncedInputValue, query }], {
        queryFn: async () => (await axios.get(`${server}${url}/?&filter=${debouncedInputValue}${query}`)).data,
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

    useEffect(() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            // console.log({ inputValue })
            _debouncedInputValue(inputValue);
        }, 500)
    }, [inputValue])

    const handleChange = async (_, value) => {
        if (value && value.inputValue) {
            _creating(true);
            // só acontece quando cria
            value = {
                id: uuidv4(),
                name: value.inputValue,
            }
            onCreate(value);
            _creating(false);
        } else {
            onChange(value ? value.id : null /* id da entidade */, value ? value : null /* entidade completa */);
        }

        _localValue(value);
    };

    const handleInputChange = (event, newInputValue) => {
        _inputValue(newInputValue);
    }

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
                onInputChange={handleInputChange}
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
                    const isExisting = options.some(option => {
                        return removeAccents(inputValue?.trim().toLocaleLowerCase()) === removeAccents(option.name?.trim().toLocaleLowerCase())
                    });
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
