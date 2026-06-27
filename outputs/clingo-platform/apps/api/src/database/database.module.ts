import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderEntity } from "../dashboard/order.entity";

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
        entities: [OrderEntity],
        synchronize: config.get<string>("TYPEORM_SYNC", "false") === "true",
        logging: config.get<string>("TYPEORM_LOGGING", "false") === "true"
      })
    })
  ]
})
export class DatabaseModule {}
