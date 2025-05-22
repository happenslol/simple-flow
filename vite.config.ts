import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tsconfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
	server: { port: 3000 },
	plugins: [react(), tsconfigPaths(), tailwindcss()],
	build: { emptyOutDir: true },
})
