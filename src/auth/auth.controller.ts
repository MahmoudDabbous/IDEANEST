import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Request,
} from '@nestjs/common';
import { SignupDto, SigninDto, RefreshTokenDto } from '../dto/auth.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data'
    })
    @ApiResponse({
        status: 409,
        description: 'Email already exists'
    })
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in'
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials'
    })
    async signin(@Body() signinDto: SigninDto) {
        return this.authService.signin(signinDto);
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: 200,
        description: 'Token successfully refreshed'
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid refresh token'
    })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refresh_token);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.id);
    }

    @Post('revoke-refresh-token')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Revoke refresh token' })
    @ApiResponse({
        status: 200,
        description: 'Refresh token revoked successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized or invalid token'
    })
    async revokeRefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.revokeRefreshToken(refreshTokenDto.refresh_token);
    }
}