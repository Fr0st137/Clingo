import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Put } from "@nestjs/common";
import { ProviderMultiOrdersService } from "./provider-multi-orders.service";

@Controller("provider/multi-orders")
export class ProviderMultiOrdersController {
  constructor(private readonly orders: ProviderMultiOrdersService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.orders.list(auth); }
  @Put(":id/action") action(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.orders.action(auth, id, body); }
}
