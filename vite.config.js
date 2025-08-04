import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // --- Configurația ta existentă, care rămâne neschimbată ---
  // Setează subfolderul în care vei publica aplicația.
  base: '/proiect-3d/',


  // --- Aici adăugăm noua configurație pentru build ---
  build: {
    rollupOptions: {
      output: {
        // Această funcție separă biblioteca 'three' într-un fișier propriu
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
        }
      }
    }
  }
})