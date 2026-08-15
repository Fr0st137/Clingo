import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";

type LookupEmailBody = {
  email?: string;
};

type RegisterUserBody = {
  companyName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phone?: string;
};

type UpdateProfileBody = {
  apartment?: string;
  city?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  postalCode?: string;
  street?: string;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("lookup")
  lookupEmail(@Body() body: LookupEmailBody) {
    return this.authService.lookupEmail(body.email);
  }

  @Post("register")
  register(@Body() body: RegisterUserBody) {
    return this.authService.register(body);
  }

  @Get("profile")
  getProfile(@Query("email") email?: string) {
    return this.authService.getProfile(email);
  }

  @Patch("profile")
  updateProfile(@Query("email") email: string | undefined, @Body() body: UpdateProfileBody) {
    return this.authService.updateProfile(email, body);
  }
}
