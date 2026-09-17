import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DashboardService } from "./dashboard/dashboard.service";

async function bootstrap() {
  let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>> | null = null;

  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ["error", "warn"]
    });

    const dashboardService = app.get(DashboardService);
    const summaries = await dashboardService.importMissingDashboardData();
    const insertedTotal = summaries.reduce((total, summary) => total + summary.inserted, 0);

    for (const summary of summaries) {
      console.log(`[seed] ${summary.label}: dodano ${summary.inserted} brakujacych rekordow.`);
    }

    console.log(`[seed] Import zakonczony. Razem dodano ${insertedTotal} brakujacych rekordow.`);
  } finally {
    await app?.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Import danych nie powiodl sie.");
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
