<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const busy = ref(false)
const logout = async () => {
  busy.value = true
  try { await auth.logout() }
  catch (error) { console.error('No se pudo revocar la sesión en el servidor:', error.message) }
  finally { busy.value = false; router.push('/login') }
}
</script>

<template>
  <button class="session-logout" :disabled="busy" @click="logout">
    {{ busy ? 'Cerrando sesión…' : 'Cerrar sesión' }}
  </button>
</template>

<style scoped>
.session-logout { padding: 8px 12px; border: 1px solid #d9e1ea; border-radius: 8px; background: white; color: #152536; cursor: pointer; }
.session-logout:disabled { cursor: wait; opacity: .6; }
</style>
