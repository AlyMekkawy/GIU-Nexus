import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "GIU_Nexus",

  // Viewport settings
  viewportWidth: 1280,
  viewportHeight: 720,

  // Timeout settings (in milliseconds)
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  execTimeout: 60000,
  taskTimeout: 60000,

  // Screenshot and video settings
  screenshotOnRunFailure: true,
  screenshotsFolder: "cypress/screenshots",
  videosFolder: "cypress/videos",
  video: true,
  videoUploadOnPasses: false,

  // Reporter settings
  reporter: "spec",
  reporterOptions: {
    mochaFile: "cypress/results/test-results.xml",
    toConsole: true,
  },

  // Retry logic
  retries: {
    runMode: 1,
    openMode: 0,
  },

  // API configuration for tests
  env: {
    API_URL: "http://localhost:5000",
    seedE2E: false, // Set to true to seed test data before tests
    // E2E test credentials
    studentEmail: "student.e2e@giu-nexus.com",
    studentPassword: "Password123!",
    recruiterEmail: "recruiter.e2e@giu-nexus.com",
    recruiterPassword: "Password123!",
    adminEmail: "admin.e2e@giu-nexus.com",
    adminPassword: "Password123!",
  },

  // E2E configuration
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      // Setup hooks for seeding and other operations
    },
  },

  // Component testing configuration (optional)
  component: {
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.js",
    devServer: {
      framework: "vite",
      bundler: "vite",
    },
  },

  // Enable environment variable access in tests
  allowCypressEnv: true,
});
