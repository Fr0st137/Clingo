import { Body, Controller, Get, Header, Headers, Param, ParseUUIDPipe, Put, StreamableFile } from "@nestjs/common";
import { ProviderReviewsService } from "./provider-reviews.service";

@Controller("provider/reviews")
export class ProviderReviewsController {
  constructor(private readonly reviews: ProviderReviewsService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.reviews.list(auth); }
  @Get("summary") summary(@Headers("authorization") auth?: string) { return this.reviews.summary(auth); }
  @Get(":id/images/:imageId")
  @Header("Cache-Control","private, no-store")
  @Header("X-Content-Type-Options","nosniff")
  async image(@Headers("authorization")auth:string|undefined,@Param("id",new ParseUUIDPipe())id:string,@Param("imageId",new ParseUUIDPipe())imageId:string){return new StreamableFile(await this.reviews.image(auth,id,imageId),{type:"image/webp"});}
  @Put(":id/report") report(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.reviews.report(auth, id, body); }
}
