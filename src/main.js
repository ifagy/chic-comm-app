import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'
import { inject } from '@vercel/analytics';

inject();

registerSW({ immediate: true })

createApp(App).mount('#app')