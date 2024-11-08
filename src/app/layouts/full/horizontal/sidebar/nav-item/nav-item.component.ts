import { Component, OnInit, Input, } from '@angular/core';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule, NgForOf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from 'src/app/services/api/navigation.service';

@Component({
   selector: 'app-horizontal-nav-item',
   standalone: true,
   imports: [TablerIconsModule, CommonModule, MatIconModule, NgForOf],
   templateUrl: './nav-item.component.html',
})
export class AppHorizontalNavItemComponent implements OnInit {
   @Input() depth: any;
   @Input() item: any;

   constructor(public navigationService: NavigationService, public router: Router) {
      if (this.depth === undefined) {
         this.depth = 0;
      }
   }

   ngOnInit() { }
   onItemSelected(item: any) {
      if (!item.children || !item.children.length) {
         this.router.navigate([item.route]);
      }
   }
}
