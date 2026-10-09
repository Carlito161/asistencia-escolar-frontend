<script setup>
import AdminSidebar
  from '@/components/Admin/AdminSidebar.vue'
</script>

<template>

  <RouterView
    v-slot="{
      Component,
      route,
    }"
  >

    

    <div
      v-if="
        route.meta.role ===
        'Administrador'
      "
      class="admin-shell"
    >

      

      <AdminSidebar />

      

      <div class="admin-shell-content">

        <component
          :is="Component"
        />

      </div>

    </div>

    

    <component
      :is="Component"
      v-else
    />

  </RouterView>

</template>

<style>

html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;

  background: #f5f8fc;
}

.admin-shell {
  width: 100%;
  min-height: 100vh;

  display: flex;

  background: #f5f8fc;
}

.admin-shell-content {
  min-width: 0;
  flex: 1;
}

.admin-shell-content
.admin-page
> .sidebar,

.admin-shell-content
.admin-layout
> .sidebar {
  display: none !important;
}

.admin-shell-content
> .admin-page,

.admin-shell-content
> .admin-layout {
  width: 100%;
}

.admin-shell-content
.backend-warning {
  display: none !important;
}

@media (
  max-width: 760px
) {
  .admin-shell {
    display: block;
  }

  .admin-shell-content {
    width: 100%;
  }
}
</style>
