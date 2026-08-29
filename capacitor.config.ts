import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habitgarden.app',
  appName: 'Habit Garden',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // For local dev, uncomment to connect to dev server:
    // url: 'http://192.168.1.x:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    LocalNotifications: {
      iconColor: '#638653',
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
  },
};

export default config;
