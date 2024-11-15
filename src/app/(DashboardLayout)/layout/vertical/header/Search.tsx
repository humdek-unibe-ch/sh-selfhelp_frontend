import { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogContent,
  Stack,
  Divider,
  Box,
  List,
  ListItemText,
  Typography,
  TextField,
  ListItemButton,
} from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';

const Search = () => {
  const [showDrawer2, setShowDrawer2] = useState(false);
  const [search, setSearch] = useState('');

  const { routes: routes = [] } = useNavigation();

  const filterRoutes = (routes: any[], searchTerm: string) => {
    if (!searchTerm) return routes;
    return routes.filter((route) => 
      route.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const searchData = filterRoutes(routes, search);

  return (
    <>
      <IconButton
        aria-label="show 4 new mails"
        color="inherit"
        aria-controls="search-menu"
        aria-haspopup="true"
        onClick={() => setShowDrawer2(true)}
        size="large"
      >
        <IconSearch size="22" />
      </IconButton>
      <Dialog
        open={showDrawer2}
        onClose={() => setShowDrawer2(false)}
        fullWidth
        maxWidth={'sm'}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{ sx: { position: 'fixed', top: 30, m: 0 } }}
      >
        <DialogContent className="testdialog">
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              id="tb-search"
              placeholder="Search here"
              fullWidth
              onChange={(e) => setSearch(e.target.value)}
              inputProps={{ 'aria-label': 'Search here' }}
            />
            <IconButton size="small" onClick={() => setShowDrawer2(false)}>
              <IconX size="18" />
            </IconButton>
          </Stack>
        </DialogContent>
        <Divider />
        <Box p={2} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          <Typography variant="h5" p={1}>
            Quick Page Links
          </Typography>
          <Box>
            <List component="nav">
              {searchData.map((route) => (
                <ListItemButton 
                  key={route.path}
                  sx={{ py: 0.5, px: 1 }} 
                  href={route.path} 
                  component={Link}
                >
                  <ListItemText
                    primary={route.title}
                    secondary={route.path}
                    sx={{ my: 0, py: 0.5 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default Search;
