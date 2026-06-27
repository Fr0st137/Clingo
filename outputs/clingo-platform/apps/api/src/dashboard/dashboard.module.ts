import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { OrderEntity } from "./order.entity";

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
