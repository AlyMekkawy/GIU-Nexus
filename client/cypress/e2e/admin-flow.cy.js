/**
 * Admin Flow Tests
 *
 * Verifies admin access and basic moderation capabilities:
 * 1. Admin logs in
 * 2. Accesses admin dashboard
 * 3. Can navigate to users moderation page
 * 4. Can navigate to jobs moderation page
 * 5. Can navigate to recruiters moderation page
 */

describe("Admin Flow", () => {
    before(() => {
        cy.log("Starting admin flow tests");
    });

    it("admin logs in and sees admin dashboard", () => {
        cy.loginAsAdmin();
        cy.url().should("include", "/admin/dashboard");
    });

    it("admin dashboard displays metrics", () => {
        cy.loginAsAdmin();
        cy.visit("/admin/dashboard");

        // Check for common dashboard elements
        cy.contains(/dashboard|users|jobs|recruiters|stats/i, { timeout: 5000 }).should("be.visible");
    });

    it("admin can navigate to users page", () => {
        cy.loginAsAdmin();
        cy.visit("/admin/dashboard");

        // Navigate to users page - could be via link or sidebar
        cy.visit("/admin/users");
        cy.url().should("include", "/admin/users");
    });

    it("admin can navigate to jobs page", () => {
        cy.loginAsAdmin();
        cy.visit("/admin/dashboard");

        // Navigate to jobs page
        cy.visit("/admin/jobs");
        cy.url().should("include", "/admin/jobs");
    });

    it("admin can navigate to recruiters moderation page", () => {
        cy.loginAsAdmin();
        cy.visit("/admin/dashboard");

        // Navigate to recruiters page
        cy.visit("/admin/recruiters");
        cy.url().should("include", "/admin/recruiters");
    });

    it("admin dashboard is not accessible to students", () => {
        cy.loginAsStudent();

        // Try to access admin dashboard - should be redirected or denied
        cy.visit("/admin/dashboard", { failOnStatusCode: false });

        // Should either be redirected away or see error
        cy.url().then((url) => {
            expect(!url.includes("/admin/dashboard")).to.be.true;
        });
    });

    it("admin dashboard is not accessible to recruiters", () => {
        cy.loginAsRecruiter();

        // Try to access admin dashboard - should be redirected or denied
        cy.visit("/admin/dashboard", { failOnStatusCode: false });

        // Should either be redirected away or see error
        cy.url().then((url) => {
            expect(!url.includes("/admin/dashboard")).to.be.true;
        });
    });
});

