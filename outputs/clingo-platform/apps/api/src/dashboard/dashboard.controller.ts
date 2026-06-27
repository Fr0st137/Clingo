import { Controller, Get } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { ChatContact, ChatMessage, DashboardPayload, FavoriteProvider } from "./dashboard.types";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("orders")
  getOrders(): Promise<DashboardPayload> {
    return this.dashboardService.getDashboard();
  }

  @Get("favorites")
  getFavorites(): FavoriteProvider[] {
    return this.dashboardService.getFavorites();
  }

  @Get("chat")
  getChat(): { contacts: ChatContact[]; messages: ChatMessage[] } {
    return this.dashboardService.getChat();
  }
}
