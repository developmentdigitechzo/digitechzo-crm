import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: 'req_1234567890' })
  requestId?: string;

  @ApiProperty({ example: '2026-10-07T10:00:00.000Z' })
  timestamp: string;

  constructor(data: T, requestId?: string) {
    this.success = true;
    this.data = data;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }
}
