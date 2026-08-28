import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from './services/store-state.service';
import { App } from './app';

describe('App', () => {
  it('should create the app instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const app = new App();
      expect(app).toBeTruthy();
    });
  });
});
