# GIU Nexus

GIU Nexus is a full-stack job and internship platform for university students, recruiters, and admins. The project combines a React/Vite frontend with an Express/MongoDB backend and includes role-based access, job management, applications, profile tools, AI-assisted workflows, and API documentation.

## Features

- JWT authentication with role-based access for job seekers, recruiters, and admins
- Password reset flow with email delivery and OTP verification
- Profile management for students/job seekers
- Job browsing, job details, saved jobs, and recommended jobs
- Recruiter job posting, editing, and applicant management
- Admin dashboards for recruiter, job, and user moderation
- AI-powered helpers via Hugging Face
- File upload support with Cloudinary
- Centralized error handling, CORS, and rate limiting
- Swagger API documentation
- Jest/Supertest integration tests for core flows

## Tech Stack

- **Frontend:** React 19, React Router, Vite
- **UI/Animation:** Tailwind CSS 4, GSAP, Three.js, React Three Fiber, Drei
- **Backend:** Node.js, Express 5
- **Database:** MongoDB, Mongoose
- **Auth:** JSON Web Tokens (JWT), bcryptjs
- **AI Integrations:** Hugging Face Inference API
- **File Uploads:** Multer, Cloudinary
- **Email:** Nodemailer
- **API Docs:** Swagger UI / swagger-jsdoc
- **Testing:** Jest, Supertest, mongodb-memory-server

## Project Structure

```text
.
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   └── package.json
├── docker-compose.yml
├── package.json
└── README.md
```

## Getting Started

### Install dependencies

```bash
npm run install:all
```

### Run the backend

```bash
npm run server
```

### Run the frontend

```bash
npm run client
```

### Run server tests

```bash
npm test
```

### Optional Docker setup

The repository also includes `docker-compose.yml` for running the stack with Docker.

## Environment Variables

Create `server/.env` and `client/.env` with the values your deployment needs.

```server/.env
PORT=5004
HOST=0.0.0.0
MONGO_URI=mongodb://localhost:27017/giu-nexus
MONGO_DOCKER_URI=mongodb://mongo:27017/giu-nexus

CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRE=7d

HF_TOKEN=hf_xxxxxxxxxxxxxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=xxxxxxx@gmail.com
EMAIL_PASS=xxxxxxxxxxxxxxxx

CLOUDINARY_CLOUD_NAME=xxxxxxxxxx
CLOUDINARY_API_KEY=xxxxxxxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxx
```

```client/.env
VITE_API_URL = http://127.0.0.4:5004/api/v1
VITE_API_URL_PROD = your_prod_url_here
BACKEND_URL = http://127.0.0.7:5004
```

- `PORT`: Port used by the Express server.
- `HOST`: Host interface for the backend.
- `MONGO_URI`: MongoDB connection string.
- `CLIENT_URL`: Allowed frontend origin for CORS.
- `JWT_SECRET`: Secret used to sign JWTs.
- `JWT_EXPIRE`: JWT lifetime, such as `7d` or `1h`.
- `HF_TOKEN`: Hugging Face Inference API token.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP settings for password reset emails.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary credentials for uploads.
- `BACKEND_URL`: Backend URL used by the Vite config and Docker build defaults.

## E2E Testing with Cypress

The project includes a comprehensive Cypress E2E test suite that validates core platform flows for students, recruiters, and admins.

### Prerequisites

Ensure both frontend and backend are running before starting E2E tests:

```bash
# Terminal 1: Start backend IN TEST MODE (disables rate limiting)
cd server && npm run dev
# or for non-development mode:
# CYPRESS_TEST=true set this in your env file

# Terminal 2: Start frontend (from root or client directory)
npm run client
# or
cd client && npm run dev
```

MongoDB must also be running. Update `MONGO_URI` in `server/.env` if using a non-default connection.

### Seed Test Data

Before running tests, populate the database with E2E test accounts and sample jobs:

```bash
cd server
npm run seed:e2e
```

This creates:
- **Student**: `student.e2e@giu-nexus.com` / `Password123!`
- **Recruiter**: `recruiter.e2e@giu-nexus.com` / `Password123!`
- **Admin**: `admin.e2e@giu-nexus.com` / `Password123!`
- **Sample jobs** created by seeded recruiter
- **Sample applications** from seeded student to first job

### Run Cypress Tests Interactively

Opens the Cypress Test Runner (recommended for development):

```bash
cd client
npm run cy:open
```

Then select **E2E Testing** and choose your browser (Chrome, Firefox, Edge).

### Run Cypress Tests Headless

Runs all tests in headless mode without UI (useful for CI/CD):

```bash
cd client
npm run cy:run
# or
npm run test:e2e
```

### Available Test Suites

| Test File | Coverage | Status |
|-----------|----------|--------|
| `auth.cy.js` | Login flows for all roles + validation | ✓ Student, Recruiter, Admin |
| `student-job-flow.cy.js` | Browse jobs, view details, save, apply | ✓ Uses seeded jobs |
| `recruiter-job-flow.cy.js` | Create job post, view dashboard | ✓ Creates unique job with timestamp |
| `recruiter-applicants-flow.cy.js` | View applicants, manage status | ✓ Uses seeded applications |
| `admin-flow.cy.js` | Admin dashboard, moderation pages | ✓ Users, Jobs, Recruiters |

### Cypress Configuration

Key files:
- `client/cypress.config.js` - Main Cypress configuration
- `client/cypress.env.json` - Test credentials and environment URLs
- `client/cypress/support/commands.js` - Custom login commands
- `client/cypress/support/e2e.js` - Global test setup

### Test Data Selectors

All E2E tests use `data-cy` attributes for stable element selection:

- Forms: `data-cy="login-email"`, `data-cy="create-job-title"`, etc.
- Buttons: `data-cy="job-apply-button"`, `data-cy="recruiter-create-job"`, etc.
- Cards/Rows: `data-cy="job-card-${jobId}"`, `data-cy="applicant-row-${appId}"`, etc.
- Modals: `data-cy="modal-box"`, `data-cy="modal-confirm"`, etc.

### Notes

- Tests use seeded data that is recreated each run (non-destructive)
- Email delivery is not tested (OTP, password reset) - focuses on platform flows only  
- Cloudinary uploads are mocked in test data (not required for E2E)
- Tests run sequentially to avoid race conditions
- Screenshots and videos are saved on failure in `client/cypress/screenshots` and `client/cypress/videos`

##  Live URL
- The application is deployed and can be accessed [here](https://giu-nexus.up.railway.app/). 
- Back and front end are deployed together on Railway, with the backend serving the frontend assets in production.
- We deployed frontend on Railway because we ran out of Netlify credits </3

##  Contributors
| Member Number | Name                                                                                                  | ID       | Tutorial |
|---------------|-------------------------------------------------------------------------------------------------------|----------|----------|
| 1             | [Aly Moataz Elmekawy](https://github.com/AlyMekkawy/GIU-Nexus/commits?author=AlyMekkawy)              | 16004662 | T17      |
| 2             | [Adham Walaa Elewa](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=Adham-Walaa)              | 16007992 | T17      |
| 3             | [Tarek Wael Aboelsaeoud](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=TarekWaelAboelseoud) | 16002769 | T17      |
| 4             | [Youssef Amr Soliman](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=Youssef-Solimann)       | 16005107 | T12      |
| 5             | [Mahmoud Wael](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=Mahmoudwael9)                  | 16001987 | T8       |
| 6             | [David Ramy](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=Davies2712)                      | 16009980 | T12      |
| 7             | [Khaled Ahmed Elmasry](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=KhaledAhmedElmasry)    | 16002932 | T11      |
| 8             | [Khaled Waleed Abbas](https://github.com/AlyMekkawy/GIU-Nexus/commits?author=KhaledAbbas1074)         | 16001074 | T19      |
| 9             | [Samir Waleed](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=SamirSherif16001872)           | 16001872 | T8       |
| 10            | [Sam Shady Bostawros](https://github.com/AlyMekkawy/GIU-Nexus/commits/?author=SamBostawros)           | 16004357 | T12      |
