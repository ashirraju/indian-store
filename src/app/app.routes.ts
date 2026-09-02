import { Routes } from '@angular/router';
import { roleAuthGuard } from './guards/role-auth.guard';
import { AppRole } from './enums';

export const routes: Routes = [
  { path: '', redirectTo: 'store', pathMatch: 'full' },
  {
    path: 'store',
    loadComponent: () =>
      import('./views/customer/customer-view.component').then(m => m.CustomerViewComponent)
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./views/admin/admin-view.component').then(m => m.AdminViewComponent),
    canActivate: [roleAuthGuard(AppRole.ADMIN)]
  },
  {
    path: 'manager',
    loadComponent: () =>
      import('./views/manager/manager-view.component').then(m => m.ManagerViewComponent),
    canActivate: [roleAuthGuard(AppRole.MANAGER)]
  },
  {
    path: 'operations',
    loadComponent: () =>
      import('./views/operations/operations-view.component').then(m => m.OperationsViewComponent),
    canActivate: [roleAuthGuard(AppRole.OPERATIONS)]
  },
  {
    path: 'delivery',
    loadComponent: () =>
      import('./views/delivery/delivery-view.component').then(m => m.DeliveryViewComponent),
    canActivate: [roleAuthGuard(AppRole.DELIVERY)]
  },
  { path: '**', redirectTo: 'store' }
];

