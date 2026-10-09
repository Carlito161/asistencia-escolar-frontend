<script setup>
import {
  useRouter,
} from 'vue-router'

import {
  useAuthStore,
} from '@/stores/auth'

const router =
  useRouter()

const authStore =
  useAuthStore()

const logout =
  async () => {
    try {
      await authStore.logout()
    } catch (
      error
    ) {
      console.error(
        'Error cerrando sesión:',
        error,
      )
    } finally {
      await router.replace(
        '/login',
      )
    }
  }
</script>

<template>
  <aside class="admin-sidebar">

    <div class="brand">

      <div class="brand-logo">
        QR
      </div>

      <div class="brand-info">

        <strong>
          Asistencia QR
        </strong>

        <span>
          Administración
        </span>

      </div>

    </div>

    <nav class="menu">

      <RouterLink
        to="/admin"
        class="menu-item"
      >
        <span class="menu-icon">
          ⌂
        </span>

        <span class="menu-text">
          Inicio
        </span>
      </RouterLink>

      <RouterLink
        to="/admin/estudiantes"
        class="menu-item"
      >
        <span class="menu-icon">
          🎒
        </span>

        <span class="menu-text">
          Estudiantes
        </span>
      </RouterLink>

      <RouterLink
        to="/admin/roles"
        class="menu-item"
      >
        <span class="menu-icon">
          🔐
        </span>

        <span class="menu-text">
          Roles y permisos
        </span>
      </RouterLink>

      <RouterLink
        to="/admin/grados"
        class="menu-item"
      >
        <span class="menu-icon">
          🎓
        </span>

        <span class="menu-text">
          Grados
        </span>
      </RouterLink>

      <RouterLink
        to="/admin/secciones"
        class="menu-item"
      >
        <span class="menu-icon">
          🏫
        </span>

        <span class="menu-text">
          Secciones
        </span>
      </RouterLink>

      <RouterLink
        to="/admin/reportes"
        class="menu-item"
      >
        <span class="menu-icon">
          📊
        </span>

        <span class="menu-text">
          Reportes
        </span>
      </RouterLink>

    </nav>

    <div class="sidebar-footer">

      <div class="user-card">

        <div class="user-avatar">
          AD
        </div>

        <div class="user-info">

          <strong>
            Administrador
          </strong>

          <span>
            {{
              authStore.email ||
              'Sesión activa'
            }}
          </span>

        </div>

      </div>

      <button
        type="button"
        class="logout-button"
        @click="logout"
      >
        <span>
          ↪
        </span>

        Cerrar sesión
      </button>

    </div>

  </aside>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-sidebar {
  width: 255px;
  height: 100vh;
  flex: 0 0 255px;
  position: sticky;
  top: 0;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e5edf5;
  z-index: 100;
}

.brand {
  padding: 0 4px;
  margin-bottom: 42px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #e4f1ff;
  color: #176fc8;
  font-size: 13px;
  font-weight: 800;
}

.brand-info {
  min-width: 0;
}

.brand-info strong,
.brand-info span {
  display: block;
}

.brand-info strong {
  color: #17395d;
  font-size: 16px;
  white-space: nowrap;
}

.brand-info span {
  margin-top: 2px;
  color: #8796a7;
  font-size: 9px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.menu-item {
  width: 100%;
  min-height: 45px;
  padding: 0 13px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-radius: 11px;
  color: #53677f;
  text-decoration: none;
  font-size: 11px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.menu-item:hover {
  background: #f1f7fd;
  color: #2476c8;
  transform:
    translateX(2px);
}

.menu-item.router-link-exact-active {
  background: #e4f1ff;
  color: #176bc5;
  font-weight: 700;
}

.menu-icon {
  width: 23px;
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  font-size: 15px;
}

.menu-text {
  flex: 1;
  min-width: 0;
}

.sidebar-footer {
  margin-top: auto;
}

.user-card {
  margin-bottom: 12px;
  padding: 11px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: #f6f9fc;
  border: 1px solid #edf2f6;
  border-radius: 11px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #dfedff;
  color: #176bc5;
  font-size: 10px;
  font-weight: 800;
}

.user-info {
  min-width: 0;
}

.user-info strong,
.user-info span {
  display: block;
}

.user-info strong {
  color: #405d76;
  font-size: 9px;
}

.user-info span {
  max-width: 150px;
  margin-top: 2px;
  overflow: hidden;
  color: #8998a8;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #dce5ed;
  background: white;
  color: #5a7187;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.logout-button:hover {
  background: #fff3f3;
  border-color: #efcece;
  color: #be4b4b;
}

@media (
  max-width: 760px
) {
  .admin-sidebar {
    display: none;
  }
}
</style>