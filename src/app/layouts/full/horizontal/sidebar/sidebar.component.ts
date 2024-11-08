import { Component, ChangeDetectorRef, } from '@angular/core';
import { Router } from '@angular/router';
import { MediaMatcher } from '@angular/cdk/layout';
import { AppHorizontalNavItemComponent } from './nav-item/nav-item.component';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';
import { Observable } from 'rxjs';
import { NavigationService } from 'src/app/services/api/navigation.service';

@Component({
   selector: 'app-horizontal-sidebar',
   standalone: true,
   imports: [AppHorizontalNavItemComponent, NgIf, NgForOf, CommonModule],
   templateUrl: './sidebar.component.html',
})
export class AppHorizontalSidebarComponent {
   parentActive = '';
   navItems$: Observable<NavItem[]>;

   mobileQuery: MediaQueryList;
   private _mobileQueryListener: () => void;

   constructor(
      public navigationService: NavigationService,
      public router: Router,
      media: MediaMatcher,
      changeDetectorRef: ChangeDetectorRef
   ) {
      this.mobileQuery = media.matchMedia('(min-width: 1100px)');
      this._mobileQueryListener = () => changeDetectorRef.detectChanges();
      this.mobileQuery.addListener(this._mobileQueryListener);
      this.navItems$ = this.navigationService.navItems$;
   }

}
