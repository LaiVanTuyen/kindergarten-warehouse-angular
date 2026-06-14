import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  authInterceptor,
  csrfInterceptor,
  API_URL,
  environment,
} from '@kindergarten-warehouse/data-access';

echarts.use([
  LineChart,
  PieChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(
      // Order matters: authInterceptor outer, csrfInterceptor inner. On the
      // error path csrf runs first so it can swallow/retry a transient CSRF 403
      // before authInterceptor would surface a spurious "Forbidden" toast.
      withInterceptors([authInterceptor, csrfInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),
    provideEchartsCore({ echarts }),
    {
      provide: API_URL,
      useValue: environment.apiUrl,
    },
  ],
};
