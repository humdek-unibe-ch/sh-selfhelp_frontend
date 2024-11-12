import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppSettings } from './config';

export const routes: Routes = [
    {
        path: '',
        component: FullComponent,
      //   data: {
      //       frontendSettings: {
      //           dir: 'ltr',
      //           theme: 'light',
      //           sidenavOpened: true,
      //           sidenavCollapsed: false,
      //           boxed: true,
      //           horizontal: false,
      //           cardBorder: false,
      //           activeTheme: 'blue_theme',
      //           language: 'en-us',
      //           navPos: 'side',
      //       } as AppSettings,
      //   },
        children: [
            {
                path: '',
                redirectTo: '/home',
                pathMatch: 'full',
            }
        ],
    },
    {
        path: '',
        component: BlankComponent,
        children: [
            {
                path: 'authentication',
                loadChildren: () =>
                    import('./pages/authentication/authentication.routes').then(
                        (m) => m.AuthenticationRoutes
                    ),
            },
            {
                path: 'landingpage',
                loadChildren: () =>
                    import('./pages/landingpage/landingpage.routes').then(
                        (m) => m.LandingPageRoutes
                    ),
            }
        ],
    },
    {
        path: '**',
        redirectTo: 'authentication/error',
    },
];
