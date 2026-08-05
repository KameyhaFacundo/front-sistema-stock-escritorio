import { useState, Fragment, memo, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, Checkbox, Skeleton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon       from '@mui/icons-material/Edit';
import DeleteIcon     from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
  BORDER, CARD, INK, MUTED, HOVER, TABLE_HEADER, P, ERROR, ERROR_BG,
} from '../../theme/tokens';
import ConfirmDialog from './ConfirmDialog';
import ColSortHeader from './ColSortHeader';
import { useIsMobile } from '../../utils/responsive';

const colTh = {
  color: MUTED, fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em', userSelect: 'none',
};

const DataTable = memo(function DataTable({
  columns = [],
  rows    = [],
  actions,
  sort,
  select,
  expand,
  loading      = false,
  emptyMessage = 'Sin datos',
  maxRows      = 300,
  onRowClick,
  mobileCard,
  actionsTourId,
}) {
  const isMobile = useIsMobile();
  const [hoveredId,    setHoveredId]    = useState(null);
  const [expandedId,   setExpandedId]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [focusRow,     setFocusRow]     = useState(0);
  const [focusCol,     setFocusCol]     = useState(0);
  const gridRef = useRef(null);

  const hasExpand  = Boolean(expand);
  const hasSelect  = Boolean(select);
  const numBuiltin = [actions?.onView, actions?.onEdit, actions?.onDelete].filter(Boolean).length;
  const hasExtra   = Boolean(actions?.extra);
  const numBtns    = numBuiltin + (hasExtra ? 1 : 0) + (hasExpand ? 1 : 0);
  const hasActions = numBtns > 0;
  const actionW    = numBtns <= 1 ? 44 : numBtns === 2 ? 76 : 108;

  const colParts = [
    ...(hasSelect  ? ['44px'] : []),
    ...columns.map(c => c.flex ? (typeof c.flex === 'number' ? `minmax(0, ${c.flex}fr)` : 'minmax(0, 1fr)') : c.width ? `${c.width}px` : 'auto'),
    ...(hasActions ? [`${actionW}px`] : []),
  ];
  const gridCols = colParts.join(' ');

  const baseSx = {
    px: 2.5,
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  };
  const hdrSx = {
    ...baseSx,
    py: 1.25,
    bgcolor: TABLE_HEADER,
    borderBottom: `1px solid ${BORDER}`,
  };
  const cellSx = (id, isLast) => {
    const isSel = hasSelect && select.selected.has(id);
    return {
      ...baseSx,
      py: 1.5,
      bgcolor: isSel
        ? (hoveredId === id ? `${P}18` : `${P}0f`)
        : (hoveredId === id ? HOVER : 'transparent'),
      transition: 'background 0.1s',
      borderBottom: isLast ? 'none' : `1px solid ${BORDER}`,
      cursor: (hasExpand || onRowClick) ? 'pointer' : 'default',
    };
  };

  const hoverProps = (id) => ({
    onMouseEnter: () => setHoveredId(id),
    onMouseLeave: () => setHoveredId(null),
  });

  const toggleExpand = (row) =>
    setExpandedId(prev => prev === row.id ? null : row.id);

  const allSelected = hasSelect && rows.length > 0 && rows.every(r => select.selected.has(r.id));
  const someSelected = hasSelect && rows.some(r => select.selected.has(r.id));

  const visibleRows = rows.slice(0, maxRows);
  const colCount = (hasSelect ? 1 : 0) + columns.length + (hasActions ? 1 : 0);

  const handleGridKeyDown = useCallback((e) => {
    const { key } = e;
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;

    e.preventDefault();
    const maxRow = visibleRows.length - 1;
    const maxCol = colCount - 1;

    setFocusRow(prev => {
      let next = prev;
      if (key === 'ArrowDown') next = Math.min(prev + 1, maxRow);
      if (key === 'ArrowUp') next = Math.max(prev - 1, 0);
      if (key === 'Home') next = 0;
      if (key === 'End') next = maxRow;
      return next;
    });

    setFocusCol(prev => {
      let next = prev;
      if (key === 'ArrowLeft') next = Math.max(prev - 1, 0);
      if (key === 'ArrowRight') next = Math.min(prev + 1, maxCol);
      if (key === 'Home') next = 0;
      if (key === 'End') next = maxCol;
      return next;
    });
  }, [visibleRows.length, colCount]);

  useEffect(() => {
    if (visibleRows.length === 0) return;
    const cell = gridRef.current?.querySelector(`[data-row="${focusRow}"][data-col="${focusCol}"]`);
    cell?.focus();
  }, [focusRow, focusCol, visibleRows.length]);

  /* ── Mobile ── */
  if (isMobile && mobileCard) {
    if (loading) return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 1.5 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2 }}>
            <Skeleton height={16} width="60%" />
            <Skeleton height={13} width="40%" sx={{ mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    );
    const mobileActs = {
      onView:   actions?.onView,
      onEdit:   actions?.onEdit,
      onDelete: actions?.onDelete ? (row) => setDeleteTarget(row) : undefined,
    };
    return (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 1.5 }}>
          {rows.map(row => <Fragment key={row.id}>{mobileCard(row, mobileActs)}</Fragment>)}
        </Box>
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { actions?.onDelete?.(deleteTarget); setDeleteTarget(null); }}
          message={actions?.deleteMessage}
        />
      </>
    );
  }

  return (
    <>
      <Box
        ref={gridRef}
        role="grid"
        aria-label="Tabla de datos"
        aria-rowcount={rows.length + 1}
        aria-colcount={colCount}
        sx={{ display: 'grid', gridTemplateColumns: gridCols }}
        onKeyDown={handleGridKeyDown}
      >

        {/* ── Cabecera ── */}
        {/* display:contents — el grid es "single-grid" (todas las celdas son
            hijos directos del grid para que gridTemplateColumns las alinee
            entre filas); este wrapper es solo para el role="row" de
            accesibilidad, sin contents quedaría como una sola celda del
            grid y le apilaría todos los headers adentro. */}
        <Box role="row" sx={{ display: 'contents' }}>
          {hasSelect && (
            <Box role="columnheader" sx={hdrSx}>
              <Checkbox size="small" checked={allSelected} indeterminate={!allSelected && someSelected}
                onChange={select.onToggleAll}
                inputProps={{ 'aria-label': 'Seleccionar todo' }}
                sx={{ p: 0.5, color: MUTED, '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: P } }} />
            </Box>
          )}
          {columns.map(col => (
            <Box key={`h-${col.key}`} role="columnheader"
              aria-sort={sort && sort.col === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
              sx={{ ...hdrSx, justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
              {sort && col.sortable
                ? <ColSortHeader col={col.key} label={col.header} sortCol={sort.col} sortDir={sort.dir} onSort={sort.onChange} />
                : <Typography sx={colTh}>{col.header}</Typography>
              }
            </Box>
          ))}
          {hasActions && (
            <Box role="columnheader" data-tour={actionsTourId} sx={{ ...hdrSx, justifyContent: 'flex-end' }}>
              <Typography sx={{ ...colTh, textAlign: 'right' }}>ACCIONES</Typography>
            </Box>
          )}
        </Box>

        {/* ── Skeleton de carga ── */}
        {loading && Array.from({ length: 6 }).map((_, ri) => (
          <Box key={`sk-${ri}`} role="row" aria-busy="true" sx={{ display: 'contents' }}>
            {hasSelect && <Box role="gridcell" sx={{ ...baseSx, py: 1.5, borderBottom: `1px solid ${BORDER}` }}><Skeleton variant="rounded" width={20} height={20} /></Box>}
            {columns.map((_, ci) => (
              <Box key={ci} role="gridcell" sx={{ ...baseSx, py: 1.75, borderBottom: `1px solid ${BORDER}` }}>
                {ci === 0
                  ? <Box sx={{ flex: 1 }}>
                      <Skeleton height={14} width="70%" sx={{ borderRadius: 1 }} />
                      <Skeleton height={12} width="45%" sx={{ mt: 0.5, borderRadius: 1 }} />
                    </Box>
                  : <Skeleton variant="rounded" height={22} width="65%" sx={{ borderRadius: 1 }} />
                }
              </Box>
            ))}
            {hasActions && <Box role="gridcell" sx={{ ...baseSx, py: 1.5, borderBottom: `1px solid ${BORDER}` }}><Skeleton variant="rounded" height={24} width={actionW - 16} sx={{ borderRadius: 1 }} /></Box>}
          </Box>
        ))}

        {/* ── Estado vacío ── */}
        {!loading && rows.length === 0 && (
          <Box role="row" sx={{ gridColumn: '1 / -1', py: 5, display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>{emptyMessage}</Typography>
          </Box>
        )}

        {/* ── Filas ── */}
        {!loading && visibleRows.map((row, ri) => {
          const isLast    = ri === rows.length - 1;
          const isExpanded = expandedId === row.id;

          return (
            <Fragment key={row.id}>
              {/* Checkbox */}
              {hasSelect && (
                <Box role="gridcell" data-row={ri} data-col={0} tabIndex={ri === focusRow && 0 === focusCol ? 0 : -1}
                  sx={{ ...cellSx(row.id, isLast && !isExpanded), cursor: 'default' }} {...hoverProps(row.id)}
                  onClick={e => { e.stopPropagation(); select.onToggle(row); }}>
                  <Checkbox size="small" checked={select.selected.has(row.id)}
                    inputProps={{ 'aria-label': `Seleccionar ${row.id}` }}
                    sx={{ p: 0.5, color: MUTED, '&.Mui-checked': { color: P } }} />
                </Box>
              )}

              {/* Celdas de datos */}
              {columns.map((col, ci) => {
                const cellIdx = hasSelect ? ci + 1 : ci;
                return (
                  <Box key={`${row.id}-${col.key}`} role="gridcell"
                    data-row={ri} data-col={cellIdx} tabIndex={ri === focusRow && cellIdx === focusCol ? 0 : -1}
                    {...hoverProps(row.id)}
                    onClick={() => hasExpand ? toggleExpand(row) : onRowClick?.(row)}
                    sx={{ ...cellSx(row.id, isLast && !isExpanded), justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                    {col.render
                      ? col.render(row)
                      : <Typography sx={{ color: INK, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[col.key] ?? '—'}</Typography>
                    }
                  </Box>
                );
              })}

              {/* Acciones */}
              {hasActions && (
                <Box role="gridcell" data-row={ri} data-col={colCount - 1}
                  tabIndex={ri === focusRow && (colCount - 1) === focusCol ? 0 : -1}
                  {...hoverProps(row.id)}
                  sx={{ ...cellSx(row.id, isLast && !isExpanded), justifyContent: 'flex-end', gap: 0.5, cursor: 'default' }}
                  onClick={e => e.stopPropagation()}>
                  {actions?.extra?.(row)}
                  {actions?.onView && (
                    <Tooltip title="Ver">
                      <IconButton size="small" onClick={() => actions.onView(row)}
                        aria-label={`Ver ${row.id}`}
                        sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}18` }, borderRadius: '6px' }}>
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {actions?.onEdit && (
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => actions.onEdit(row)}
                        aria-label={`Editar ${row.id}`}
                        sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px' }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {actions?.onDelete && (
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => setDeleteTarget(row)}
                        aria-label={`Eliminar ${row.id}`}
                        sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {hasExpand && (
                    <IconButton size="small" onClick={() => toggleExpand(row)}
                      aria-label={isExpanded ? 'Colapsar fila' : 'Expandir fila'}
                      aria-expanded={isExpanded}
                      sx={{ color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px',
                        transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <ExpandMoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>
              )}

              {/* Contenido expandido */}
              {hasExpand && isExpanded && (
                <Box role="row" sx={{ gridColumn: '1 / -1', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}>
                  <Box role="gridcell" sx={{ width: '100%' }}>
                    {expand(row)}
                  </Box>
                </Box>
              )}
            </Fragment>
          );
        })}
        {!loading && rows.length > maxRows && (
          <Box role="row" sx={{ gridColumn: '1 / -1', py: 2, textAlign: 'center', borderTop: `1px solid ${BORDER}` }}>
            <Typography sx={{ color: MUTED, fontSize: 13 }}>
              Mostrando {maxRows} de {rows.length} resultados. Usá los filtros para afinar la búsqueda.
            </Typography>
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { actions?.onDelete?.(deleteTarget); setDeleteTarget(null); }}
        message={actions?.deleteMessage}
      />
    </>
  );
});

export default DataTable;
