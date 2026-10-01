import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

export default defineConfig({
  testDir: './tests/e2e', timeout: 45000, expect: { timeout: 10000 },
  fullyParallel: false, workers: 1, retries: process.env.CI ? 1 : 0,
  reporter: [['list'],['html',{open:'never'}]],
  use: { baseURL:'http://127.0.0.1:4173/httpslocal-demo/', headless:true, viewport:{width:1440,height:1000},
    trace:'retain-on-failure', screenshot:'only-on-failure',
    launchOptions: { executablePath: existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] } },
  webServer:{command:'npm run preview',url:'http://127.0.0.1:4173/httpslocal-demo/',reuseExistingServer:!process.env.CI,timeout:20000},
});
