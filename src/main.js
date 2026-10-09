import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
useAuthStore().loadSession()
window.addEventListener('auth:expired', () => {
  useAuthStore().clearSession()
  router.replace({ name: 'login', query: { expired: '1' } })
})
app.use(router)

app.mount('#app')
