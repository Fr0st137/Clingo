import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Put } from "@nestjs/common";
import { ProviderReviewsService } from "./provider-reviews.service";

@Controller("provider/reviews")
export class ProviderReviewsController {
  constructor(private readonly reviews: ProviderReviewsService) {}
  @Get() list(@Headers("authorization") auth?: string) { return this.reviews.list(auth); }
  @Put(":id/report") report(@Headers("authorization") auth: string | undefined, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.reviews.report(auth, id, body); }
}
