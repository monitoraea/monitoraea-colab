import React, { useState, useEffect } from "react";
import { Select, MenuItem } from "@mui/material";
import DatePicker from '../../components/DatePicker';
import Plus from '../icons/Plus';

import XSquare from '../icons/XSquare';

import styles from "./styles.module.scss";

export default function Filters({ filters, onChange, options, dateRange = true }) {
  const [usedOptions, _usedOptions] = useState([]);
  const [showAdd, _showAdd] = useState(true);
  const [periodDisabled, _periodDisabled] = useState(false);

  const [startDate, _startDate] = useState(null);
  const [endDate, _endDate] = useState(null);

  const [activeFilters, _activeFilters] = useState([]);

  useEffect(() => {
    const uOptions = filters
      .filter(f => f.type !== 'period')
      .map((f) => f.type)
      .filter((type) => type !== "unknown");

    const allOptionsUsed = uOptions.length === options.length;

    _usedOptions(uOptions);
    _showAdd(!allOptionsUsed && !filters.find((f) => !f.value));
  }, [filters, options, dateRange]);

  useEffect(() => {
    _activeFilters(filters.filter((f) => !!f.value));
  }, [filters]);

  /* useEffect(() => {
    console.log({ activeFilters });
  }, [activeFilters]); */

  const handleAdd = () => {
    onChange([...filters, { type: "unknown" }]);
    _showAdd(false);
  };

  const checkPeriodCompatibility = (newFilters) => {
    let hasPeriodIncompatibility = false;

    const uOptions = newFilters
      .filter((f) => f.value && f.type !== "unknown")
      .map((f) => f.type);

    for (let uo of uOptions) {
      if (
        options.find(
          (o) => o.type === uo && o.incompatibleWith.includes("period")
        )
      ) {
        hasPeriodIncompatibility = true;
        break;
      }
    }

    if (hasPeriodIncompatibility) {
      _startDate(null);
      _endDate(null);
    }
    _periodDisabled(hasPeriodIncompatibility);

    return hasPeriodIncompatibility;
  };

  const handleFilterChange = (filter, index) => {
    let newFilters = [...filters];
    newFilters[index] = filter;

    // verifica incompatibilidae
    if (!!filter.value) {
      const opFound = options.find((o) => o.type === filter.type);
      if (opFound.incompatibleWith) {
        newFilters = newFilters.filter(
          (nf) => !opFound.incompatibleWith.includes(nf.type)
        );
      }
    }

    const pIncompatibility = checkPeriodCompatibility(newFilters);
    if(pIncompatibility) newFilters = newFilters.filter(f => f.type !== 'period');
    onChange(newFilters);
  };

  const remove = (index) => {
    let newFilters = filters.filter((_, i) => i !== index);

    checkPeriodCompatibility(newFilters);
    onChange(newFilters);
  };

  const handlePeriodChange = (sDate, eDate) => {
    _startDate(sDate);
    _endDate(eDate);

    let newFilters = [...filters.filter(f => f.type !== 'period'), { type: 'period', value: [sDate, eDate] }];

    onChange(newFilters);
  };  

  return (
    <div className={`${styles.sidebar_filters}`}>
      {dateRange && (
        <div className={`${styles.filter_group}`}>
          <div className={`${styles.group_title}`}>Período</div>
          <DateRangePicker
            disabled={periodDisabled}
            startDate={startDate}
            endDate={endDate}
            onChange={handlePeriodChange}
            className="input-datepicker"
          />
        </div>
      )}
      <div className={`${styles.filter_group}`}>
        <div className={`${styles.group_title}`}>Filtros</div>
        {filters.map((f, i) => {
          if(f.type === 'period') return null;
          
          return <div key={f.type}>
            {i > 0 && <hr className="hr-spacer" />}
            <Filter
              onFilterChange={(f) => handleFilterChange(f, i)}
              onRemove={() => remove(i)}
              options={options}
              usedOptions={usedOptions}
              filters={activeFilters}
              {...f}
            />
          </div>
        })}
      {showAdd && filters.length > 0 && <hr className="hr-spacer" />}
      {showAdd && <AddFilter onClick={handleAdd} />}
      </div>
    </div>
  );
}

function Filter({
  options,
  filters,
  usedOptions,
  type,
  value,
  onFilterChange,
  onRemove
}) {
  const [localType, _localType] = useState("unknown");

  useEffect(() => {
    if (!type) return;

    _localType(type);
  }, [type]);

  /* 
  useEffect(() => {
    if (!chooserComponent) return;

    console.log(chooserComponent);
  }, [chooserComponent]); 
  */

  let Chooser = null;
  let chooserProps = {};
  const optionSelected = options.find((o) => o.type === localType);
  if (optionSelected && optionSelected.chooser){
    Chooser = optionSelected.chooser;
    if(optionSelected.chooserProps) chooserProps = optionSelected.chooserProps;
  }

  const handleChange = (e) => {
    _localType(e.target.value);

    const optionSelected = options.find((o) => o.type === e.target.value);

    let newValue = null;
    if (optionSelected && !optionSelected.chooser) newValue = true;

    onFilterChange({ type: e.target.value, value: newValue });
  };

  const handleChooserChange = (value) => {
    onFilterChange({ type: localType, value });
  };

  return (
    <div className={`${styles.choose_filter}`}>
      <div className={`${styles.filter}`}>
        <Select
          className="input-select"
          fullWidth
          value={localType}
          onChange={handleChange}
        >
          <MenuItem value={"unknown"}>escolha um filtro</MenuItem>
          {options
            ?.filter((o) => !usedOptions.includes(o.type) || o.type === type)
            .map((o) => (
              <MenuItem key={o.type} value={o.type}>
                {o.title}
              </MenuItem>
            ))}
        </Select>
        <div className={`${styles.remove}`} onClick={onRemove}>
        <XSquare/>
      </div>
      </div>

      {!!Chooser && (
          <div className={`${styles.filter_option}`}>
            <Chooser onChange={handleChooserChange} {...chooserProps} filters={filters} value={value} />
          </div>
        )}

    </div>
  );
}

function AddFilter({ onClick }) {
  return (
    <div className={`${styles.add_filter}`}onClick={onClick}>
      <div>filtrar por</div>
      <Plus></Plus>
    </div>
  );
}

function DateRangePicker({
  /* noValueTextIni = "desde o inicio",
  noValueTextEnd = "até hoje", */
  disabled = false,
  startDate: sDate,
  endDate: eDate,
  onChange
  
}) {
  const [iniDate, _iniDate] = useState(null);
  const [endDate, _endDate] = useState(null);

  useEffect(() => {
    _iniDate(sDate);
  }, [sDate]);

  useEffect(() => {
    _endDate(eDate);
  }, [eDate]);

  return (
    <div className="input-daterangepicker">
      <DatePicker
        value={iniDate}
        onChange={(value) => onChange(value, endDate)}
        disabled={disabled}
        clearable={true}
        clearText="remover"
      />
      <div></div>
      <DatePicker
        value={endDate}
        onChange={(value) => onChange(iniDate, value)}
        minDate={iniDate}
        disabled={disabled}
        clearable={true}
        clearText="remover"
        onError={(reason) => {
          if (reason === "minDate") _endDate(null);
        }}
      />
    </div>
  );
}