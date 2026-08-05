import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import compression from 'vite-plugin-compression'

export default defineConfig(({ command }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development'),
  },
  plugins: [
    react(),
    ...(command === 'build'
      ? [
          compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 10240 }),
          compression({ algorithm: 'gzip', ext: '.gz', threshold: 10240 }),
        ]
      : []),
  ],
}))
