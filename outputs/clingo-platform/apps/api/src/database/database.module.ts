import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../auth/user.entity";
import { BoardFilterEntity } from "../dashboard/board-filter.entity";
import { BoardListingEntity } from "../dashboard/board-listing.entity";
import { BoardSearchFieldEntity } from "../dashboard/board-search-field.entity";
import { ChatContactEntity } from "../dashboard/chat-contact.entity";
import { ChatMessageEntity } from "../dashboard/chat-message.entity";
import { ExternalConnectionEntity } from "../dashboard/external-connection.entity";
import { FavoriteProviderEntity } from "../dashboard/favorite-provider.entity";
import { NotificationSettingEntity } from "../dashboard/notification-setting.entity";
import { OrderEntity } from "../dashboard/order.entity";
import { PanelReviewEntity } from "../dashboard/panel-review.entity";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { SettingsSectionEntity } from "../dashboard/settings-section.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("POSTGRES_HOST", "localhost"),
        port: config.get<number>("POSTGRES_PORT", 5432),
        username: config.get<string>("POSTGRES_USER", "clingo"),
        password: config.get<string>("POSTGRES_PASSWORD", "clingo"),
        database: config.get<string>("POSTGRES_DB", "clingo"),
        entities: [
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
          SettingsSectionEntity,
          UserEntity
        ],
        synchronize: config.get<string>("TYPEORM_SYNC", "false") === "true",
        logging: config.get<string>("TYPEORM_LOGGING", "false") === "true"
      })
    })
  ]
})
export class DatabaseModule {}
