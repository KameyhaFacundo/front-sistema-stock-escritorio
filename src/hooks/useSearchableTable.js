import { useState, useMemo, useCallback } from 'react';

export default function useSearchableTable(items = [], options = {}) {
  const {
    defaultPageSize = 10,
    defaultSortCol = null,
    defaultSortDir = 'asc',
    searchFields = [],
    filterFn = null,
  } = options;

  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortCol, setSortCol] = useState(defaultSortCol);
  const [sortDir, setSortDir] = useState(defaultSortDir);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    if (filterFn) return items.filter(item => filterFn(item, q));
    if (searchFields.length > 0) {
      return items.filter(item =>
        searchFields.some(field => {
          const val = item[field];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    return items;
  }, [items, search, filterFn, searchFields]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((pagina - 1) * pageSize, pagina * pageSize);

  const toggleSort = useCallback((col) => {
    setSortCol(prev => {
      if (prev === col) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return col;
    });
  }, []);

  const resetPagination = useCallback(() => setPagina(1), []);

  return {
    search, setSearch,
    pagina, setPagina,
    pageSize, setPageSize,
    sortCol, sortDir, toggleSort,
    filtered, sorted, paged,
    totalPages,
    resetPagination,
  };
}
