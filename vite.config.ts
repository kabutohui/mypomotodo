import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages部署时需要设置base路径
  // 如果部署到 https://username.github.io/repo-name/，则设置为 '/repo-name/'
  // 如果部署到自定义域名或根路径，则设置为 '/'
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), svgr({
      svgrOptions: {
        icon: true, exportType: 'named', namedExport: 'ReactComponent', }, }), miaodaDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
