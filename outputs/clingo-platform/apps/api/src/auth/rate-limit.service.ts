import { HttpException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import { LessThan, Repository } from "typeorm";
import { AuthRateLimitEntity } from "./auth-rate-limit.entity";

@Injectable()
export class RateLimitService {
  private lastCleanup = 0;
  constructor(@InjectRepository(AuthRateLimitEntity) private readonly limits: Repository<AuthRateLimitEntity>) {}

  async consume(scope: string, identifier: string, maximum: number, seconds = 900) {
    if (Date.now() - this.lastCleanup > 3600000) {
      this.lastCleanup = Date.now();
      await this.limits.delete({ resetsAt: LessThan(new Date(Date.now() - 86400000)) });
    }
    const key = createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
    // Shared across API processes and restarts; increment atomically before expensive work.
    const [row] = await this.limits.query(`INSERT INTO auth_rate_limits (key, count, "resetsAt")
      VALUES ($1, 1, NOW() + $2 * INTERVAL '1 second') ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN auth_rate_limits."resetsAt" <= NOW() THEN 1 ELSE LEAST(auth_rate_limits.count + 1, $3 + 1) END,
      "resetsAt" = CASE WHEN auth_rate_limits."resetsAt" <= NOW() THEN NOW() + $2 * INTERVAL '1 second' ELSE auth_rate_limits."resetsAt" END
      RETURNING count`, [key, seconds, maximum]);
    if (row.count > maximum) throw new HttpException("Zbyt wiele prób. Spróbuj ponownie za 15 minut.", 429);
  }
}
