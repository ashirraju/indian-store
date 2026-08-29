import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { AppKeycloakService } from '../../services/app-keycloak.service';
import { ApiService } from '../../services/api.service';
import { StoreStateService } from '../../services/store-state.service';
import { OperationsViewComponent } from './operations-view.component';

describe('OperationsViewComponent', () => {
  it('should create operations view instance', () => {
    const injector = createEnvironmentInjector([AppKeycloakService, ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new OperationsViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});

