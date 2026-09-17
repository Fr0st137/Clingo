import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new Redis({
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
          lazyConnect: true,
          connectTimeout: 500,
          commandTimeout: 200,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 0
        });
        // Connect in the background: an optional cache must never delay a page.
        redis.on("error", () => {});
        Object.assign(redis, { onModuleDestroy: () => redis.disconnect() });
        void redis.connect().catch(() => {});
        return redis;
      }
    }
  ],
  exports: [REDIS_CLIENT]
})
export class RedisModule {}
