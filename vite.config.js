import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: 'http://hlxcccc.asia/deepseek-project/0.0.11/',
})