import { Routes } from '@angular/router';
import { CustomerViewComponent } from './views/customer/customer-view.component';
import { AdminViewComponent } from './views/admin/admin-view.component';
import { ManagerViewComponent } from './views/manager/manager-view.component';
import { OperationsViewComponent } from './views/operations/operations-view.component';
import { DeliveryViewComponent } from './views/delivery/delivery-view.component';
import { roleAuthGuard } from './guards/role-auth.guard';
import { AppRole } from './enums';

export const routes: Routes = [
  { path: '', redirectTo: 'store', pathMatch: 'full' },
  { path: 'store', component: CustomerViewComponent },
  {
    path: 'admin',
    component: AdminViewComponent,
    canActivate: [roleAuthGuard(AppRole.ADMIN)]
  },
  {
    path: 'manager',
    component: ManagerViewComponent,
    canActivate: [roleAuthGuard(AppRole.MANAGER)]
  },
  {
    path: 'operations',
    component: OperationsViewComponent,
    canActivate: [roleAuthGuard(AppRole.OPERATIONS)]
  },
  {
    path: 'delivery',
    component: DeliveryViewComponent,
    canActivate: [roleAuthGuard(AppRole.DELIVERY)]
  },
  { path: '**', redirectTo: 'store' }
];
