import { useRef, createElement } from 'react';

import { InputBase, styled, TableBody, TableRow, TableSortLabel, Tooltip, IconButton, useTheme } from '@mui/material';

import Search from '../ui/icons/Search';

export default function TableBox({
  columns,
  actions,
  hasHeader = true,
  header,
  data,
  order,
  direction,
  canSort,
  onSearchChange,
  onChangeOrder,
}) {
  const searchInputRef = useRef(null);
  const theme = useTheme();

  return (
    <div className="tablebox">
      {hasHeader && !header && (
        <div className="tbox-header">
          <InputBaseStyled
            spellCheck="false"
            className="tbox-search"
            startAdornment={
              <Search onClick={() => searchInputRef.current?.focus()} color={theme.palette.secondary.main} />
            }
            inputRef={searchInputRef}
            placeholder="Pesquisar..."
            inputProps={{ 'aria-label': 'pesquisar grupos' }}
            onChange={onSearchChange}
          />
          {/* <WorkingGroupsOrganizationTypeMenu onFilterChange={console.log} /> */}
        </div>
      )}
      {!!header && <div className="tbox-header">{header}</div>}
      <div className="tbox-body">
        <table className="tbox-table">
          <thead>
            <tr>
              {columns
                .filter(c => c.show || c.show === undefined)
                .map(c => (
                  <th key={c.field}>
                    {c.sortable && (
                      <TableSortColumn
                        text={c.label}
                        column={c.field}
                        order={order}
                        direction={direction}
                        onClick={onChangeOrder(c.defaultOrder)}
                        enabled={!canSort}
                      />
                    )}
                    {!c.sortable && <>{c.label}</>}
                  </th>
                ))}
              <th>Ações</th>
            </tr>
          </thead>
          <TableBody>
            {data.map((row, index) => (
              <StyledTableRow key={`${row.id}-${index}`}>
                {columns
                  .filter(c => c.show || c.show === undefined)
                  .map(c => {
                    // preparar o Element
                    let Element = <>{row[c.field]}</>;
                    if (c.renderer)
                      Element = createElement(c.renderer, {
                        field: c.field,
                        value: row[c.field],
                        row,
                        index,
                        ...c.rendererProps,
                      });

                    return (
                      <td {...c.tdProps} key={c.field}>
                        {Element}
                      </td>
                    );
                  })}
                <td className="tbox-table-actions">
                  {actions
                    .filter(a => !a.enabled || a.enabled(row))
                    .map((a, idx) => (
                      <div key={idx}>
                        <Tooltip title={a.label}>
                          <IconButton onClick={() => a.onClick(row)}>{a.icon}</IconButton>
                        </Tooltip>
                      </div>
                    ))}
                </td>
              </StyledTableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

function TableSortColumn({ text, column, order, direction, enabled = true, onClick }) {
  return (
    <>
      {!enabled && <>{text}</>}
      {enabled && (
        <TableSortLabel
          className="tbox-table-sortlabel"
          active={order === column}
          direction={direction === 'asc' ? 'desc' : 'asc'}
          onClick={() => onClick(column)}
        >
          {text}
        </TableSortLabel>
      )}
    </>
  );
}

const StyledTableRow = styled(TableRow)({ '&:last-child td, &:last-child th': { border: 0 } });

const InputBaseStyled = styled(InputBase)({
  ml: 1,
  flex: 1,
  maxWidth: 600,
  fontSize: 20,
  '& input::placeholder': {
    color: '#444',
    opacity: 1,
  },
  '& input': {
    marginLeft: 1,
  },
});
