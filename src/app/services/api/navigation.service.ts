import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { NavigationACL } from 'src/app/models/selfhelp.model';
import { BehaviorSubject, map } from 'rxjs';
import { NavItem } from 'src/app/layouts/full/vertical/sidebar/nav-item/nav-item';
import { Event, NavigationEnd, Router } from '@angular/router';

@Injectable({
   providedIn: 'root'
})
export class NavigationService extends ApiService {

   // Define a BehaviorSubject to hold navigation items and make it observable
   private navItemsSubject = new BehaviorSubject<NavItem[]>([]);
   public navItems$ = this.navItemsSubject.asObservable();

   public currentUrl = new BehaviorSubject<any>(undefined);

   constructor(private router: Router) {
      super();
      this.loadNavigation();
      this.router.events.subscribe((event: Event) => {
         if (event instanceof NavigationEnd) {
             this.currentUrl.next(event.urlAfterRedirects);
         }
     });
   }

   public loadNavigation(): void {
      this.makeRequest('GET', '/nav/pages/web', { mobile: true, web: true }).pipe(
         map((response: { success: boolean; data: NavigationACL[] }) =>
            response.data.map(nav => ({
               displayName: nav.keyword,
               route: nav.url,
            }))
         )
      ).subscribe(items => {
         this.logService.debugLog('loadNavigation', items);
         this.navItemsSubject.next(items); // Push items to BehaviorSubject
      });
   }

}
