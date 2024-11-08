import { Routes } from '@angular/router';
import { FrontendPageComponent } from './frontend-page/frontend-page.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: FrontendPageComponent,
    data: {
      title: 'Front End',
      urls: [
        { title: 'Home', url: '/home' },
        { title: 'Home' },
      ],
    },
  },
];
