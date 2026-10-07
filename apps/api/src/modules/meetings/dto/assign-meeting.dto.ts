import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMeetingDto {
  @ApiProperty({
    description: 'Target user UUID within the organization to reassign meeting host to',
    example: 'a0000000-0000-0000-0000-000000000002',
  })
  @IsUUID('4')
  @IsNotEmpty()
  ownerId: string;
}
