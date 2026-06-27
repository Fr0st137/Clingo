import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    DashboardModule
  ]
})
export class AppModule {}
