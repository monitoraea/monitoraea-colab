import { useState, useRef, useEffect } from 'react';
import {
  InputBase,
  Box,
  styled,
  TableBody,
  TableRow,
  TableSortLabel,
  Tooltip,
  IconButton,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Slider,
  Stack,
} from '@mui/material';

import Card from '../../components/Card';

import Search from '../../components/icons/Search';
import Eye from '../../components/icons/Eye';
import ExpandMoreIcon from '../../components/icons/chevron-down.svg?react';

import { useQuery } from 'react-query';

import axios from 'axios';
import { PageTitle } from '../../components/PageTitle/PageTitle';

import { useRouter, useDorothy } from 'dorothy-dna-react';
const InputBaseStyled = InputBase;

import styles from './styles.module.scss';

const marks = [
  {
    value: 10,
    label: '10',
  },
  {
    value: 15,
    label: '15',
  },
  {
    value: 20,
    label: '20',
  },
  {
    value: 25,
    label: '25',
  },
  {
    value: 30,
    label: '30',
  },
  {
    value: 35,
    label: '35',
  },
  {
    value: 40,
    label: '40',
  },
  {
    value: 45,
    label: '45',
  },
  {
    value: 50,
    label: '50',
  },
];

const Tool = () => {
  const { changeRoute, params } = useRouter();
  const [viewing, _viewing] = useState(null);

  useEffect(() => {
    _viewing(!params[0] ? null : params[0]);
  }, [params]);

  return (
    <>
      {!viewing && <List onSelect={id => changeRoute({ params: [id] })} />}
      {!!viewing && <View id={viewing} />}
    </>
  );
};

let timer;
const List = ({ onSelect }) => {
  const { server } = useDorothy();

  const searchInputRef = useRef(null);

  const [page, _page] = useState(1);
  const [order, _order] = useState('nome');
  const [direction, _direction] = useState('desc');
  const [perPage, _perPage] = useState(10);

  const [searchField, _searchField] = useState('');
  const [list, _list] = useState(null);
  const [filter, _filter] = useState('');

  const { data } = useQuery(['orgs_list', { page, order, direction, perPage, filter }], {
    queryFn: async () =>
      (
        await axios.get(
          `${server}organization/?page=${page}&order=${order}&direction=${direction === 'asc' ? 'desc' : 'asc'}&limit=${perPage}${filter.length ? `&filter=${filter}` : ''}`,
        )
      ).data,
  });

  useEffect(() => {
    if (data) _list(data);
  }, [data]);

  useEffect(() => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      _page(1);
      _filter(searchField);
    }, 500);
  }, [searchField]);

  const orderBy = columnName => {
    _page(1);
    if (order === columnName) _direction(direction === 'asc' ? 'desc' : 'asc');
    else {
      _order(columnName);
      _direction('desc');
    }
  };

  if (!list) return <></>;

  return (
    <div className="page width-limiter tbox-fixed">
      <div className="page-header">
        <PageTitle title={'Organizações (' + list.total + ')'} />
      </div>

      <div className="page-content">
        <div className="page-body">
          <div className="tablebox">
            <div className="tbox-header">
              <InputBaseStyled
                spellCheck="false"
                className="tbox-search"
                startAdornment={<Search onClick={() => searchInputRef.current?.focus()} />}
                inputRef={searchInputRef}
                placeholder="Pesquisar..."
                inputProps={{ 'aria-label': 'pesquisar grupos' }}
                value={searchField}
                onChange={e => _searchField(e.target.value)}
              />
            </div>
            <div className="tbox-body">
              <table className="tbox-table">
                <thead>
                  <tr>
                    <th>
                      <TableSortColumn text="ID" column="id" order={order} direction={direction} onClick={orderBy} />
                    </th>
                    <th>
                      {/* TODO: da para simplificar? */}
                      <TableSortColumn
                        text="Nome"
                        column="nome"
                        order={order}
                        direction={direction}
                        onClick={orderBy}
                      />
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <TableBody>
                  {list.entities.map(row => (
                    <StyledTableRow key={row.id}>
                      <td>#{row.id}</td>
                      <td>{row.nome}</td>
                      <td className="tbox-table-actions">
                        <div>
                          <Tooltip title="Remover">
                            <IconButton onClick={() => onSelect(row.id)}>
                              <Eye />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </div>
          <TablePagination
            className="pagination"
            component="div"
            count={list.total}
            page={page - 1}
            onPageChange={(...args) => _page(args[1] + 1)}
            rowsPerPage={perPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onRowsPerPageChange={e => {
              _perPage(e.target.value);
              _page(1);
            }}
          />
          <Box display="flex" justifyContent="space-between"></Box>
        </div>
      </div>
    </div>
  );
};

const View = ({ id }) => {
  const { server } = useDorothy();
  const { changeRoute } = useRouter();

  const [level, _level] = useState(40);

  const { data: info } = useQuery(['orgs_data', { id }], {
    queryFn: async () => (await axios.get(`${server}organization/${id}`)).data,
  });

  const { data: similars } = useQuery(
    [
      'orgs_similar_list',
      {
        id,
        level,
      },
    ],
    {
      queryFn: async () => (await axios.get(`${server}organization/similar/${id}/?level=${level}`)).data,
      enabled: !!id,
    },
  );

  const handleSimilarityLevelChange = (_, value) => {
    _level(value);
  };

  if (!info) return <></>;

  return (
    <div className="page">
      <div className="page-header">
        <PageTitle title={info.nome} />
        <div className="page-header-buttons">
          <button className="button-outline" onClick={() => changeRoute({ params: [] })}>
            Voltar
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="page-body">
          <>
            <Card middle headerless>
              <div className={styles.similares}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box width={300}>
                    <div className={styles.select_level}>
                      <Slider
                        min={10}
                        max={50}
                        step={5}
                        marks={marks}
                        size="small"
                        value={level}
                        aria-label="Small"
                        valueLabelDisplay="auto"
                        onChangeCommitted={handleSimilarityLevelChange}
                        onClick={e => {
                          e.stopPropagation();
                        }}
                      />

                      <small>(nível)</small>
                    </div>
                  </Box>
                </Stack>
              </div>

              <div className={styles.similarList}>
                {similars &&
                  similars.map(s => (
                    <div className={styles.similarListItem} key={s.id}>
                      <span onClick={() => changeRoute({ params: [s.id] })} className={styles.similar_orgs}>
                        <span className={styles.org_id}>#{s.id}</span>
                        <span className={styles.org_name}>{s.nome}</span>
                      </span>
                    </div>
                  ))}
                {similars && !similars.length && <>Nenhum item encontrado com este nível de similaridade</>}
              </div>
            </Card>
          </>
        </div>
      </div>
    </div>
  );
};

function TableSortColumn({ text, column, order, direction, enabled = true, onClick }) {
  return (
    <>
      {!enabled && <>{text}</>}
      {enabled && (
        <TableSortLabel
          className="tbox-table-sortlabel"
          active={order === column}
          direction={direction}
          onClick={() => onClick(column)}
        >
          {text}
        </TableSortLabel>
      )}
    </>
  );
}

const StyledTableRow = styled(TableRow)({ '&:last-child td, &:last-child th': { border: 0 } });

export default Tool;
