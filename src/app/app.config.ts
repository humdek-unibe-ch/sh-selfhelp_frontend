import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, APP_INITIALIZER, } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, } from '@angular/common/http';
import { routes } from './app.routes';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration } from '@angular/platform-browser';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// perfect scrollbar
import { NgScrollbarModule } from 'ngx-scrollbar';

//Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavigationService } from './services/api/navigation.service';

function initializeNavigation(navService: NavigationService) {
   return () => navService.loadNavigation();
}

export const appConfig: ApplicationConfig = {
   providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(
         routes,
         withInMemoryScrolling({
            scrollPositionRestoration: 'enabled',
            anchorScrolling: 'enabled',
         }),
         withComponentInputBinding(),
      ),
      provideHttpClient(withInterceptorsFromDi()),
      provideClientHydration(),
      provideAnimationsAsync(),
      {

         provide: APP_INITIALIZER,
         useFactory: initializeNavigation,
         deps: [NavigationService],
         multi: true,
       },
      importProvidersFrom(
         FormsModule,
         ReactiveFormsModule,
         MaterialModule,
         TablerIconsModule.pick(TablerIcons),
         NgScrollbarModule
      )
   ],
};
