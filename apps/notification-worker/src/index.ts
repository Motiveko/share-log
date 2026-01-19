import "reflect-metadata";
import { container } from "tsyringe";
import { Config } from "@/config/env";
import { NotificationEventWorker } from "@/worker";
import { DataSource } from "@/datasource";

console.log(Config);

async function bootstrap() {
  // DataSource 초기화 (entity 메타데이터 등록)
  const dataSource = container.resolve(DataSource);
  await dataSource.initialize();

  const worker = container.resolve(NotificationEventWorker);
  worker.start();
}

bootstrap();

process.on("SIGTERM", async () => {
  const worker = container.resolve(NotificationEventWorker);
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  const worker = container.resolve(NotificationEventWorker);
  await worker.close();
  process.exit(0);
});
