import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string | string[];

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;

  @ApiProperty({ example: 'req_1234567890' })
  requestId?: string;

  @ApiProperty({ example: '2026-10-07T10:00:00.000Z' })
  timestamp: string;
}
