import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from '@/store/hooks';
import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
import NavGroup from './NavGroup/NavGroup';
import { AppState } from '@/store/store'
import { toggleMobileSidebar } from '@/store/customizer/CustomizerSlice';
import { useNavigation } from '@/hooks/useNavigation';
import { Box, List } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '@/utils/theme/Theme';

const SidebarItems = () => {
   const pathname = usePathname();
   const pathDirect = pathname;
   const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
   const customizer = useSelector((state: AppState) => state.customizer);
   const lgUp = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
   const hideMenu: any = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
   const dispatch = useDispatch();
   const { menuItems, isLoading } = useNavigation();
   return (
      <Box style={{ px: 2, borderRadius: 0 }}>
         <List style={{ pt: 0 }} className="sidebarNav">
            {menuItems.map((item) => {
               // {/********SubHeader**********/}
               if (item.subheader) {
                  return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;

                  // {/********If Sub Menu**********/}

               } else if (item.children) {
                  return (
                     <NavCollapse
                        menu={item}
                        pathDirect={pathDirect}
                        hideMenu={hideMenu}
                        pathWithoutLastPart={pathWithoutLastPart}
                        level={1}
                        key={item.id}
                        onClick={() => dispatch(toggleMobileSidebar())}
                     />
                  );

                  // {/********If Sub No Menu**********/}
               } else {
                  return (
                     <NavItem item={item} key={item.id} pathDirect={pathDirect} hideMenu={hideMenu} onClick={() => dispatch(toggleMobileSidebar())} />
                  );
               }
            })}
         </List>
      </Box>
   );
};
export default SidebarItems;
