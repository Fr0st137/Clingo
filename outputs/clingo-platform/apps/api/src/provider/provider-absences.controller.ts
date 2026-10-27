import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderAbsencesService } from "./provider-absences.service";

@Controller("provider/absences")
export class ProviderAbsencesController {
  constructor(private readonly absences: ProviderAbsencesService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.absences.list(auth); }
  @Post() create(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.absences.create(auth, body); }
  @Put(":id") update(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.absences.cancel(auth, id, body); }
}
