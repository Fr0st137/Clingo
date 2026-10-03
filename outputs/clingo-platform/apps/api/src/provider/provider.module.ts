import { ProviderJobEntity } from "./provider-jobs.entity";
import { ProviderJobsService } from "./provider-jobs.service";
import { ProviderJobsController } from "./provider-jobs.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { ProviderController } from "./provider.controller";
import { ProviderService } from "./provider.service";
import { ProviderSettingsService } from "./provider-settings.service";
import { ProviderSettingsController } from "./provider-settings.controller";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderClientsService } from "./provider-clients.service";
import { ProviderClientsController } from "./provider-clients.controller";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { ProviderOffersService } from "./provider-offers.service";
import { ProviderOffersController } from "./provider-offers.controller";
import { ProviderReviewEntity } from "./provider-reviews.entity";
import { ProviderReviewsService } from "./provider-reviews.service";
import { ProviderReviewsController } from "./provider-reviews.controller";
import { ProviderMultiOrderEntity } from "./provider-multi-orders.entity";
import { ProviderMultiOrdersService } from "./provider-multi-orders.service";
import { ProviderMultiOrdersController } from "./provider-multi-orders.controller";

@Module({ imports: [AuthModule, TypeOrmModule.forFeature([ProviderAccountEntity, ProviderMembershipEntity, ProviderEmployeeEntity, ProviderClientEntity, ProviderOfferEntity, ProviderJobEntity, ProviderReviewEntity, ProviderMultiOrderEntity])], controllers: [ProviderController, ProviderSettingsController, ProviderClientsController, ProviderOffersController, ProviderJobsController, ProviderReviewsController, ProviderMultiOrdersController], providers: [ProviderService, ProviderSettingsService, ProviderClientsService, ProviderOffersService, ProviderJobsService, ProviderReviewsService, ProviderMultiOrdersService] })
export class ProviderModule {}

