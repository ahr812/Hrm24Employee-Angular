import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHighcharts } from 'highcharts-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHighcharts({
      instance: () => import('highcharts/esm/highcharts').then(module => module.default),
      modules: () => [import('highcharts/esm/modules/accessibility')]
    })
  ]
};
