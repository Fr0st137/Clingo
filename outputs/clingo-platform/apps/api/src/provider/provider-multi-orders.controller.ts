import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderMultiOrdersService } from "./provider-multi-orders.service";

@Controller("provider/multi-orders")
export class ProviderMultiOrdersController {
  constructor(private readonly orders: ProviderMultiOrdersService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.orders.list(auth); }
  @Post() create(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.orders.create(auth, body); }
  @Post("availability") availability(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.orders.availability(auth, body); }
  @Put(":id/action") action(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.orders.action(auth, id, body); }
}
