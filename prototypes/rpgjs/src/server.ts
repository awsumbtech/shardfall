import {
  createServer,
  LocalStorageSaveStorageStrategy,
  provideSaveStorage,
  provideServerModules,
} from "@rpgjs/server";
import { provideTiledMap } from "@rpgjs/tiledmap/server";
import { provideMain } from "./modules/main/index.ts";

export default createServer({
  providers: [
    provideMain(),
    provideSaveStorage(new LocalStorageSaveStorageStrategy({ key: "shardfall-rpgjs-spike" })),
    provideServerModules([]),
    provideTiledMap({ basePath: "map" }),
  ],
});
