import { useState } from 'react';
import { IconButton, Dialog, DialogContent, Stack, Divider, Box, List, ListItemText, Typography, TextField, ListItemButton } from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import { MenuitemsType } from '@/types/layout/sidebar';

const Search = () => {
   const [showDrawer2, setShowDrawer2] = useState(false);
   const [search, setSearch] = useState('');

   const handleClose = () => {
      setShowDrawer2(false);
      setSearch('');
   };

   const { menuItems = [] } = useNavigation();

   const filterRoutes = (menuItems: MenuitemsType[], searchTerm: string) => {
      if (!searchTerm) return menuItems;
      return menuItems.filter((menuItem) =>
         menuItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         menuItem.href?.toLowerCase().includes(searchTerm.toLowerCase())
      );
   };

   const searchData = filterRoutes(menuItems, search);

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
            onClose={handleClose}
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
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     inputProps={{ 'aria-label': 'Search here' }}
                  />
                  <IconButton size="small" onClick={handleClose}>
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
                     {searchData.map((menuItem) => (
                        <ListItemButton
                           key={menuItem.href}
                           sx={{ py: 0.5, px: 1 }}
                           href={menuItem.href ?? '#'}
                           component={Link}
                        >
                           <ListItemText
                              primary={menuItem.title}
                              secondary={menuItem.href}
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
