import React, { useEffect, useState } from 'react';
import { /*Popover, Radio,*/ useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// import Calendar from '../../../components/icons/Calendar';
// import { /* useOptionsStore, */ useYearsStore } from '../../../stores/visualizationsStores';

import {
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';

import { LAEs } from '../../../indics';

import AsyncAutocompleteMultiple from '../../../components/AsyncAutocompleteMultiple';

// import { useRouter } from 'dorothy-dna-react';

// import { yearsFromBeggining } from '../../../utils';

import { layoutTabletMQ } from '../../../utils/configs';

import styles from './viztabs.module.scss';

const theme = createTheme({
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        listbox: {
          position: 'absolute',
          backgroundColor: '#fff',
          boxShadow: '1px 0px 5px 0px rgba(0,0,0,0.20)',
          borderRadius: '4px',
        },
      },
    },
  },
});

export default function VisualizationsTabs({ lae_id, onLaeChange, onFiltersChange }) {
  const isLayoutTablet = useMediaQuery(layoutTabletMQ);
  // const { type, setType, region, setRegion, community, setCommunity, product, setProduct } = useOptionsStore();

  /* const { startAtYear, endAtYear, setStartAtYear, setEndAtYear } = useYearsStore();

  const handleDataRangeChange = (period) => {
    setStartAtYear(period[0]);
    setEndAtYear(period[1]);
  } */

  const [filters, _filters] = useState(null);
  const [fields, _fields] = useState({
    modalidades: null,
    regioes: null,
    ufs: null,
  });

  useEffect(() => {
    if (!!filters) onFiltersChange(filters);
  }, [filters, onFiltersChange])

  const onFilterChange = (type, selectedOption) => {

    let newFilters;
    let newFields = { ...fields, [type]: selectedOption };

    const oldFilters = filters || {};

    if (selectedOption) {
      newFilters = {
        ...oldFilters,
        [type]: selectedOption.map(s => s.value).join(','),
      };
    } else {
      newFilters = { ...oldFilters, [type]: null };
    }

    if (type === 'regioes') {
      newFields.ufs = null;
      newFilters.ufs = null;
    }
    /* if (['regioes', 'ufs'].includes(type)) {
      newFields.municipios = null;
      newFilters.municipios = null;
    } */

    _fields(newFields);
    _filters(newFilters);
  };

  const prepareFilters = (filters) => {
    let preparedFilters = '';

    for (let filter in filters) {
      if (filters[filter]) preparedFilters = `${preparedFilters}&f_${filter}=${filters[filter]}`;
    }

    return preparedFilters;
  }

  return (
    <ThemeProvider theme={theme}>
      {!isLayoutTablet && (
        <div className={styles['visualizations-tabs']}>
          <div className={styles['backdrop']}></div>
          <div className={styles['vtabs-content']}>

            <div className={styles['vtabs-actions']}>
              <div className={styles['vtabs-eachfilter']}>
                <FormControl fullWidth>
                  <Select
                    className="input-select"
                    value={lae_id}
                    onChange={(e) => onLaeChange(e.target.value)}
                  >
                    {LAEs.map(l => <MenuItem key={l.id} value={l.id}> {l.title} </MenuItem>)}
                  </Select>
                </FormControl>
              </div>

              <div className={styles.vSeparator}></div>

              {/* <div className={styles['vtabs-eachfilter']}>
                <DataRange
                  startAtYear={startAtYear}
                  endAtYear={endAtYear}
                  onChange={handleDataRangeChange}
                />
              </div> 

              <div className={styles.vSeparator}></div>*/}

              <div className={styles['vtabs-eachfilter']}>
                <div className={styles['vtabs-other']}>
                  <label>Modalidades</label>                  
                    <AsyncAutocompleteMultiple
                      label=''
                      url="modality"
                      onChange={selectedOption => onFilterChange('modalidades', selectedOption)}
                      value={fields['modalidades']}
                      placeholder="Todas"
                    />
                </div>
              </div>

              <div className={styles.vSeparator}></div>

              <div className={styles['vtabs-eachfilter']}>
                <div className={styles['vtabs-other']}>
                  <label>Regiões</label>
                  <AsyncAutocompleteMultiple
                    label=''
                    url="region"
                    onChange={selectedOption => onFilterChange('regioes', selectedOption)}
                    value={fields['regioes']}
                    placeholder="Todas"
                  />
                </div>
              </div>

              <div className={styles['vtabs-eachfilter']}>
                <div className={styles['vtabs-other']}>
                  <label>Estados</label>
                  <AsyncAutocompleteMultiple
                    label=''
                    url="project/uf_list"
                    query={`?none=1${prepareFilters(filters)}`}
                    onChange={selectedOption => onFilterChange('ufs', selectedOption)}
                    value={fields['ufs']}
                    placeholder="Todas"
                  />
                </div>
              </div>

              {/* <div className={styles['vtabs-eachfilter']}>
                <div className={styles['vtabs-other']}>
                  <label>Municípios</label>
                  <AsyncAutocompleteMultiple
                    label=''
                    url="project/uf_list"
                    query={`?none=1${prepareFilters(filters)}`}
                    onChange={selectedOption => onFilterChange('municipios', selectedOption)}
                    value={fields['municipios']}
                    placeholder="Todas"
                  />
                </div>
              </div> */}

            </div>

          </div>
        </div>
      )}
    </ThemeProvider>
  );
}

// function DataRange({ startAtYear, endAtYear, onChange }) {

//   const [anchorEl, _anchorEl] = useState(null);
//   const [chooseStartYear, _chooseStartYear] = useState(null);
//   const [chooseEndYear, _chooseEndYear] = useState(null);

//   const handleApply = () => {
//     onChange([chooseStartYear, chooseEndYear])
//     _anchorEl(null);
//   };

//   useEffect(() => {
//     _chooseStartYear(startAtYear);
//   }, [startAtYear]);

//   useEffect(() => {
//     _chooseEndYear(endAtYear);
//   }, [endAtYear]);

//   return (<div className={styles['vtabs-datefilter']}>
//     <label>Período</label>
//     <div
//       className={`${styles['vtabs-datefilter-button']} `} /* ${disabled ? styles['disabled'] : ''} */
//       aria-describedby="simple-popover"
//       onClick={(event) => { _anchorEl(event.currentTarget) }} /* if (!disabled) */
//     >
//       <Calendar />
//       {startAtYear === endAtYear ? startAtYear : `${startAtYear} - ${endAtYear}`}
//     </div>
//     <Popover
//       className={styles['vtabs-datefilter-popover']}
//       id="simple-popover"
//       open={!!anchorEl}
//       anchorEl={anchorEl}
//       onClose={() => _anchorEl(null)}
//       anchorOrigin={{
//         vertical: 'bottom',
//         horizontal: 'right',
//       }}
//     >
//       <SimpleSelect
//         value={chooseStartYear}
//         onChange={e => _chooseStartYear(e.target.value)}
//         style={{ minWidth: '120px' }}
//         options={yearsFromBeggining.map(year => ({ value: year, title: year }))}
//       />
//       <SimpleSelect
//         value={chooseEndYear}
//         onChange={e => _chooseEndYear(e.target.value)}
//         style={{ minWidth: '120px' }}
//         options={yearsFromBeggining
//           .filter(year => year >= chooseStartYear)
//           .map(year => ({ value: year, title: year }))}
//       />
//       <button className={styles['button-primary']} onClick={handleApply}>
//         aplicar
//       </button>
//     </Popover>
//   </div>)
// }