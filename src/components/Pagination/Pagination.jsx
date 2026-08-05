import { Pagination as MuiPagination, Box } from "@mui/material";

export default function Pagination({ count, page, onChange, color = 'primary', size = 'large', shape = 'rounded', sx = {} }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <MuiPagination
        count={count}
        page={page}
        onChange={onChange}
        color={color}
        size={size}
        shape={shape}
        sx={sx}
      />
    </Box>
  );
}
