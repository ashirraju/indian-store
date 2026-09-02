import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { AppKeycloakService } from './services/app-keycloak.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideAppInitializer(() => {
      const keycloak = inject(AppKeycloakService);
      // Skip Keycloak for guests on initial load.
      // Only initialize on startup if returning from a Keycloak auth redirect callback.
      if (keycloak.hasAuthCallback()) {
        return keycloak.initKeycloak();
      }
      return Promise.resolve(false);
    })
  ]
};
