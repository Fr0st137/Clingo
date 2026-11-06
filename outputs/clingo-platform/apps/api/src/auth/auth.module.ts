import { EmailVerificationService } from "./email-verification.service";
import { EmailService } from "./email.service";
import { EmailVerificationEntity } from "./email-verification.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserEntity } from "./user.entity";
import { AuthSessionEntity } from "./auth-session.entity";
import { AuthRateLimitEntity } from "./auth-rate-limit.entity";
import { RateLimitService } from "./rate-limit.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AuthSessionEntity, AuthRateLimitEntity, EmailVerificationEntity])],
  controllers: [AuthController],
  providers: [AuthService, RateLimitService, EmailService, EmailVerificationService],
  exports: [AuthService, RateLimitService]
})
export class AuthModule {}
