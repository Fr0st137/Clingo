import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put, StreamableFile } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { RateLimitService } from "../auth/rate-limit.service";
import { AuthService } from "../auth/auth.service";
import { BookingService } from "./booking.service";
import { BookingInput, BookingSelection, warsawDate } from "./booking";
import { DashboardService } from "./dashboard.service";
import {
  ChatContact,
  ChatMessage,
  BoardPayload,
  DashboardOrder,
  DashboardPayload,
  FavoriteProvider,
  OpinionsPayload,
  PanelReview,
  ProviderProfile,
  SettingsPayload
} from "./dashboard.types";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService, private readonly booking: BookingService, private readonly auth: AuthService, private readonly customer: CustomerService, private readonly limits: RateLimitService) {}

  @Post("booking/quote")
  quote(@Body() body: BookingSelection) { return this.booking.quote(body); }

  @Post("booking/availability")
  availability(@Body() body: BookingSelection & { month?: string }) { return this.booking.availability(body, body.month); }

  @Post("booking/multi-availability")
  multiAvailability(@Body() body: BookingSelection & { month?: string; durationMinutes?: number; availability?: import("./booking").CustomerAvailability }) {
    return this.booking.multiAvailability(body, body.month);
  }

  @Post("booking/multi-schedule")
  multiSchedule(@Body() body: import("./booking").MultiScheduleInput) { return this.booking.multiSchedule(body); }

  @Get("orders")
  async getOrders(@Headers("authorization") authorization?: string): Promise<DashboardPayload> {
    return this.dashboardService.getDashboard(await this.auth.sessionEmail(authorization));
  }

  @Post("orders")
  async createOrder(@Body() body: BookingInput, @Headers("authorization") authorization?: string): Promise<DashboardOrder> {
    const email = await this.auth.sessionEmail(authorization);
    const id = await this.booking.create(body, email);
    await this.dashboardService.clearDashboardCache(email);
    return (await this.dashboardService.getOrder(id, email))!;
  }

  @Get("orders/:id")
  async getOrder(@Param("id", new ParseUUIDPipe()) id: string, @Headers("authorization") authorization?: string): Promise<DashboardOrder> {
    const email = await this.auth.sessionEmail(authorization);
    const order = await this.dashboardService.getOrder(id, email);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  @Patch("orders/:id/cancel")
  async cancelOrder(@Param("id", new ParseUUIDPipe()) id: string, @Headers("authorization") authorization?: string): Promise<DashboardOrder> {
    const email = await this.auth.sessionEmail(authorization);
    const order = await this.dashboardService.cancelOrder(id, email);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  @Post("orders/:id/reschedule-availability")
  async rescheduleAvailability(@Param("id", new ParseUUIDPipe()) id: string, @Headers("authorization") authorization: string | undefined, @Body() body: { month?: string; sessionIndex?: number }) {
    const email = await this.auth.sessionEmail(authorization);
    return this.booking.rescheduleAvailability(id, email, typeof body.month === "string" ? body.month : "", body.sessionIndex);
  }

  @Patch("orders/:id/reschedule")
  async rescheduleOrder(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { endsAt?: string; startsAt?: string; sessionIndex?: number }
  ): Promise<DashboardOrder> {
    const parseTerm = (value?: string) => value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
      ? warsawDate(value.slice(0, 10), value.slice(11)) : value ? new Date(value) : null;
    const startsAt = parseTerm(body.startsAt);
    const endsAt = parseTerm(body.endsAt);

    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException("Valid startsAt and endsAt values are required.");
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException("endsAt must be later than startsAt.");
    }

    const email = await this.auth.sessionEmail(authorization);
    await this.booking.reschedule(id, email, startsAt, endsAt, body.sessionIndex);
    await this.dashboardService.clearDashboardCache(email);
    const order = await this.dashboardService.getOrder(id, email);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  @Get("favorites")
  async getFavorites(@Headers("authorization") authorization?: string) {
    return this.customer.getFavorites(await this.auth.sessionUser(authorization));
  }

  @Put("favorites/:id")
  async addFavorite(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    return this.customer.setFavorite(await this.auth.sessionUser(authorization), id, true);
  }
  @Delete("favorites/:id")
  async removeFavorite(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    return this.customer.setFavorite(await this.auth.sessionUser(authorization), id, false);
  }

  @Get("chat")
  getChat(): Promise<{ contacts: ChatContact[]; messages: ChatMessage[] }> {
    return this.dashboardService.getChat();
  }

  @Get("reviews/opinions")
  async getOpinions(@Headers("authorization") authorization?: string) {
    return this.customer.getOpinions(await this.auth.sessionUser(authorization));
  }

  @Patch("reviews/opinions/:id")
  // Keep the old URL authenticated too; legacy demo review IDs cannot be edited.
  async saveOpinion(
    @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown,
    @Headers("authorization") authorization?: string
  ) {
    return this.saveReview(id, body, authorization);
  }

  @Put("reviews/:id")
  async saveReview(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown, @Headers("authorization") authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    await this.limits.consume("review-save", user.id, 30);
    return this.customer.saveReview(user, id, body);
  }
  @Delete("reviews/:id")
  async deleteReview(@Param("id", new ParseUUIDPipe()) id: string, @Headers("authorization") authorization?: string) {
    return this.customer.deleteReview(await this.auth.sessionUser(authorization), id);
  }
  @Get("review-images/:id")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cache-Control", "no-store")
  async reviewImage(@Param("id", new ParseUUIDPipe()) id: string) {
    return new StreamableFile(await this.customer.reviewImage(id), { type: "image/webp" });
  }

  @Get("reviews/standards")
  getStandards(): Promise<PanelReview[]> {
    return this.dashboardService.getReviews("standards");
  }

  @Get("reviews/regulations")
  getRegulations(): Promise<PanelReview[]> {
    return this.dashboardService.getReviews("regulations");
  }

  @Get("settings")
  getSettings(@Headers("authorization") authorization?: string) {
    return this.auth.getSettings(authorization);
  }

  @Get("board")
  getBoard(): Promise<BoardPayload> {
    return this.dashboardService.getBoard();
  }

  @Get("provider-profiles/:id")
  async getProviderProfile(@Param("id") id: string): Promise<ProviderProfile> {
    const profile = await this.dashboardService.getProviderProfile(id);

    if (!profile) {
      throw new NotFoundException("Provider profile not found.");
    }

    return profile;
  }
}
