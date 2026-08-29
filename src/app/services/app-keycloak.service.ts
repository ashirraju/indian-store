import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { AppRole } from '../models/user.model';
import { KEYCLOAK_CONFIG, STORAGE_KEYS, APP_ROUTES } from '../constants';

export interface KeycloakUserProfile {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface KeycloakConfigOptions {
  url: string;
  realm: string;
  clientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppKeycloakService {
  private keycloakInstance: Keycloak | null = null;

  // Keycloak Connection Config
  readonly config: KeycloakConfigOptions = {
    url: KEYCLOAK_CONFIG.URL,
    realm: KEYCLOAK_CONFIG.REALM,
    clientId: KEYCLOAK_CONFIG.CLIENT_ID
  };

  // Reactive State Signals
  readonly isAuthenticated = signal<boolean>(false);
  readonly currentUser = signal<KeycloakUserProfile | null>(null);
  readonly token = signal<string | null>(null);
  readonly isInitialized = signal<boolean>(false);

  constructor() {
    this.restoreSessionFromStorage();
    this.initKeycloak();
  }

  private restoreSessionFromStorage() {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (savedUser && savedToken) {
        this.currentUser.set(JSON.parse(savedUser));
        this.token.set(savedToken);
        this.isAuthenticated.set(true);
      }
    } catch {
      // Storage unavailable or corrupted
    }
  }

  private saveSessionToStorage(user: KeycloakUserProfile, tokenStr: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenStr);
    } catch {
      // Storage unavailable
    }
  }

  private clearSessionFromStorage() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TARGET_PATH);
      sessionStorage.removeItem(STORAGE_KEYS.TARGET_ROLE);
    } catch {
      // Storage unavailable
    }
  }

  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize Keycloak client and process SSO / redirect tokens
   */
  async initKeycloak(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.keycloakInstance = new Keycloak({
          url: this.config.url,
          realm: this.config.realm,
          clientId: this.config.clientId
        });

        const authenticated = await this.keycloakInstance.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          pkceMethod: 'S256'
        });

        this.isInitialized.set(true);

        if (authenticated && this.keycloakInstance.token) {
          this.token.set(this.keycloakInstance.token);
          this.isAuthenticated.set(true);

          let profile: any = {};
          try {
            profile = await this.keycloakInstance.loadUserProfile();
          } catch {
            const parsed = this.keycloakInstance.tokenParsed as any;
            profile = {
              username: parsed?.preferred_username,
              email: parsed?.email,
              firstName: parsed?.given_name,
              lastName: parsed?.family_name
            };
          }

          const realmRoles = this.keycloakInstance.realmAccess?.roles || [];
          const clientRoles = this.keycloakInstance.resourceAccess?.[this.config.clientId]?.roles || [];
          const allRoles = Array.from(new Set([...realmRoles, ...clientRoles])).map(r => r.toLowerCase());

          const user: KeycloakUserProfile = {
            username: profile.username || 'staff.user',
            email: profile.email || 'staff@indianstore.com.au',
            firstName: profile.firstName || 'Staff',
            lastName: profile.lastName || 'Member',
            roles: allRoles
          };

          this.currentUser.set(user);
          this.saveSessionToStorage(user, this.keycloakInstance.token);

          // Extract and resolve target path immediately
          const savedPath = sessionStorage.getItem(STORAGE_KEYS.TARGET_PATH);
          const currentHash = window.location.hash.replace(/^#/, '').split('?')[0];
          let targetPath = savedPath || (currentHash && currentHash !== '/' && currentHash !== '/store' ? currentHash : null);

          if (!targetPath) {
            if (allRoles.includes('admin')) targetPath = APP_ROUTES.ADMIN;
            else if (allRoles.includes('manager')) targetPath = APP_ROUTES.MANAGER;
            else if (allRoles.includes('operations')) targetPath = APP_ROUTES.OPERATIONS;
            else if (allRoles.includes('delivery')) targetPath = APP_ROUTES.DELIVERY;
          }

          sessionStorage.removeItem(STORAGE_KEYS.TARGET_PATH);
          sessionStorage.removeItem(STORAGE_KEYS.TARGET_ROLE);

          if (targetPath && typeof window !== 'undefined') {
            window.location.hash = '#' + targetPath;
          }
          return true;
        }
        return false;
      } catch (err: any) {
        console.warn('Keycloak initialization:', err?.message || err);
        this.isInitialized.set(true);
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Directly redirect browser to Keycloak Login Page
   */
  async loginWithKeycloak(targetPath: string = APP_ROUTES.ADMIN, targetRole: AppRole = 'Admin') {
    try {
      sessionStorage.setItem(STORAGE_KEYS.TARGET_PATH, targetPath);
      sessionStorage.setItem(STORAGE_KEYS.TARGET_ROLE, targetRole);

      if (!this.keycloakInstance) {
        this.keycloakInstance = new Keycloak({
          url: this.config.url,
          realm: this.config.realm,
          clientId: this.config.clientId
        });
        await this.keycloakInstance.init({ onLoad: 'check-sso', checkLoginIframe: false });
      }

      const redirectUri = window.location.origin + window.location.pathname + '#' + targetPath;
      await this.keycloakInstance.login({
        redirectUri
      });
    } catch (err: any) {
      console.error('Keycloak login redirect error:', err);
      // Direct redirect fallback to Keycloak auth endpoint
      const authUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/auth?client_id=${encodeURIComponent(
        this.config.clientId
      )}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname + '#' + targetPath)}&response_type=code&scope=openid`;
      window.location.href = authUrl;
    }
  }

  /**
   * Check access for protected roles. If not authenticated, immediately redirect to Keycloak login page.
   */
  requireAuthForRole(targetRole: AppRole, targetPath?: string): boolean {
    if (targetRole === 'Customer') return true;

    if (this.isAuthenticated()) {
      return this.hasTokenRole(targetRole);
    }

    // Not authenticated -> Trigger direct Keycloak login page redirect
    const path = targetPath || `/${targetRole.toLowerCase()}`;
    this.loginWithKeycloak(path, targetRole);
    return false;
  }

  /**
   * Log out from Keycloak server and redirect back to customer storefront
   */
  async logout() {
    this.clearSessionFromStorage();
    this.currentUser.set(null);
    this.token.set(null);
    this.isAuthenticated.set(false);

    const redirectUri = window.location.origin + window.location.pathname + '#' + APP_ROUTES.STORE;
    if (this.keycloakInstance && this.keycloakInstance.authenticated) {
      try {
        await this.keycloakInstance.logout({ redirectUri });
        return;
      } catch {
        // Fallback
      }
    }
    window.location.href = redirectUri;
  }

  /**
   * Check if access token contains the specified role
   */
  hasTokenRole(role: AppRole | string): boolean {
    const targetRole = role.toString().toLowerCase();
    const user = this.currentUser();
    const tokenStr = this.token();

    // 1. Check cached user roles
    if (user?.roles?.map(r => r.toLowerCase()).includes(targetRole) || user?.roles?.map(r => r.toLowerCase()).includes('admin')) {
      return true;
    }

    // 2. Check live keycloak tokenParsed
    if (this.keycloakInstance?.tokenParsed) {
      const parsed = this.keycloakInstance.tokenParsed as any;
      const realmRoles = (parsed.realm_access?.roles || []).map((r: string) => r.toLowerCase());
      const clientRoles = (parsed.resource_access?.[this.config.clientId]?.roles || []).map((r: string) => r.toLowerCase());
      const all = [...realmRoles, ...clientRoles];
      if (all.includes(targetRole) || all.includes('admin')) {
        return true;
      }
    }

    // 3. Fallback: Parse raw JWT token
    if (tokenStr) {
      const decoded = this.parseJwt(tokenStr);
      if (decoded) {
        const realmRoles = (decoded.realm_access?.roles || []).map((r: string) => r.toLowerCase());
        const clientRoles = (decoded.resource_access?.[this.config.clientId]?.roles || []).map((r: string) => r.toLowerCase());
        const all = [...realmRoles, ...clientRoles];
        if (all.includes(targetRole) || all.includes('admin')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Parse JWT payload without external library
   */
  parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.hasTokenRole(role);
  }

  /**
   * Get bearer token for API headers
   */
  getToken(): string {
    return this.token() || 'dev-token';
  }
}
