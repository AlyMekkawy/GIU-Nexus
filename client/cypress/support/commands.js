Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");

  cy.get('[data-cy="login-email"]').clear().type(email);
  cy.get('[data-cy="login-password"]').clear().type(password, { log: false });
  cy.get('[data-cy="login-submit"]').click();

  cy.url().should("not.include", "/login");
});

Cypress.Commands.add("loginAsStudent", () => {
  cy.login(Cypress.env("studentEmail"), Cypress.env("studentPassword"));
});

Cypress.Commands.add("loginAsRecruiter", () => {
  cy.login(Cypress.env("recruiterEmail"), Cypress.env("recruiterPassword"));
});

Cypress.Commands.add("loginAsAdmin", () => {
  cy.login(Cypress.env("adminEmail"), Cypress.env("adminPassword"));
});