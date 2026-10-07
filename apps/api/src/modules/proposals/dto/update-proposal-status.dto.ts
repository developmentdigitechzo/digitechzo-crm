import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalStatusEnum } from './create-proposal.dto';

export class UpdateProposalStatusDto {
  @ApiProperty({
    enum: ProposalStatusEnum,
    description: 'Target lifecycle status for proposal',
    example: ProposalStatusEnum.SENT,
  })
  @IsEnum(ProposalStatusEnum)
  @IsNotEmpty()
  status: ProposalStatusEnum;

  @ApiPropertyOptional({ description: 'Reason for rejection if status is REJECTED' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Additional transition notes or comments' })
  @IsOptional()
  @IsString()
  notes?: string;
}
