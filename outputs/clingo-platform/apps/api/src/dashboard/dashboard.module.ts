import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BoardFilterEntity } from "./board-filter.entity";
import { BoardListingEntity } from "./board-listing.entity";
import { BoardSearchFieldEntity } from "./board-search-field.entity";
import { ChatContactEntity } from "./chat-contact.entity";
import { ChatMessageEntity } from "./chat-message.entity";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { ExternalConnectionEntity } from "./external-connection.entity";
import { FavoriteProviderEntity } from "./favorite-provider.entity";
import { NotificationSettingEntity } from "./notification-setting.entity";
import { OrderEntity } from "./order.entity";
import { PanelReviewEntity } from "./panel-review.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";
import { SettingsSectionEntity } from "./settings-section.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardFilterEntity,
      BoardListingEntity,
      BoardSearchFieldEntity,
      ChatContactEntity,
      ChatMessageEntity,
      ExternalConnectionEntity,
      FavoriteProviderEntity,
      NotificationSettingEntity,
      OrderEntity,
      PanelReviewEntity,
      ProviderProfileEntity,
      SettingsSectionEntity
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
