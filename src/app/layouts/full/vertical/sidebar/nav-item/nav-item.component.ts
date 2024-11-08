import {
   Component,
   HostBinding,
   Input,
   OnInit,
   OnChanges,
   Output,
   EventEmitter,
} from '@angular/core';
import { NavItem } from './nav-item';
import { Router } from '@angular/router';
import {
   animate,
   state,
   style,
   transition,
   trigger,
} from '@angular/animations';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { NavigationService } from 'src/app/services/api/navigation.service';

@Component({
   selector: 'app-nav-item',
   standalone: true,
   imports: [TablerIconsModule, MaterialModule, CommonModule],
   templateUrl: './nav-item.component.html',
   styleUrls: [],
   animations: [
      trigger('indicatorRotate', [
         state('collapsed', style({ transform: 'rotate(0deg)' })),
         state('expanded', style({ transform: 'rotate(180deg)' })),
         transition(
            'expanded <=> collapsed',
            animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
         ),
      ]),
   ],
})
export class AppNavItemComponent implements OnChanges {
   @Output() toggleMobileLink: any = new EventEmitter<void>();
   @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();

   expanded: any = false;
   disabled: any = false;
   twoLines: any = false;
   @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
   @Input() item: NavItem | any;
   @Input() depth: any;

   constructor(public navigationService: NavigationService, public router: Router) {
      if (this.depth === undefined) {
         this.depth = 0;
      }
   }

   ngOnChanges() {
      this.navigationService.currentUrl.subscribe((url: string) => {
         if (this.item.route && url) {
            // console.log(`Checking '/${this.item.route}' against '${url}'`);
            this.expanded = url.indexOf(`/${this.item.route}`) === 0;
            this.ariaExpanded = this.expanded;
            //console.log(`${this.item.route} is expanded: ${this.expanded}`);
         }
      });
   }

   onItemSelected(item: NavItem) {
      if (!item.children || !item.children.length) {
         this.router.navigate([item.route]);

      }
      if (item.children && item.children.length) {
         this.expanded = !this.expanded;
      }
      //scroll
      window.scroll({
         top: 0,
         left: 0,
         behavior: 'smooth',
      });
      if (!this.expanded) {
         if (window.innerWidth < 1024) {
            this.notify.emit();
         }
      }
   }

   onSubItemSelected(item: NavItem) {
      if (!item.children || !item.children.length) {
         if (this.expanded && window.innerWidth < 1024) {
            this.notify.emit();
         }
      }
   }
}
