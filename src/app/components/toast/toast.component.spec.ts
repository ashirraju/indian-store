import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  it('should create toast component instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new ToastComponent();
      expect(comp).toBeTruthy();
    });
  });
});
