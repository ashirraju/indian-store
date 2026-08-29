import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { AppKeycloakService } from './services/app-keycloak.service';
import { ApiService } from './services/api.service';
import { StoreStateService } from './services/store-state.service';
import { App } from './app';

describe('App Component', () => {
  it('should create app instance', () => {
    const injector = createEnvironmentInjector([AppKeycloakService, ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const app = new App();
      expect(app).toBeTruthy();
    });
  });
});

