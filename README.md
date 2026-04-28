# GIU Nexus

GIU Nexus is a full-stack job and internship platform designed for university students and recruiters. It integrates AI to automate skill extraction, job classification, and recommendation workflows, reducing manual effort on both sides.

## What It Does

- Create and manage student profiles  
- Automatically extract skills from profile text using AI  
- Post and manage job/internship listings  
- Automatically classify job postings  
- Recommend relevant jobs to students based on their profiles  
- Allow students to browse and apply to opportunities  
- Help recruiters discover suitable candidates faster  

## Stack
- **MERN** stack (MongoDB, Express, React, Node.js)
- Mongoose for database modeling

### Backend

- (Node.js / Express)  
- Database integration (MongoDB)  
- Hugging Face Inference API for AI features  

### Frontend

- React   

## Repository Layout

```text
.
├── config/       # Database and app configuration
├── controllers/  # Request handlers and business logic
├── middleware/   # Auth, validation, and error handling
├── models/       # Mongoose models and schemas
├── routes/       # API route definitions and versioning
├── schema/       # Validation schemas and shared types
├── services/     # External services (AI, email, etc.)
├── server.js     # App entry point
├── package.json  # Project metadata and scripts
└── package-lock.json
```

## .env

Example (replace values with your own):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/giu-nexus
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
HF_API_TOKEN=replace_with_your_huggingface_token
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=replace_with_smtp_username
EMAIL_PASS=replace_with_smtp_password
EMAIL_FROM="GIU Nexus <noreply@example.com>"
```

- `PORT`: Port for the Express server.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret used to sign JWTs.
- `JWT_EXPIRES_IN`: JWT lifetime (e.g., `7d`, `1h`).
- `HF_API_TOKEN`: Hugging Face Inference API token.
- `EMAIL_HOST`: SMTP host for sending emails.
- `EMAIL_PORT`: SMTP port (often `587` or `465`).
- `EMAIL_USER`: SMTP username.
- `EMAIL_PASS`: SMTP password or app password.
- `EMAIL_FROM`: Default sender address.

## Team Members

| Member Number | Name                   | ID       | Tutorial |
|---------------|------------------------|----------|----------|
| 1             | Aly Moataz Elmekawy    | 16004662 | T17      |
| 2             | Adham Walaa Elewa      | 16007992 | T17      |
| 3             | Tarek Wael Aboelsaeoud | 16002769 | T17      |
| 4             | Youssef Amr Soliman    | 16005107 | T12      |
| 5             | Mahmoud Wael           | 16001987 | T8       |
| 6             | David Ramy             | 16009980 | T12      |
| 7             | Khaled Ahmed Elmasry   | 16002932 | T11      |
| 8             | Khaled Waleed Abbas    | 16001074 | T19      |
| 9             | Samir Waleed           | 16001872 | T8       |
| 10            | Sam Shady Bostawros    | 16004357 | T12      |
