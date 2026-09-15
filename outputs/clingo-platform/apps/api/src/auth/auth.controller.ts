import { Body, Controller, Get, Headers, Patch, Post, Req } from "@nestjs/common";
import { AuthService, objectInput } from "./auth.service";
import { RateLimitService } from "./rate-limit.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly limits: RateLimitService) {}
  @Post("lookup")
  async lookup(@Body() body: unknown, @Req() req: { ip: string }) {
    await this.limits.consume("lookup-ip", req.ip, 120);
    return this.auth.lookupEmail(objectInput(body).email);
  }
  @Post("register")
  async register(@Body() body: unknown, @Req() req: { ip: string }) {
    await this.limits.consume("register-ip", req.ip, 30);
    return this.auth.register(body);
  }
  @Post("login")
  async login(@Body() body: unknown, @Req() req: { ip: string }) {
    await this.limits.consume("login-ip", req.ip, 120);
    return this.auth.login(body);
  }
  @Get("profile")
  getProfile(@Headers("authorization") authorization?: string) { return this.auth.getProfile(authorization); }
  @Patch("profile")
  updateProfile(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) { return this.auth.updateProfile(authorization, body); }
  @Patch("notifications")
  notifications(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) { return this.auth.updateNotifications(authorization, body); }
  @Post("password")
  password(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) { return this.auth.changePassword(authorization, body); }
  @Post("logout")
  logout(@Headers("authorization") authorization?: string) { return this.auth.logout(authorization); }
}
