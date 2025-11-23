import { Global, Module } from "@nestjs/common";
import { MemoryStore } from "./memory-store";
import type { StorePort } from "./store.port";

@Global()
@Module({
  providers: [
    MemoryStore,
    {
      provide: "StorePort",
      useExisting: MemoryStore,
    },
  ],
  exports: [MemoryStore, "StorePort"],
})
export class StoreModule {}
