import { usePathname } from "next/navigation";
import { useSelector } from '@/store/hooks';
import NavItem from '../NavItem/NavItem';
import NavCollapse from '../NavCollapse/NavCollapse';
import { AppState } from '@/store/store';
import { useNavigation } from '@/hooks/useNavigation';
import { useMediaQuery } from '@mantine/hooks';
import { Box } from '@mantine/core';

const NavListing = () => {
   const pathname = usePathname();
   const pathDirect = pathname;
   const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
   const customizer = useSelector((state: AppState) => state.customizer);
   const lgUp = useMediaQuery('(min-width: 1200px)');
   const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
   const { menuItems, isLoading } = useNavigation();

   return (
      <Box>
         <Box
            component="ul"
            style={{
               padding: 0,
               margin: 0,
               display: 'flex',
               flexDirection: 'column',
               gap: '3px',
               zIndex: 100,
               listStyle: 'none'
            }}
         >
            {menuItems.map((item) => {
               if (item.children) {
                  return (
                     <NavCollapse
                        menu={item}
                        pathDirect={pathDirect}
                        hideMenu={hideMenu}
                        pathWithoutLastPart={pathWithoutLastPart}
                        level={1}
                        key={item.id}
                        onClick={undefined}
                     />
                  );
               } else {
                  return (
                     <NavItem
                        item={item}
                        key={item.id}
                        pathDirect={pathDirect}
                        hideMenu={hideMenu}
                        onClick={()=>{console.log('clicked')}}
                     />
                  );
               }
            })}
         </Box>
      </Box>
   );
};

export default NavListing;
