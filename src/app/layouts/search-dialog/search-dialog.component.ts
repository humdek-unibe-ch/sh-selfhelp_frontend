import { NgForOf } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Observable } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NavItem } from '../full/vertical/sidebar/nav-item/nav-item';
import { NavigationService } from 'src/app/services/api/navigation.service';

@Component({
   selector: 'app-search-dialog',
   standalone: true,
   imports: [
      RouterModule,
      MaterialModule,
      TablerIconsModule,
      FormsModule,
      NgForOf,
   ],
   templateUrl: './search-dialog.component.html',
   styleUrl: './search-dialog.component.scss',
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent {
   searchText: string = '';
   navItems$: Observable<NavItem[]>;
   navItemsData: NavItem[] = [];

   constructor(private navigationService: NavigationService) {
      this.navItems$ = this.navigationService.navItems$;
      this.navigationService.navItems$.subscribe((navItems) => {
         this.navItemsData = navItems.filter((navItem) => !!navItem.displayName);
      });
   }

   // filtered = this.navItemsData.find((obj) => {
   //   return obj.displayName == this.searchinput;
   // });
}
