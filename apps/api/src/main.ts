import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 4000;
  const prefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('app.corsOrigin') || 'http://localhost:5173';

  // Global API Prefix
  app.setGlobalPrefix(prefix);

  // Global Validation Pipe with strict validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DigiTechzo CRM API')
    .setDescription(
      'Enterprise modular monolith REST API documentation for DigiTechzo CRM. Step B1: Backend Foundation + Database + Authentication.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Bearer token in the format: <JWT_TOKEN>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System uptime and connectivity checks')
    .addTag('Auth', 'Authentication, token rotation, and session management')
    .addTag('Users', 'User identity and access profile')
    .addTag('Leads', 'Lead generation, qualification, assignment, and lifecycle')
    .addTag('Deals', 'Pipeline management, deal stages, and win/loss governance')
    .addTag('Tasks', 'Task scheduling, follow-ups, and action engine')
    .addTag('Activities', 'Activity timeline, communication history, and interaction logging')
    .addTag('Meetings', 'Meeting and demo scheduling, outcomes, and calendar tracking')
    .addTag('Proposals', 'Quotation lifecycle, proposal amounts, and client acceptance')
    .addTag('Customers', 'Converted customer accounts and account management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'DigiTechzo CRM API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(` DigiTechzo CRM API listening on: http://localhost:${port}/${prefix}`);
  logger.log(` Swagger OpenAPI Documentation:    http://localhost:${port}/api/docs`);
  logger.log(` Environment:                     ${configService.get('app.nodeEnv')}`);
  logger.log(`=======================================================`);
}

bootstrap();
