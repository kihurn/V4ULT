import { defineConfig } from '@playwright/test'
export default defineConfig({testDir:'tests/e2e',use:{baseURL:'http://127.0.0.1:5173',browserName:'chromium',launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']},viewport:{width:390,height:844}},workers:1})
