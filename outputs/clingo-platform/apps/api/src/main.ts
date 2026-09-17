import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const { json } = require("express");
  app.use("/dashboard/reviews", json({ limit: "9mb" }));
  app.use(json({ limit: "16kb" }));
  app.use((_request: unknown, response: { setHeader: (key: string, value: string) => void }, next: () => void) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  const webOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map(origin => origin.trim()).filter(Boolean);
  // The local launcher can put the preview beside an existing development tab.
  // Deployed environments continue to use only their explicitly configured origins.
  if (process.env.NODE_ENV !== "production" && webOrigins.includes("http://localhost:3000")) {
    webOrigins.push("http://localhost:3001", "http://localhost:3002");
  }
  app.enableCors({
    origin: webOrigins,
    credentials: true
  });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
