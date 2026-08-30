export const environment = {
  production: false,
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'indian-store',
    clientId: 'indian-store-public',
    clientIdStaff: 'indian-store-public',
    clientIdCustomer: 'indian-store-customer'
  },
  api: {
    baseUrl: 'http://localhost:5001/api/v1',
    healthUrl: 'http://localhost:5001/api/health',
    docsUrl: 'http://localhost:5001/api-docs/json'
  }
};
