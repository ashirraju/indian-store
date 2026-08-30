export const environment = {
  production: true,
  keycloak: {
    url: 'https://indian-store-auth.trader-news.co.in',
    realm: 'indian-store',
    clientId: 'indian-store-public',
    clientIdStaff: 'indian-store-public',
    clientIdCustomer: 'indian-store-customer'
  },
  api: {
    baseUrl: 'https://indian-store-api.trader-news.co.in/api/v1',
    healthUrl: 'https://indian-store-api.trader-news.co.in/api/health',
    docsUrl: 'https://indian-store-api.trader-news.co.in/api-docs/json'
  }
};
