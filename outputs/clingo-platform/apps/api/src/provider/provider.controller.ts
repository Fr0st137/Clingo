import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderService } from "./provider.service";

@Controller("provider")
export class ProviderController {
  constructor(private readonly provider: ProviderService) {}
  @Get("me") context(@Headers("authorization") auth?: string) { return this.provider.context(auth); }
  @Post("account") createAccount(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.provider.createAccount(auth, body); }
  @Get("employees") list(@Headers("authorization") auth?: string) { return this.provider.list(auth); }
  @Post("employees") create(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.provider.create(auth, body); }
  @Get("employees/:id") get(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string) { return this.provider.get(auth, id); }
  @Put("employees/:id") update(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.provider.update(auth, id, body); }
  @Delete("employees/:id") remove(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.provider.remove(auth, id, body); }
}
