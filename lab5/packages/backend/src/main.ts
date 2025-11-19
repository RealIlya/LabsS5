import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./presentation/http/app.module";
import { HttpLoggingInterceptor } from "./presentation/http/interceptors/http-logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  app.enableCors({
    origin: (origin, cb) => cb(null, origin ?? "*"),
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 9999;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}

bootstrap();
