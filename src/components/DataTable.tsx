import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: number | string;
};

export function DataTable<T>(props: {
  title?: string;
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  getSearchText?: (row: T) => string;
}) {
  const { title, rows, columns, onEdit, onDelete, searchPlaceholder, getSearchText } = props;
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (getSearchText ? getSearchText(r) : JSON.stringify(r)).toLowerCase().includes(q));
  }, [rows, query, getSearchText]);

  const pageRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  React.useEffect(() => {
    setPage(0);
  }, [query]);

  return (
    <Box>
      {title ? (
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}

      <TextField
        label={searchPlaceholder ?? 'Buscar'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="small"
        fullWidth
        inputProps={{ 'aria-label': 'Buscar' }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table size="small" aria-label={title ?? 'tabela'}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} sx={{ width: c.width }}>
                  {c.header}
                </TableCell>
              ))}
              {(onEdit || onDelete) && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row, idx) => (
              <TableRow key={idx} hover tabIndex={0}>
                {columns.map((c) => (
                  <TableCell key={c.key}>{c.render(row)}</TableCell>
                ))}
                {(onEdit || onDelete) && (
                  <TableCell align="right">
                    {onEdit ? (
                      <IconButton aria-label="Editar" onClick={() => onEdit(row)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                    {onDelete ? (
                      <IconButton aria-label="Excluir" onClick={() => onDelete(row)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum registro.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Linhas"
      />
    </Box>
  );
}
