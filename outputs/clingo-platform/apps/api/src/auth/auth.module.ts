import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserEntity } from "./user.entity";
import { AuthSessionEntity } from "./auth-session.entity";
import { AuthRateLimitEntity } from "./auth-rate-limit.entity";
import { RateLimitService } from "./rate-limit.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AuthSessionEntity, AuthRateLimitEntity])],
  controllers: [AuthController],
  providers: [AuthService, RateLimitService],
  exports: [AuthService, RateLimitService]
})
export class AuthModule {}
