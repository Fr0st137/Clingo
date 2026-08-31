import { BadRequestException, Body, Controller, Get, Headers, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
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
  constructor(private readonly dashboardService: DashboardService, private readonly booking: BookingService, private readonly auth: AuthService) {}

  @Post("booking/quote")
  quote(@Body() body: BookingSelection) { return this.booking.quote(body); }

  @Post("booking/availability")
  availability(@Body() body: BookingSelection & { month?: string }) { return this.booking.availability(body, body.month); }

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

  @Patch("orders/:id/reschedule")
  async rescheduleOrder(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { endsAt?: string; startsAt?: string }
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
    await this.booking.reschedule(id, email, startsAt, endsAt);
    await this.dashboardService.clearDashboardCache(email);
    const order = await this.dashboardService.getOrder(id, email);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  @Get("favorites")
  getFavorites(): Promise<FavoriteProvider[]> {
    return this.dashboardService.getFavorites();
  }

  @Get("chat")
  getChat(): Promise<{ contacts: ChatContact[]; messages: ChatMessage[] }> {
    return this.dashboardService.getChat();
  }

  @Get("reviews/opinions")
  getOpinions(): Promise<OpinionsPayload> {
    return this.dashboardService.getOpinions();
  }

  @Patch("reviews/opinions/:id")
  async saveOpinion(
    @Param("id") id: string,
    @Body() body: { content?: string; images?: Array<{ id: string; label: string }>; rating?: number }
  ): Promise<PanelReview> {
    const review = await this.dashboardService.saveOpinion(id, body);

    if (!review) {
      throw new NotFoundException("Review not found.");
    }

    return review;
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
  getSettings(): Promise<SettingsPayload> {
    return this.dashboardService.getSettings();
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
