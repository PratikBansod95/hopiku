import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@entities": fileURLToPath(new URL("./src/entities", import.meta.url)),
      "@world": fileURLToPath(new URL("./src/world", import.meta.url)),
      "@systems": fileURLToPath(new URL("./src/systems", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@platform": fileURLToPath(new URL("./src/platform", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});
