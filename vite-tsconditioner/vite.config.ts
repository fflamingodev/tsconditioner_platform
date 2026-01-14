import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";

// vite.config/
export default defineConfig({
  plugins: [react()],
  base: "/webtimeseries/",
  build: {
    outDir: path.resolve(__dirname, "../go_tsconditioner/ui/static-react/timeseries-dist"),
    emptyOutDir: true,
  },
})
