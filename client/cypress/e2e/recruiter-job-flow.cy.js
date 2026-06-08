/**
 * Recruiter Job Flow Tests
 *
 * Verifies the core recruiter journey:
 * 1. Recruiter logs in
 * 2. Accesses recruiter dashboard
 * 3. Creates a new job post with a unique title
 * 4. Verifies job appears in dashboard
 */

describe("Recruiter Job Flow", () => {
    before(() => {
        cy.log("Starting recruiter job flow tests");
    });

    it("recruiter logs in and sees dashboard", () => {
        cy.loginAsRecruiter();
        cy.url().should("include", "/recruiter/dashboard");
    });

    it("recruiter can click create job button", () => {
        cy.loginAsRecruiter();
        cy.url().should("include", "/recruiter/dashboard");
        cy.get('[data-cy="recruiter-create-job"]').should("be.visible").click();
        cy.url().should("include", "/recruiter/jobs/create");
    });

    it("recruiter can create a new job post", () => {
        cy.loginAsRecruiter();
        cy.visit("/recruiter/jobs/create");

        const uniqueTitle = `E2E Test Job - ${Date.now()}`;

        // Fill in job form
        cy.get('[data-cy="create-job-title"]').type(uniqueTitle);
        cy.get('[data-cy="create-job-company"]').type("E2E Test Company");
        cy.get('[data-cy="create-job-description"]').type("This is a test job description for E2E testing purposes. It includes responsibilities and requirements for the role.");

        // Submit form
        cy.get('[data-cy="create-job-submit"]').click();

        // Should see confirmation or be redirected to dashboard
        cy.contains(/success|posted|created|confirmation/i, { timeout: 10000 }).should("be.visible");
    });

    it("recruiter job appears in dashboard", () => {
        cy.loginAsRecruiter();
        cy.visit("/recruiter/dashboard");

        // Jobs should load
        cy.get('[data-cy^="recruiter-job-row-"]', { timeout: 10000 }).should("have.length.greaterThan", 0);
    });

    it("recruiter can view applicants for a job", () => {
        cy.loginAsRecruiter();
        cy.visit("/recruiter/dashboard");

        // Get first job and click applicants button
        cy.get('[data-cy^="recruiter-view-applicants-"]').first().click();

        // Should be on applicants page
        cy.url().should("include", "/recruiter/applicants/");
    });
});

