import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderJobsService } from "./provider-jobs.service";
@Controller("provider/jobs")
export class ProviderJobsController {
  constructor(private readonly jobs: ProviderJobsService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.jobs.list(auth); }
  @Get(":id") get(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string) { return this.jobs.get(auth, id); }
  @Post() create(@Headers("authorization") auth: string | undefined, @Body() body: unknown) { return this.jobs.save(auth, body); }
  @Put(":id") update(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.jobs.save(auth, body, id); }
}
