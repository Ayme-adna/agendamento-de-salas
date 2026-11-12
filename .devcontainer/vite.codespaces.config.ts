// Configuração do Vite usada só no Codespaces: as telas repassam /api para a API local,
// assim o navegador fala com um único endereço (a porta 5173).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        rewrite: (caminho) => caminho.replace(/^\/api/, ""),
      },
    },
  },
});
