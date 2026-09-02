import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppKeycloakService } from '../services/app-keycloak.service';
import { StoreStateService } from '../services/store-state.service';
import { AppRole, AppRoutes } from '../enums';

/**
 * Keycloak Access Token Role-Based Route Guard
 * Validates active session and inspects JWT access token for the required role.
 */
export const roleAuthGuard = (requiredRole: AppRole): CanActivateFn => {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const keycloak = inject(AppKeycloakService);
    const store = inject(StoreStateService);

    // Customer storefront is public
    if (requiredRole === AppRole.CUSTOMER) {
      return true;
    }

    // Ensure Keycloak has completed initialization
    if (!keycloak.isInitialized()) {
      await keycloak.initKeycloak();
    }

    // 1. If not authenticated, redirect directly to Keycloak Login Page
    if (!keycloak.isAuthenticated()) {
      const targetPath = state.url || `/${requiredRole.toLowerCase()}`;
      keycloak.loginWithKeycloak(targetPath, requiredRole);
      return false;
    }

    // 2. Validate that the JWT access token contains the required role
    const hasRoleInToken = keycloak.hasTokenRole(requiredRole);
    if (!hasRoleInToken) {
      store.showToast(
        'error',
        'Access Denied (Role Missing)',
        `Your Keycloak account does not have the "${requiredRole}" role to access this portal.`
      );
      // Redirect to customer store
      store.navigateTo(AppRoutes.STORE);
      return false;
    }

    // 3. User is authenticated and authorized
    store.activeRole.set(requiredRole);
    return true;
  };
};
