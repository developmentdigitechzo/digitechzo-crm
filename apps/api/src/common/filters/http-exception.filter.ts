import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name;
      } else {
        message = res as string;
        error = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = `Unique constraint violation on target: ${(exception.meta?.target as string[])?.join(', ') || 'field'}`;
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'Requested record not found';
      } else {
        status = HttpStatus.BAD_REQUEST;
        error = 'Database Error';
        message = `Database operation failed: ${exception.code}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const requestId = request.requestId || (request.headers['x-request-id'] as string);

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)} - RequestID: ${requestId}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
