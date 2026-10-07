import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ResponseFormat<T> {
  success: boolean;
  data: T;
  requestId?: string;
  timestamp: string;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const req = context.switchToHttp().getRequest<Request>();
    const requestId = req.requestId;

    return next.handle().pipe(
      map((data) => {
        // If data is already in standard response structure
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        return {
          success: true,
          data,
          requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
