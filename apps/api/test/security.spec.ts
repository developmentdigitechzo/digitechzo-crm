// @ts-nocheck
import { RequestIdInterceptor } from '../src/common/interceptors/request-id.interceptor';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { of } from 'rxjs';
import * as crypto from 'crypto';

describe('Security & Infrastructure Interceptors', () => {
  describe('RequestIdInterceptor', () => {
    let interceptor: RequestIdInterceptor;

    beforeEach(() => {
      interceptor = new RequestIdInterceptor();
    });

    it('should generate a new X-Request-ID if none is provided in headers', (done) => {
      const mockReq: any = { headers: {} };
      const setHeaderMock = jest.fn();
      const mockRes: any = { setHeader: setHeaderMock };

      const context: any = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };

      const next: any = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(mockReq.requestId).toBeDefined();
          expect(mockReq.requestId.startsWith('req_')).toBe(true);
          expect(setHeaderMock).toHaveBeenCalledWith('X-Request-ID', mockReq.requestId);
          done();
        },
      });
    });

    it('should respect incoming X-Request-ID header', (done) => {
      const mockReq: any = { headers: { 'x-request-id': 'client-custom-id-999' } };
      const setHeaderMock = jest.fn();
      const mockRes: any = { setHeader: setHeaderMock };

      const context: any = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };

      const next: any = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(context, next).subscribe({
        next: () => {
          expect(mockReq.requestId).toBe('client-custom-id-999');
          expect(setHeaderMock).toHaveBeenCalledWith('X-Request-ID', 'client-custom-id-999');
          done();
        },
      });
    });
  });

  describe('TransformResponseInterceptor', () => {
    let interceptor: TransformResponseInterceptor<any>;

    beforeEach(() => {
      interceptor = new TransformResponseInterceptor();
    });

    it('should wrap plain response objects into standardized envelope', (done) => {
      const mockReq: any = { requestId: 'req_test_123' };
      const context: any = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      };

      const payload = { userId: '123', status: 'ACTIVE' };
      const next: any = {
        handle: () => of(payload),
      };

      interceptor.intercept(context, next).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data).toEqual(payload);
          expect(response.requestId).toBe('req_test_123');
          expect(response.timestamp).toBeDefined();
          done();
        },
      });
    });
  });

  describe('Cryptographic Token Hashing Safeguards', () => {
    it('should hash refresh token with SHA-256 producing exact 64-character hex digest', () => {
      const rawToken = crypto.randomBytes(48).toString('hex');
      expect(rawToken.length).toBe(96);

      const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(hash.length).toBe(64);
      expect(hash).not.toEqual(rawToken);
    });
  });
});

