/**
 * Student Job Flow Tests
 * 
 * Verifies the core student journey:
 * 1. Student logs in
 * 2. Browses jobs page
 * 3. Opens a job details page
 * 4. Saves a job
 * 5. Applies to a job with a cover letter
 */

describe("Student Job Flow", () => {
    before(() => {
        cy.log("Starting student job flow tests");
    });

    it("student logs in and navigates to jobs page", () => {
        cy.loginAsStudent();
        cy.url().should("not.include", "/login");
        cy.visit("/jobs");
        cy.url().should("include", "/jobs");
    });

    it("student can view job listings", () => {
        cy.loginAsStudent();
        cy.visit("/jobs");
        // Wait for jobs to load
        cy.get('[data-cy^="job-card-"]', { timeout: 10000 }).should("have.length.greaterThan", 0);
    });

    it("student can open a job details page", () => {
        cy.loginAsStudent();
        cy.visit("/jobs");
        // Get the first job card and click its details link
        cy.get('[data-cy^="job-card-details-"]').first().click();
        // Should be on job details page with the job title visible
        cy.url().should("include", "/jobs/");
        cy.contains(/description|requirements|overview/i, { timeout: 5000 }).should("be.visible");
    });

    it("student can save a job", () => {
        cy.loginAsStudent();
        cy.visit("/jobs");
        // Get the first job card  
        cy.get('[data-cy^="job-card-"]').first().then(($card) => {
            const jobId = $card.attr("data-cy").replace("job-card-", "");
            // Click the save button
            cy.get(`[data-cy="job-card-save-${jobId}"]`).click();
            // Button should show as saved
            cy.get(`[data-cy="job-card-save-${jobId}"]`, { timeout: 5000 }).should("have.class", "saved");
        });
    });

    it("student can apply to a job with cover letter", () => {
        cy.loginAsStudent();
        cy.visit("/jobs");
        
        // Open first job details
        cy.get('[data-cy^="job-card-details-"]').first().click();
        
        // Click apply button
        cy.get('[data-cy="job-apply-button"]').click();
        
        // Modal should appear
        cy.get('[data-cy="modal-box"]').should("be.visible");
        
        // Fill in cover letter
        cy.get('[data-cy="application-cover-letter"]').type("I am very interested in this position because I have all the required skills and am eager to contribute to the team.");
        
        // Submit application
        cy.get('[data-cy="application-submit"]').click();
        
        // Should see success message or be redirected
        cy.contains(/success|submitted|thank you|already/i, { timeout: 10000 }).should("be.visible");
    });

    it("student can apply to a job without cover letter", () => {
        cy.loginAsStudent();
        cy.visit("/jobs");
        
        // Find a different job (or the same one if only one is available)
        cy.get('[data-cy^="job-card-details-"]').first().click();
        
        cy.get('[data-cy="job-apply-button"]').click();
        cy.get('[data-cy="modal-box"]').should("be.visible");
        
        // Don't fill in cover letter, just submit
        cy.get('[data-cy="application-submit"]').click();
        
        // Should succeed even without cover letter
        cy.contains(/success|submitted|thank you|already/i, { timeout: 10000 }).should("be.visible");
    });

    it("student can close application modal", () => {
        cy.loginAsStudent();
        cy.visit("/jobs");
        
        cy.get('[data-cy^="job-card-details-"]').first().click();
        cy.get('[data-cy="job-apply-button"]').click();
        cy.get('[data-cy="modal-box"]').should("be.visible");
        
        // Close modal
        cy.get('[data-cy="modal-close"]').click();
        cy.get('[data-cy="modal-box"]').should("not.exist");
    });
});

