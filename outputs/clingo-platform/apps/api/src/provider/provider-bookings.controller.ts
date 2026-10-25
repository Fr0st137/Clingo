import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderBookingsService } from "./provider-bookings.service";
@Controller("provider/bookings")
export class ProviderBookingsController {
  constructor(private readonly bookings: ProviderBookingsService) {}
  @Get("profiles") profiles(@Headers("authorization") auth?: string) { return this.bookings.profiles(auth); }
  @Get(":id") get(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string) { return this.bookings.get(auth, id); }
  @Put(":id") update(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.bookings.update(auth, id, body); }
  @Post(":id/reschedule-availability") availability(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.bookings.rescheduleAvailability(auth, id, body); }
  @Put(":id/reschedule") reschedule(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.bookings.reschedule(auth, id, body); }
}
