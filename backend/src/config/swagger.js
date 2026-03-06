import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MedNote AI API',
            version: '1.0.0',
            description:
                'REST API for MedNote AI — an AI-powered medical note generation platform for clinicians. ' +
                'All protected endpoints require a Bearer JWT token obtained from POST /api/auth/login.',
        },
        servers: [
            {
                url: `http://localhost:${env.port}`,
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                SuccessEnvelope: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
                ErrorEnvelope: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        error_code: { type: 'string', example: 'VALIDATION_ERROR' },
                        errors: {
                            type: 'array',
                            items: { type: 'object' },
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                requestId: { type: 'string' },
                            },
                        },
                    },
                },
                // Auth
                RegisterInput: {
                    type: 'object',
                    required: ['name', 'email', 'password', 'clinicName'],
                    properties: {
                        name: { type: 'string', minLength: 2, example: 'Dr. Jane Doe' },
                        email: { type: 'string', format: 'email', example: 'jane@clinic.com' },
                        password: { type: 'string', minLength: 8, example: 'Str0ng!Pass' },
                        clinicName: { type: 'string', minLength: 2, example: 'Sunrise Medical Center' },
                    },
                },
                LoginInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'jane@clinic.com' },
                        password: { type: 'string', example: 'Str0ng!Pass' },
                    },
                },
                AuthData: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string', description: 'JWT access token (1 hour expiry)' },
                        refreshToken: { type: 'string', description: 'Refresh token (7 day expiry)' },
                        expiresIn: { type: 'integer', description: 'Access token expiration in seconds', example: 3600 },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                clinicName: { type: 'string' },
                                role: { type: 'string', enum: ['ADMIN', 'DOCTOR', 'STAFF'] },
                            },
                        },
                    },
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        clinicName: { type: 'string' },
                        role: { type: 'string', enum: ['ADMIN', 'DOCTOR', 'STAFF'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                // Patient
                CreatePatientInput: {
                    type: 'object',
                    required: ['fullName', 'age', 'gender', 'phone'],
                    properties: {
                        fullName: { type: 'string', minLength: 2, example: 'John Smith' },
                        age: { type: 'integer', minimum: 0, maximum: 130, example: 45 },
                        gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
                        phone: { type: 'string', minLength: 5, example: '+1-555-0100' },
                    },
                },
                Patient: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        fullName: { type: 'string' },
                        age: { type: 'integer' },
                        gender: { type: 'string', enum: ['male', 'female', 'other'] },
                        phone: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                PaginatedPatients: {
                    type: 'object',
                    properties: {
                        items: { type: 'array', items: { $ref: '#/components/schemas/Patient' } },
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                    },
                },
                // Note
                GenerateNoteInput: {
                    type: 'object',
                    required: ['patientId', 'rawInputText'],
                    properties: {
                        patientId: { type: 'string', format: 'uuid', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
                        rawInputText: {
                            type: 'string',
                            minLength: 10,
                            example: 'Patient presents with 3-day history of sore throat, fever 38.5°C, no cough.',
                        },
                    },
                },
                Note: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        patientId: { type: 'string', format: 'uuid' },
                        rawInputText: { type: 'string' },
                        structuredOutput: { type: 'object', description: 'AI-generated structured clinical note' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                PaginatedNotes: {
                    type: 'object',
                    properties: {
                        items: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Health', description: 'Server health check' },
            { name: 'Auth', description: 'Authentication — register & login' },
            { name: 'Patients', description: 'Patient management (protected)' },
            { name: 'Notes', description: 'AI note generation & retrieval (protected)' },
        ],
    },
    apis: [
        './src/routes/*.js',
        './src/app.js',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
