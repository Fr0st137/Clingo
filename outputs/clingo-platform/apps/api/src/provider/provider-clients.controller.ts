import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderClientsService } from "./provider-clients.service";

@Controller("provider/clients")
export class ProviderClientsController {
  constructor(private readonly clients: ProviderClientsService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.clients.list(auth); }
  @Post() create(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.clients.create(auth, body); }
  @Get(":id") get(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string) { return this.clients.get(auth, id); }
  @Put(":id") update(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.clients.update(auth, id, body); }
}
