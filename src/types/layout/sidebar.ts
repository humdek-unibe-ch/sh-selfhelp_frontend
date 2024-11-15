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
 }

export interface listItemType {
  component: any;
  href?: string;
  target?: any;
  to?: any;
}
