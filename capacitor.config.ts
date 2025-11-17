import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prodata.farmapp',
  appName: 'PRODATA BROILER APP',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
