import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{ method: string; url: string }>();
    const response = httpContext.getResponse<{ statusCode: number }>();
    const { method, url } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, url, response.statusCode, startedAt),
        error: (error: any) => {
          const statusCode = error?.status ?? response.statusCode ?? 500;
          this.log(method, url, statusCode, startedAt, error?.message);
        },
      })
    );
  }

  private log(
    method: string,
    url: string,
    statusCode: number,
    startedAt: number,
    errorMessage?: string
  ) {
    const duration = Date.now() - startedAt;
    const message = `${method} ${url} ${statusCode} +${duration}ms`;

    if (errorMessage) {
      this.logger.error(`${message} :: ${errorMessage}`);
      return;
    }

    this.logger.log(message);
  }
}
