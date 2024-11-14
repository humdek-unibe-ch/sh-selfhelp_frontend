import { uniqueId } from "lodash";

interface MenuitemsType {
  [x: string]: any;
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
}
import { IconBoxMultiple, IconPoint, IconChartPie, IconTestPipe } from "@tabler/icons-react";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Home",
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconChartPie,
    href: "/",
  },
  {
    navlabel: true,
    subheader: "Dynamic Pages",
  },
  {
    id: uniqueId(),
    title: "Test Page",
    icon: IconTestPipe,
    href: "/test",
  },
  {
    id: uniqueId(),
    title: "Test Page 2",
    icon: IconTestPipe,
    href: "/test2",
  }
];

export default Menuitems;
