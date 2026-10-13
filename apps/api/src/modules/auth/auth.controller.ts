import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto, RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import {
  AuthResponseDto,
  AuthUserDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user with email and password',
    description:
      'Verifies credentials using Argon2id, creates audit log, and issues a 15-minute JWT access token and 7-day cryptographic refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Forbidden: Account suspended or inactive' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    const requestId = req.requestId || (req.headers['x-request-id'] as string);

    return this.authService.login(loginDto, ip, userAgent, requestId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and get new access token',
    description:
      'Implements secure single-use token rotation. If an already revoked token is submitted, all active sessions for the user are immediately revoked (theft detection).',
  })
  @ApiResponse({
    status: 200,
    description: 'Token rotated successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Token invalid, expired, or reuse detected',
  })
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<RefreshResponseDto> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    const requestId = req.requestId || (req.headers['x-request-id'] as string);

    return this.authService.refresh(refreshDto, ip, userAgent, requestId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset verification code',
    description: 'Generates a 6-digit verification code and dispatches it to the registered user email address.',
  })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with verification code',
    description: 'Verifies the 6-digit code and sets a new Argon2id hashed password.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired verification code' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke refresh token and logout',
    description:
      'Marks the refresh token as revoked in database and logs session termination audit event.',
  })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Missing or invalid token' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() logoutDto: LogoutDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    const requestId = req.requestId || (req.headers['x-request-id'] as string);

    return this.authService.logout(
      user.userId,
      logoutDto?.refreshToken,
      ip,
      userAgent,
      requestId,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current authenticated user identity',
    description:
      'Returns the authenticated user entity, tenancy, role, and granted permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user retrieved successfully',
    type: AuthUserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized: Missing or invalid token' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId);
  }
}
