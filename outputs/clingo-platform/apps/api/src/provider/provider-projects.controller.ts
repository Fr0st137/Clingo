import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ProviderProjectsService } from "./provider-projects.service";
@Controller("provider/projects")
export class ProviderProjectsController {
  constructor(private readonly projects:ProviderProjectsService) {}
  @Get() list(@Headers("authorization")auth?:string){return this.projects.list(auth);}
  @Get(":source/:id") get(@Headers("authorization")auth:string|undefined,@Param("source")source:string,@Param("id",new ParseUUIDPipe())id:string){return this.projects.get(auth,source,id);}
  @Put(":source/:id") save(@Headers("authorization")auth:string|undefined,@Param("source")source:string,@Param("id",new ParseUUIDPipe())id:string,@Body()body:unknown){return this.projects.save(auth,source,id,body);}
  @Post(":source/:id/availability") availability(@Headers("authorization")auth:string|undefined,@Param("source")source:string,@Param("id",new ParseUUIDPipe())id:string,@Body()body:unknown){return this.projects.availability(auth,source,id,body);}
  @Post(":source/:id/complete") complete(@Headers("authorization")auth:string|undefined,@Param("source")source:string,@Param("id",new ParseUUIDPipe())id:string,@Body()body:unknown){return this.projects.complete(auth,source,id,body);}
}
