import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(() => {
  let httpsOptions;
  try {
    const certDir = path.resolve(__dirname, 'certs');
    httpsOptions = {
      key: fs.readFileSync(path.join(certDir, 'key.pem')),
      cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
    };
  } catch (error) {
    console.warn('⚠️ HTTPS証明書の読み込みに失敗:', error.message);
    httpsOptions = false;
  }

  return {
    plugins: [react()],
    server: {
      https: httpsOptions || false,
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
