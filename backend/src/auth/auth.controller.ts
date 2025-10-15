import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) return { error: 'Invalid credentials' };
    return this.authService.login(user);
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    const created = await this.authService.register(
      body.email,
      body.password,
      body.name,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = created as any;
    return rest;
  }
}
