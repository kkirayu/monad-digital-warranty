import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // <-- TAMBAHKAN INI (Sangat ampuh untuk error Web3)
    minify: false     // <-- (OPSIONAL UNTUK HACKATHON) Matikan minifikasi sementara biar kodenya gak rusak saat di-deploy
  }
})