import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
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
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("orders")
  getOrders(@Query("email") email?: string): Promise<DashboardPayload> {
    return this.dashboardService.getDashboard(email);
  }

  @Post("orders")
  createOrder(
    @Body()
    body: {
      addOns?: Array<{ id?: string; quantity?: number }>;
      address?: string;
      email?: string;
      frequencyId?: string;
      pricingId?: string;
      providerId?: string;
      startsAt?: string;
    }
  ): Promise<DashboardOrder> {
    return this.dashboardService.createOrder(body);
  }

  @Get("orders/:id")
  async getOrder(@Param("id") id: string, @Query("email") email?: string): Promise<DashboardOrder> {
    const order = await this.dashboardService.getOrder(id, email);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  @Patch("orders/:id/cancel")
  async cancelOrder(@Param("id") id: string, @Query("email") email?: string): Promise<DashboardOrder> {
    const order = await this.dashboardService.cancelOrder(id, email);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return order;
  }

  @Patch("orders/:id/reschedule")
  async rescheduleOrder(
    @Param("id") id: string,
    @Query("email") email: string | undefined,
    @Body() body: { endsAt?: string; startsAt?: string }
  ): Promise<DashboardOrder> {
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;

    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException("Valid startsAt and endsAt values are required.");
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException("endsAt must be later than startsAt.");
    }

    const order = await this.dashboardService.rescheduleOrder(id, email, startsAt, endsAt);

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
