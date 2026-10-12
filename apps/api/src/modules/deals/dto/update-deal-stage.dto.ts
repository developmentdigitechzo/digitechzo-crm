import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDealStageDto {
  @ApiProperty({ description: 'Target pipeline stage UUID', example: 'c0000000-0000-0000-0000-000000000002' })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'stageId must be a valid UUIDv4' })
  stageId: string;
}
