import swaggerAutogen from 'swagger-autogen';
import { ResponseStatusCode } from '#/utils/code';

export async function generateSwaggerFile() {
  const doc = {
    info: {
      title: 'CTEC API Docs',
      version: '0.1.0',
      description: 'This is a REST API for CTEC',
    },
    servers: [
      {
        url: 'https://admin-api.mc-ctec.org',
        description: 'Production server',
      },
      {
        url: 'http://localhost:8000',
        description: 'Internal server for testing',
      },
    ],
    tags: [],
    components: {
      '@schemas': {
        APIResponse: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              $ref: '#/components/schemas/ResponseStatusCode',
            },
            data: {
              type: 'object',
              nullable: true,
            },
          },
        },
        ResponseStatusCode: {
          type: 'number',
          description: 'Response status code',
          enum: Object.values(ResponseStatusCode)
            .filter((value) => typeof value !== 'number')
            .map((value: unknown) => {
              return `${value} (${ResponseStatusCode[value as ResponseStatusCode]})`;
            }),
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            showName: { type: 'string' },
            avatar: { type: 'buffer' },
            mcUUID: { type: 'string' },
            googleEmail: { type: 'string' },
            verifiedEmail: { type: 'boolean' },
          },
        },
      },
    },
  };

  const outputFile = 'swagger-output.json';
  const endpointsFiles = ['src/router/index.ts'];

  await swaggerAutogen({ openapi: '3.0.3' })(outputFile, endpointsFiles, doc);

  console.log('Swagger output generated successfully!');
}

generateSwaggerFile();
