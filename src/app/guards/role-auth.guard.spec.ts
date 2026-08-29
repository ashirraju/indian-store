import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { AppKeycloakService } from '../services/app-keycloak.service';
import { ApiService } from '../services/api.service';
import { StoreStateService } from '../services/store-state.service';
import { roleAuthGuard } from './role-auth.guard';
import { AppRole } from '../enums';

describe('RoleAuthGuard', () => {
  it('should allow customer route access without authentication', () => {
    const injector = createEnvironmentInjector([AppKeycloakService, ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const guard = roleAuthGuard(AppRole.CUSTOMER);
      const result = (guard as any)({} as any, { url: '/store' } as any);
      expect(result).toBe(true);
    });
  });

  it('should trigger login redirect when unauthenticated for admin route', () => {
    const injector = createEnvironmentInjector([AppKeycloakService, ApiService, StoreStateService], null as any);
    injector.runInContext(() => {
      const guard = roleAuthGuard(AppRole.ADMIN);
      const result = (guard as any)({} as any, { url: '/admin' } as any);
      expect(result).toBe(false);
    });
  });
});
