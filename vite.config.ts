import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/task-management/" : "/",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
}));