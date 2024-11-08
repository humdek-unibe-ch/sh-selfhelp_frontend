import {
   Component,
   OnInit,
   Input,
   ChangeDetectorRef,
   OnChanges,
} from '@angular/core';
// import { navItems } from './sidebar-data';
import { Router } from '@angular/router';
import { NavService } from '../../../../services/nav.service';
import { MediaMatcher } from '@angular/cdk/layout';
import { AppHorizontalNavItemComponent } from './nav-item/nav-item.component';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { navItems } from '../../vertical/sidebar/sidebar-data';
import { ApiService } from 'src/app/services/api/api.service';
import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';

@Component({
   selector: 'app-horizontal-sidebar',
   standalone: true,
   imports: [AppHorizontalNavItemComponent, NgIf, NgForOf, CommonModule],
   templateUrl: './sidebar.component.html',
})
export class AppHorizontalSidebarComponent implements OnInit {
   //   navItems = navItems;
   navItems: NavItem[] = [];
   parentActive = '';

   mobileQuery: MediaQueryList;
   private _mobileQueryListener: () => void;

   constructor(
      public navService: NavService,
      public router: Router,
      media: MediaMatcher,
      changeDetectorRef: ChangeDetectorRef,
      private api: ApiService
   ) {
      this.mobileQuery = media.matchMedia('(min-width: 1100px)');
      this._mobileQueryListener = () => changeDetectorRef.detectChanges();
      this.mobileQuery.addListener(this._mobileQueryListener);
      this.api.getNavigation().subscribe(items => {
         this.navItems = items;
         console.log(items);
       });
   }

   ngOnInit(): void { }
}
