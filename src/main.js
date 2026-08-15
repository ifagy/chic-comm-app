import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'
import { Analytics } from "@vercel/analytics/vue"

registerSW({ immediate: true })

createApp(App).mount('#app')