const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "GIU-Nexus API",
            version: "1.0.0",
            description: "API documentation for GIU-Nexus, a job board platform with AI-powered features. Team Aly Elmekawy 🤙🤙",
        },
        servers: [
            {
                url: `https://giu-nexus.up.railway.app`,
                description: "Backend server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./routes/*.js", "./server.js"], // Path to the API route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;