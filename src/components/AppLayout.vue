<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const logout = async () => {
  try { await authStore.logout() } catch (err) { console.error('No se pudo revocar la sesión en el servidor:', err.message) }
  finally { router.push('/login') }
}
</script>

<template>
  <div class="app-layout">

    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">QR</div>

        <div>
          <h2>Asistencia QR</h2>
          <span>Panel administrativo</span>
        </div>
      </div>

      <nav class="menu">
        <RouterLink to="/dashboard">
          Inicio
        </RouterLink>

        <RouterLink to="/admin/estudiantes">
          Estudiantes
        </RouterLink>

        <RouterLink to="/admin/secciones">
          Secciones
        </RouterLink>

        <RouterLink to="/admin/grados">
          Grados
        </RouterLink>
      </nav>

      <button
        class="logout-button"
        @click="logout"
      >
        Cerrar sesión
      </button>
    </aside>

    <main class="main-content">

      <header class="topbar">
        <div>
          <h3>Sistema de Asistencia</h3>
          <p>Panel de administración</p>
        </div>

        <div class="user">
          <div class="avatar">
            U
          </div>

          <div>
            <strong>Usuario</strong>
            <span>Administrador</span>
          </div>
        </div>
      </header>

      <section class="page-content">
        <slot />
      </section>

    </main>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  background: #f4f7fb;
}

.sidebar {
  width: 260px;
  min-height: 100vh;

  display: flex;
  flex-direction: column;

  padding: 28px 20px;

  background: #0f3d6e;
  color: white;
}

.brand {
  display: flex;
  align-items: center;

  gap: 12px;

  margin-bottom: 40px;
}

.brand-icon {
  width: 44px;
  height: 44px;

  display: flex;
  justify-content: center;
  align-items: center;

  background: white;
  color: #145da0;

  border-radius: 12px;

  font-weight: 800;
}

.brand h2 {
  margin: 0;
  font-size: 18px;
}

.brand span {
  display: block;

  margin-top: 3px;

  font-size: 11px;
  opacity: 0.7;
}

.menu {
  display: flex;
  flex-direction: column;

  gap: 8px;

  flex: 1;
}

.menu a {
  padding: 12px 14px;

  border-radius: 9px;

  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;

  transition: 0.2s;
}

.menu a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu a.router-link-active {
  background: rgba(255, 255, 255, 0.16);
  color: white;
}

.logout-button {
  padding: 12px;

  background: transparent;

  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9px;

  color: white;

  cursor: pointer;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main-content {
  flex: 1;
  min-width: 0;
}

.topbar {
  height: 78px;

  padding: 0 30px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  background: white;

  border-bottom: 1px solid #e4e7ec;
}

.topbar h3 {
  margin: 0;

  color: #152536;
  font-size: 18px;
}

.topbar p {
  margin: 3px 0 0;

  color: #98a2b3;

  font-size: 12px;
}

.user {
  display: flex;
  align-items: center;

  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 50%;

  background: #eaf2fb;
  color: #145da0;

  font-weight: 700;
}

.user strong,
.user span {
  display: block;
}

.user strong {
  color: #344054;
  font-size: 13px;
}

.user span {
  margin-top: 2px;

  color: #98a2b3;
  font-size: 11px;
}

.page-content {
  padding: 30px;
}

@media (max-width: 850px) {
  .sidebar {
    width: 210px;
  }
}

@media (max-width: 650px) {
  .sidebar {
    display: none;
  }

  .topbar {
    padding: 0 18px;
  }

  .page-content {
    padding: 18px;
  }
}
</style>
