// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Bypass rate limiting for E2E tests
Cypress.on('before:request', () => {
    // This hook runs before each request
    // Set CYPRESS_TEST flag to skip rate limiting on backend
    process.env.CYPRESS_TEST = 'true';
});

// Intercept all XHR requests to add test header
beforeEach(() => {
    cy.intercept('**/api/**', (req) => {
        // Add test header to all API requests
        req.headers['X-Cypress-Test'] = 'true';
    }).as('apiRequest');
});
