import { Body, Controller, Get, Headers, Post, Put } from "@nestjs/common";
import { ProviderSettingsService } from "./provider-settings.service";

@Controller("provider/settings")
export class ProviderSettingsController {
  constructor(private readonly settings: ProviderSettingsService) {}
  @Get("profile") getProfile(@Headers("authorization") auth?: string) { return this.settings.getProfile(auth); }
  @Put("profile") saveProfile(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.settings.saveProfile(auth, body); }
  @Get("notifications") getNotifications(@Headers("authorization") auth?: string) { return this.settings.getNotifications(auth); }
  @Put("notifications") saveNotifications(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.settings.saveNotifications(auth, body); }
  @Post("password") password(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.settings.password(auth, body); }
  @Get("export") export(@Headers("authorization") auth?: string) { return this.settings.export(auth); }
  @Get("location") getLocation(@Headers("authorization") auth?: string) { return this.settings.getLocation(auth); }
  @Put("location") saveLocation(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.settings.saveLocation(auth, body); }
}
