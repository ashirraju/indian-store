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
    path: 'orders',
    loadComponent: () =>
      import('./views/customer/customer-orders/customer-orders.component').then(
        m => m.CustomerOrdersComponent
      )
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./views/admin/admin-view.component').then(m => m.AdminViewComponent),
    canActivate: [roleAuthGuard(AppRole.ADMIN)],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./views/management/products/products-catalog.component').then(
                m => m.ProductsCatalogComponent
              )
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./views/management/products/product-editor/product-editor.component').then(
                m => m.ProductEditorComponent
              )
          }
        ]
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./views/management/categories/categories-management.component').then(
            m => m.CategoriesManagementComponent
          )
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./views/management/orders/orders-management.component').then(
            m => m.OrdersManagementComponent
          )
      },
      {
        path: 'banners',
        loadComponent: () =>
          import('./views/management/banners/banners-management.component').then(
            m => m.BannersManagementComponent
          )
      }
    ]
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
    canActivate: [roleAuthGuard(AppRole.OPERATIONS)],
    children: [
      { path: '', redirectTo: 'pipeline', pathMatch: 'full' },
      {
        path: 'pipeline',
        loadComponent: () =>
          import('./views/operations/pages/operations-pipeline/operations-pipeline.component').then(
            m => m.OperationsPipelineComponent
          )
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./views/management/products/products-catalog.component').then(
                m => m.ProductsCatalogComponent
              )
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./views/management/products/product-editor/product-editor.component').then(
                m => m.ProductEditorComponent
              )
          }
        ]
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./views/management/categories/categories-management.component').then(
            m => m.CategoriesManagementComponent
          )
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./views/management/orders/orders-management.component').then(
            m => m.OrdersManagementComponent
          )
      },
      {
        path: 'banners',
        loadComponent: () =>
          import('./views/management/banners/banners-management.component').then(
            m => m.BannersManagementComponent
          )
      },
      {
        path: 'replenishment',
        loadComponent: () =>
          import('./views/operations/pages/operations-replenishment/operations-replenishment.component').then(
            m => m.OperationsReplenishmentComponent
          )
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./views/operations/pages/operations-notifications/operations-notifications.component').then(
            m => m.OperationsNotificationsComponent
          )
      }
    ]
  },
  {
    path: 'delivery',
    loadComponent: () =>
      import('./views/delivery/delivery-view.component').then(m => m.DeliveryViewComponent),
    canActivate: [roleAuthGuard(AppRole.DELIVERY)]
  },
  { path: '**', redirectTo: 'store' }
];
