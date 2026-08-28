import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { createEnvironmentInjector } from '@angular/core';
import { StoreStateService } from '../../services/store-state.service';
import { OperationsViewComponent } from './operations-view.component';

describe('OperationsViewComponent', () => {
  it('should create operations view instance', () => {
    const injector = createEnvironmentInjector([StoreStateService], null as any);
    injector.runInContext(() => {
      const comp = new OperationsViewComponent();
      expect(comp).toBeTruthy();
    });
  });
});
