# GIU Nexus

GIU Nexus is a backend-driven job and internship platform built for university students, recruiters, and admins. It provides authentication, profile management, job posting, applications, and AI-assisted workflows (such as skill extraction and job text analysis).

## Features

- User registration and login with JWT authentication
- Student profile creation and updates
- Job/internship posting and management
- Job applications workflow
- Admin-specific endpoints
- AI-powered extraction/classification helpers via Hugging Face
- File upload support (Cloudinary)
- Rate limiting and centralized error handling
- Swagger API documentation endpoint
- Integration test coverage for core flows

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB + Mongoose
- **Auth:** JSON Web Tokens (JWT)
- **AI Integrations:** Hugging Face Inference API
- **File Hosting:** Cloudinary
- **Email:** Nodemailer
- **Testing:** Jest + Supertest + mongodb-memory-server

## Project Structure

```text
.
├── app.js
├── server.js
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── tests/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## .env

Example (replace values with your own):

```env
PORT = 5004
HOST= 0.0.0.0
MONGO_URI = replace_with_your_mongodb_connection_string_or_docker_service_name

JWT_SECRET = xxxxxx
JWT_EXPIRE = 7d

HF_TOKEN = hf_xxxxxxxxxxxxxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=xxxxxxx@gmail.com
EMAIL_PASS=xxxxxxxxxxxxxxxx

CLOUDINARY_CLOUD_NAME=xxxxxxxxxx
CLOUDINARY_API_KEY=xxxxxxxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxx
```

- `PORT`: Port for the Express server.
- `HOST`: Host for the Express server
- `MONGO_URI`: MongoDB connection string or docker service name.
- `JWT_SECRET`: Secret used to sign JWTs.
- `JWT_EXPIRES_IN`: JWT lifetime (e.g., `7d`, `1h`).
- `HF_TOKEN`: Hugging Face Inference API token.
- `EMAIL_HOST`: SMTP host for sending emails.
- `EMAIL_PORT`: SMTP port (often `587` or `465`).
- `EMAIL_USER`: SMTP username.
- `EMAIL_PASS`: SMTP password or app password.
- `EMAIL_FROM`: Default sender address.
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Your Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret.

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
