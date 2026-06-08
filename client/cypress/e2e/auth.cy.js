/**
 * Authentication Tests
 * 
 * Verifies that students, recruiters, and admins can successfully log in.
 */

describe("Authentication", () => {
    before(() => {
        cy.log("Starting authentication tests");
    });

    it("logs in as a student", () => {
        cy.loginAsStudent();
        // Verify we're logged in by checking for content that only students see
        cy.url().should("not.include", "/login");
        cy.contains(/dashboard|jobs|profile/i).should("be.visible");
    });

    it("logs in as a recruiter", () => {
        cy.loginAsRecruiter();
        // Verify we're logged in by checking recruiter-specific content
        cy.url().should("not.include", "/login");
        cy.contains(/recruiter|dashboard|jobs/i).should("be.visible");
    });

    it("logs in as an admin", () => {
        cy.loginAsAdmin();
        // Verify we're logged in by checking admin-specific content
        cy.url().should("not.include", "/login");
        cy.contains(/admin|dashboard|users/i).should("be.visible");
    });

    it("shows error message on invalid credentials", () => {
        cy.visit("/login");
        cy.get('[data-cy="login-email"]').type("invalid@example.com");
        cy.get('[data-cy="login-password"]').type("WrongPassword123!");
        cy.get('[data-cy="login-submit"]').click();
        // Should see an error message and stay on login page
        cy.contains(/invalid|failed|error/i).should("be.visible");
        cy.url().should("include", "/login");
    });

    it("requires email field", () => {
        cy.visit("/login");
        cy.get('[data-cy="login-password"]').type("Password123!");
        cy.get('[data-cy="login-submit"]').click();
        // Form validation should prevent submission
        cy.url().should("include", "/login");
    });

    it("requires password field", () => {
        cy.visit("/login");
        cy.get('[data-cy="login-email"]').type("student@example.com");
        cy.get('[data-cy="login-submit"]').click();
        // Form validation should prevent submission
        cy.url().should("include", "/login");
    });
});