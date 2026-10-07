import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LeadPriorityEnum,
  LeadTemperatureEnum,
} from './create-lead.dto';

export class UpdatePriorityTemperatureDto {
  @ApiPropertyOptional({
    enum: LeadPriorityEnum,
    description: 'Commercial SLA priority (LOW, MEDIUM, HIGH, URGENT)',
    example: LeadPriorityEnum.HIGH,
  })
  @IsOptional()
  @IsEnum(LeadPriorityEnum, {
    message: 'priority must be one of: LOW, MEDIUM, HIGH, URGENT',
  })
  priority?: LeadPriorityEnum;

  @ApiPropertyOptional({
    enum: LeadTemperatureEnum,
    description: 'Commercial temperature (HOT, WARM, COLD)',
    example: LeadTemperatureEnum.HOT,
  })
  @IsOptional()
  @IsEnum(LeadTemperatureEnum, {
    message: 'temperature must be one of: HOT, WARM, COLD',
  })
  temperature?: LeadTemperatureEnum;
}
