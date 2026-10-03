import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderOffersService } from "./provider-offers.service";

@Controller("provider/services")
export class ProviderOffersController {
  constructor(private readonly offers: ProviderOffersService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.offers.list(auth); }
  @Post() create(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.offers.create(auth, body); }
  @Get(":id") get(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string) { return this.offers.get(auth, id); }
  @Put(":id") update(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.offers.update(auth, id, body); }
}

