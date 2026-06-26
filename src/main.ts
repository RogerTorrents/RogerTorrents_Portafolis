import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeCa from '@angular/common/locales/ca';
import localeEs from '@angular/common/locales/es';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeCa);
registerLocaleData(localeEs);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
