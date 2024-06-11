import styled from 'styled-components';
import Select from 'react-select';
import AsyncSelect from 'react-select/async/dist/react-select.esm';

export const reactSelectClassNamePrefix = 'reactSelectStyles_' + (Math.random() + 1).toString(36).substring(7);
const makeStyledSelect = SelectComponent => styled(SelectComponent)`
  & .${reactSelectClassNamePrefix}__control {
    background-color: #F6FAF3;
    border-color: #F6FAF3;
    margin-top: 0.5rem;
    min-height: 3rem;
    border-radius: 0.5rem;

    &:hover {
      border-color: #92bff5;
    }
  }

  & .${reactSelectClassNamePrefix}__multi-value {
    background-color: #92bff5;
    border-radius: 0.5rem;
    color: #fff;
    padding: 0.1rem 0.25rem;
    text-transform: lowercase;
  }

  & .${reactSelectClassNamePrefix}__multi-value__label {
    color: #F6FAF3;
  }

  & .${reactSelectClassNamePrefix}__multi-value__remove {
    border-radius: 10px;
  }

  & .${reactSelectClassNamePrefix}__indicator {
    color: #666666;
    display:none;

    /* &:hover {
      color: 666666;
    } */
  }

  & .${reactSelectClassNamePrefix}__indicator-separator {
    background-color: transparent;
  }
`;

export const StyledReactSelect = makeStyledSelect(Select);
export const StyledAsyncReactSelect = makeStyledSelect(AsyncSelect);
