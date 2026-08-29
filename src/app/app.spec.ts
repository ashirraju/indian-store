import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { ApiService } from './services/api.service';
import { StoreStateService } from './services/store-state.service';
import { App } from './app';

describe('App', () => {
  it('should create the app instance', () => {
    const injector = createEnvironmentInjector([ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const app = new App();
      expect(app).toBeTruthy();
    });
  });
});

