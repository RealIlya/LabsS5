import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import type { StorePort } from "../../infrastructure/store/store.port";
import { GameGateway } from "../../presentation/ws/game.gateway";
import { GameService } from "./game.service";

@Injectable()
export class TurnTimerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TurnTimerService.name);
  private interval: NodeJS.Timeout | null = null;
  private readonly tickRateMs = 1_000;

  constructor(
    @Inject("StorePort") private readonly store: StorePort,
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    this.interval = setInterval(() => {
      try {
        this.tick();
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          "Failed to process turn timers",
          err?.stack ?? err?.message
        );
      }
    }, this.tickRateMs);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick() {
    const games = this.store.getAllGames();
    if (!games.length) {
      return;
    }

    games.forEach((game) => {
      const prevPlayer = game.currentPlayerId;
      const prevTurn = game.turn;
      const updated = this.gameService.refreshTurnDeadline(game);
      if (!updated) {
        return;
      }

      const turnAdvanced =
        prevPlayer !== game.currentPlayerId || prevTurn !== game.turn;
      if (turnAdvanced) {
        this.logger.verbose(`Turn advanced automatically for game ${game.id}`);
      }
      this.gameGateway.broadcastGameUpdate(game.id);
    });
  }
}
