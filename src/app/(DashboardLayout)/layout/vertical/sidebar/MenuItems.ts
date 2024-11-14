import { IconChartPie, IconDashboard, IconTestPipe } from "@tabler/icons-react";

export interface MenuitemsType {
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
  position?: number | null;
}

export const getIconForRoute = (title: string): any => {
  const iconMap: Record<string, any> = {
    'Dashboard': IconDashboard,
    'Test': IconTestPipe,
    // Add more mappings as needed
  };
  
  return iconMap[title] || IconChartPie; // Default icon
};
