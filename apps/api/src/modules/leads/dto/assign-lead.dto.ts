import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignLeadDto {
  @ApiProperty({
    description: 'Target user UUID to assign the lead to',
    example: 'a0000000-0000-0000-0000-000000000002',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'ownerId must be a valid UUIDv4' })
  ownerId: string;
}
