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

   // Define the wildcard route
   private homeRedirect: Route = {
      path: '',
      redirectTo: '/home',
      pathMatch: 'full',
   };

   constructor(private router: Router) {
      super();
      this.loadNavigation();
      this.router.events.subscribe((event: Event) => {
         if (event instanceof NavigationEnd) {
            this.currentUrl.next(event.urlAfterRedirects);
            this.loadNavigation();
         }
      });
   }

   public async loadNavigation(): Promise<void> {
      return new Promise((resolve, reject) => {
         this.makeRequest('GET', '/nav/pages/web', { mobile: true, web: true }).pipe(
            map((response: { success: boolean; data: NavigationACL[] }) =>
               response.data.map(nav => ({
                  displayName: nav.keyword,
                  route: nav.keyword,
                  url: nav.url,
                  keyword: nav.keyword
               }))
            )
         ).subscribe({
            next: (items: NavItem[]) => {
               this.logService.debugLog('loadNavigation', items);
               this.navItemsSubject.next(items); // Push items to BehaviorSubject
               this.addRoutesDynamically(items);
               resolve();
            },
            error: (err) => {
               this.logService.errorLog('loadNavigation error', err);
               reject(err);
            }
         });
      });
   }

   // Dynamically add routes
   private addRoutesDynamically(navItems: NavItem[]): void {
      this.logService.debugLog('addRoutesDynamically');
      const dynamicRoutes: Route[] = navItems.map(item => ({
         path: item.keyword,
         loadChildren: () =>
            import('../../pages/frontend/frontend-pages.routes').then((m) => m.PagesRoutes),
      }));

      // Ensure the wildcard route is always added last
      let r: Routes = [...this.router.config];
      r[0].children = [this.homeRedirect, ...dynamicRoutes];

      this.router.resetConfig(r);
      this.logService.debugLog('addRoutesDynamically Result', r);
   }

}
