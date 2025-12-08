import { Global, Module } from "@nestjs/common";
import { MemoryStore } from "./memory-store";
import { FileStore } from "./file-store";

@Global()
@Module({
  providers: [
    MemoryStore,
    FileStore,
    {
      provide: "StorePort",
      useFactory: (memoryStore: MemoryStore, fileStore: FileStore) => {
        const useMemory =
          process.env.USE_MEMORY_STORE === "true" ||
          process.env.NODE_ENV === "test";
        return useMemory ? memoryStore : fileStore;
      },
      inject: [MemoryStore, FileStore],
    },
  ],
  exports: ["StorePort"],
})
export class StoreModule {}
