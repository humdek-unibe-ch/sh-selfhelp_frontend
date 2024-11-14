import { useMediaQuery, Box, Drawer, useTheme, Theme } from "@mui/material";
import { useEffect, useState } from 'react';
import SidebarItems from "./SidebarItems";

import { useSelector, useDispatch } from "@/store/hooks";
import {
   hoverSidebar,
   toggleMobileSidebar,
} from "@/store/customizer/CustomizerSlice";
import Scrollbar from "@/app/components/custom-scroll/Scrollbar";
import { Profile } from "./SidebarProfile/Profile";
import { AppState } from "@/store/store";
import AuthLogo from "../../shared/logo/AuthLogo";
import { NavigationService } from '@/services/api.service';
import { getIconForRoute } from './MenuItems';
import { useQuery } from '@tanstack/react-query';

interface MenuItem {
  id: string;
  title: string;
  icon: any; // Consider making this more specific based on your icon types
  href: string;
  position: number;
}

const Sidebar = () => {
   const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.down("lg"));
   const customizer = useSelector((state: AppState) => state.customizer);
   const dispatch = useDispatch();
   const theme = useTheme();
   const toggleWidth =
      customizer.isCollapse && !customizer.isSidebarHover
         ? customizer.MiniSidebarWidth
         : customizer.SidebarWidth;
   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

   const { data: routes, isLoading } = useQuery({
      queryKey: ['routes'],
      queryFn: async () => {
         const response = await NavigationService.getRoutes();
         if (!response) throw new Error('No routes received');
         return response;
      }
   });

   useEffect(() => {
      if (!isLoading && routes) {
         const transformedItems = routes
            .map(route => ({
               id: route.path,
               title: route.title,
               icon: getIconForRoute(route.title),
               href: route.path,
               position: route.position
            }));
         
         // setMenuItems(transformedItems);
      }
   }, [isLoading, routes]);

   const onHoverEnter = () => {
      if (customizer.isCollapse) {
         dispatch(hoverSidebar(true));
      }
   };

   const onHoverLeave = () => {
      dispatch(hoverSidebar(false));
   };


   return (
      <>
         {!lgUp ? (
            <Box
               sx={{
                  zIndex: 100,
                  width: toggleWidth,
                  flexShrink: 0,
                  ...(customizer.isCollapse && {
                     position: "absolute",
                  }),
               }}
            >
               {/* ------------------------------------------- */}
               {/* Sidebar for desktop */}
               {/* ------------------------------------------- */}
               <Drawer
                  anchor="left"
                  open
                  onMouseEnter={onHoverEnter}
                  onMouseLeave={onHoverLeave}
                  variant="permanent"
                  PaperProps={{
                     sx: {
                        transition: theme.transitions.create("width", {
                           duration: theme.transitions.duration.shortest,
                        }),
                        width: toggleWidth,
                        boxSizing: "border-box",
                        border: "0",
                        top: customizer.TopbarHeight,
                        boxShadow: "1px 0 20px #00000014",
                     },
                  }}
               >
                  {/* ------------------------------------------- */}
                  {/* Sidebar Box */}
                  {/* ------------------------------------------- */}
                  <Box
                     borderRadius="0 !important"
                     sx={{
                        height: "100%",
                     }}
                  >


                     <Profile />
                     <Scrollbar sx={{ height: "calc(100% - 220px)" }}>
                        {!isLoading && menuItems.length > 0 ? (
                           <SidebarItems items={menuItems} />
                        ) : (
                           <Box sx={{ p: 2, textAlign: 'center' }}>Loading...</Box>
                        )}
                     </Scrollbar>
                  </Box>
               </Drawer>
            </Box>
         ) : (
            <Drawer
               anchor="left"
               open={customizer.isMobileSidebar}
               onClose={() => dispatch(toggleMobileSidebar())}
               variant="temporary"
               PaperProps={{
                  sx: {
                     width: customizer.SidebarWidth,
                     border: "0 !important",
                     boxShadow: (theme) => theme.shadows[8],
                  },
               }}
            >
               {/* ------------------------------------------- */}
               {/* Logo */}
               {/* ------------------------------------------- */}
               <Box px={2}>
                  <AuthLogo />
               </Box>

               <Profile />
               {/* ------------------------------------------- */}
               {/* Sidebar For Mobile */}
               {/* ------------------------------------------- */}
               {!isLoading && menuItems.length > 0 ? (
                  <SidebarItems items={menuItems} />
               ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>Loading...</Box>
               )}
            </Drawer>
         )}
      </>
   );


};

export default Sidebar;
