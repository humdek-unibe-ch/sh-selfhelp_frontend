import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { NavigationACL } from 'src/app/models/selfhelp.model';
import { BehaviorSubject, map } from 'rxjs';
import { NavItem } from 'src/app/layouts/full/vertical/sidebar/nav-item/nav-item';
import { Event, NavigationEnd, Route, Router, Routes } from '@angular/router';

@Injectable({
   providedIn: 'root'
})
export class NavigationService extends ApiService {

   // Define a BehaviorSubject to hold navigation items and make it observable
   private navItemsSubject = new BehaviorSubject<NavItem[]>([]);
   public navItems$ = this.navItemsSubject.asObservable();

   public currentUrl = new BehaviorSubject<any>(undefined);

   // Define the wildcard route
   private wildcardRoute = {
      path: '**',
      redirectTo: 'authentication/error',
   };

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
               route: nav.keyword,
               url: nav.url,
               keyword: nav.keyword
            }))
         )
      ).subscribe((items: NavItem[]) => {
         this.logService.debugLog('loadNavigation', items);
         this.navItemsSubject.next(items); // Push items to BehaviorSubject
         this.addRoutesDynamically(items);
      });
   }

   // Dynamically add routes
   private addRoutesDynamically(navItems: NavItem[]): void {
      const dynamicRoutes : Route[] = navItems.map(item => ({
         path: item.keyword,
         loadChildren: () =>
            import('../../pages/frontend/frontend-pages.routes').then((m) => m.PagesRoutes),
      }));

      // Ensure the wildcard route is always added last
      let r: Routes = [...this.router.config];
      r[0].children = [...dynamicRoutes];

      this.router.resetConfig(r);
      this.logService.debugLog('addRoutesDynamically', r);
   }

}
