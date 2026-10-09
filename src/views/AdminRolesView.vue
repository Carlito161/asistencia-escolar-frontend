<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

import roleService
  from '@/services/roleService'

import {
  useAuthStore,
} from '@/stores/auth'

const router =
  useRouter()

const authStore =
  useAuthStore()

const SYSTEM_ROLES = [
  'Administrador',
  'Docente',
  'Alumno',
]

const loading =
  ref(true)

const saving =
  ref(false)

const error =
  ref('')

const success =
  ref('')

const roles =
  ref([])

const permissions =
  ref([])

const showModal =
  ref(false)

const mode =
  ref('create')

const editingRole =
  ref(null)

const formErrors =
  ref({})

const form =
  ref({
    nombre: '',
    descripcion: '',
    estado: true,
    permissions: [],
  })

const permissionGroups =
  computed(() => {
    const groups = {}

    permissions.value
      .forEach(
        (permission) => {
          const prefix =
            permission.nombre
              .split('.')[0]

          if (!groups[prefix]) {
            groups[prefix] = []
          }

          groups[prefix].push(
            permission,
          )
        },
      )

    return groups
  })

const groupLabel =
  (group) => {
    const labels = {
      user: 'Usuarios',
      role: 'Roles',
      grado: 'Grados',
      seccion: 'Secciones',
      estudiante:
        'Estudiantes',
      asistencia:
        'Asistencias',
    }

    return (
      labels[group] ||
      group
    )
  }

const permissionLabel =
  (name) => {
    const labels = {
      'user.view':
        'Ver usuarios',
      'user.create':
        'Crear usuarios',
      'user.edit':
        'Editar usuarios',
      'user.delete':
        'Eliminar usuarios',

      'role.view':
        'Ver roles',
      'role.assign':
        'Administrar roles',

      'grado.view':
        'Ver grados',
      'grado.create':
        'Crear grados',
      'grado.edit':
        'Editar grados',
      'grado.delete':
        'Eliminar grados',

      'seccion.view':
        'Ver secciones',
      'seccion.create':
        'Crear secciones',
      'seccion.edit':
        'Editar secciones',
      'seccion.delete':
        'Eliminar secciones',

      'estudiante.view':
        'Ver estudiantes',
      'estudiante.create':
        'Crear estudiantes',
      'estudiante.edit':
        'Editar estudiantes',
      'estudiante.delete':
        'Eliminar estudiantes',

      'asistencia.view':
        'Ver asistencias',
      'asistencia.mark':
        'Registrar asistencia',
      'asistencia.edit':
        'Editar asistencia',
      'asistencia.report':
        'Generar reportes',
    }

    return (
      labels[name] ||
      name
    )
  }

const loadData =
  async () => {
    loading.value = true
    error.value = ''

    try {
      const [
        roleResult,
        permissionResult,
      ] =
        await Promise.all([
          roleService
            .getRoles(),

          roleService
            .getPermissions(),
        ])

      roles.value =
        roleResult

      permissions.value =
        permissionResult
    } catch (requestError) {
      console.error(
        'Error roles:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible cargar roles y permisos.'
    } finally {
      loading.value =
        false
    }
  }

const isSystemRole =
  (role) => {
    return SYSTEM_ROLES
      .includes(
        role.nombre,
      )
  }

const isAdministrator =
  (role) => {
    return (
      role.nombre ===
      'Administrador'
    )
  }

const rolePermissionCount =
  (role) => {
    return (
      role.permissions
        ?.length || 0
    )
  }

const openCreate =
  () => {
    mode.value =
      'create'

    editingRole.value =
      null

    formErrors.value =
      {}

    form.value = {
      nombre: '',
      descripcion: '',
      estado: true,
      permissions: [],
    }

    showModal.value =
      true
  }

const openEdit =
  (role) => {
    mode.value =
      'edit'

    editingRole.value =
      role

    formErrors.value =
      {}

    const ids =
      permissions.value
        .filter(
          (permission) =>
            role.permissions
              ?.includes(
                permission.nombre,
              ),
        )
        .map(
          (permission) =>
            permission.id,
        )

    form.value = {
      nombre:
        role.nombre,

      descripcion:
        role.descripcion || '',

      estado:
        Boolean(
          role.estado,
        ),

      permissions:
        ids,
    }

    showModal.value =
      true
  }

const closeModal =
  () => {
    if (saving.value) {
      return
    }

    showModal.value =
      false
  }

const togglePermission =
  (permissionId) => {

    if (
      editingRole.value &&
      isAdministrator(
        editingRole.value,
      )
    ) {
      return
    }

    const index =
      form.value
        .permissions
        .indexOf(
          permissionId,
        )

    if (index >= 0) {
      form.value
        .permissions
        .splice(
          index,
          1,
        )
    } else {
      form.value
        .permissions
        .push(
          permissionId,
        )
    }
  }

const selectGroup =
  (groupPermissions) => {
    if (
      editingRole.value &&
      isAdministrator(
        editingRole.value,
      )
    ) {
      return
    }

    const ids =
      groupPermissions
        .map(
          (item) =>
            item.id,
        )

    const allSelected =
      ids.every(
        (id) =>
          form.value
            .permissions
            .includes(id),
      )

    if (allSelected) {
      form.value.permissions =
        form.value
          .permissions
          .filter(
            (id) =>
              !ids.includes(
                id,
              ),
          )

      return
    }

    ids.forEach(
      (id) => {
        if (
          !form.value
            .permissions
            .includes(id)
        ) {
          form.value
            .permissions
            .push(id)
        }
      },
    )
  }

const validate =
  () => {
    const errors = {}

    if (
      !form.value
        .nombre
        .trim()
    ) {
      errors.nombre =
        'El nombre del rol es requerido.'
    }

    formErrors.value =
      errors

    return (
      Object.keys(
        errors,
      ).length === 0
    )
  }

const saveRole =
  async () => {
    error.value = ''
    success.value = ''

    if (!validate()) {
      return
    }

    if (
      editingRole.value &&
      isAdministrator(
        editingRole.value,
      )
    ) {
      showModal.value =
        false

      return
    }

    saving.value = true

    try {
      const system =
        editingRole.value &&
        isSystemRole(
          editingRole.value,
        )

      const payload = {

        nombre:
          system
            ? editingRole
                .value
                .nombre
            : form.value
                .nombre
                .trim(),

        descripcion:
          form.value
            .descripcion
            .trim() ||
          null,

        estado:
          system
            ? true
            : Boolean(
                form.value
                  .estado,
              ),

        permissions:
          form.value
            .permissions,
      }

      if (
        mode.value ===
        'create'
      ) {
        await roleService
          .createRole(
            payload,
          )

        success.value =
          'Rol creado correctamente.'
      } else {
        await roleService
          .updateRole(
            editingRole
              .value.id,
            payload,
          )

        success.value =
          'Rol actualizado correctamente.'
      }

      showModal.value =
        false

      await loadData()
    } catch (requestError) {
      console.error(
        'Error guardando rol:',
        requestError,
      )

      if (
        requestError
          ?.response
          ?.status ===
        422
      ) {
        const backendErrors =
          requestError
            ?.response
            ?.data
            ?.errors

        if (
          backendErrors
        ) {
          const mapped = {}

          Object.entries(
            backendErrors,
          ).forEach(
            ([
              key,
              messages,
            ]) => {
              mapped[key] =
                Array.isArray(
                  messages,
                )
                  ? messages[0]
                  : messages
            },
          )

          formErrors.value =
            mapped

          return
        }
      }

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible guardar el rol.'
    } finally {
      saving.value =
        false
    }
  }

const deleteRole =
  async (role) => {
    if (
      isSystemRole(role)
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `¿Deseas eliminar el rol "${role.nombre}"?`,
      )

    if (!confirmed) {
      return
    }

    error.value = ''
    success.value = ''

    try {
      await roleService
        .deleteRole(
          role.id,
        )

      success.value =
        'Rol eliminado correctamente.'

      await loadData()
    } catch (requestError) {
      console.error(
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible eliminar el rol.'
    }
  }

const logout =
  async () => {
    await authStore
      .logout()

    router.replace(
      '/login',
    )
  }

onMounted(
  async () => {
    authStore.loadSession()

    await loadData()
  },
)
</script>

<template>
  <div class="admin-layout">

    <aside class="sidebar">

      <div class="brand">

        <div class="logo">
          QR
        </div>

        <div>
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
          ⌂ Inicio
        </RouterLink>

        <RouterLink
          to="/admin/estudiantes"
          class="menu-item"
        >
          🎒 Estudiantes
        </RouterLink>

        <RouterLink
          to="/admin/roles"
          class="menu-item"
        >
          🔐 Roles y permisos
        </RouterLink>

        <div class="menu-item disabled">
          🎓 Grados
        </div>

        <div class="menu-item disabled">
          🏫 Secciones
        </div>

        <div class="menu-item disabled">
          📊 Reportes
        </div>

      </nav>

      <button
        class="logout"
        @click="logout"
      >
        ↪ Cerrar sesión
      </button>

    </aside>

    <main>

      <header class="topbar">

        <div>
          <strong>
            Administración
          </strong>

          <span>
            Roles y permisos
          </span>
        </div>

        <div class="profile">

          <div class="avatar">
            AD
          </div>

          <div>
            <strong>
              Administrador
            </strong>

            <span>
              {{ authStore.email }}
            </span>
          </div>

        </div>

      </header>

      <section class="content">

        <div class="heading">

          <div>

            <h1>
              Roles y permisos
            </h1>

            <p>
              Administra los permisos
              asociados a cada rol del
              sistema.
            </p>

          </div>

          <button
            class="new-button"
            @click="openCreate"
          >
            + Nuevo rol
          </button>

        </div>

        <div
          class="notice"
        >
          <strong>
            Roles del sistema protegidos
          </strong>

          <span>
            Administrador, Docente y Alumno
            no pueden eliminarse ni
            renombrarse desde esta pantalla.
          </span>
        </div>

        <div
          v-if="success"
          class="message success"
        >
          ✓ {{ success }}
        </div>

        <div
          v-if="error"
          class="message error"
        >
          ! {{ error }}
        </div>

        <div
          v-if="loading"
          class="state"
        >

          <div class="loader">
          </div>

          <strong>
            Cargando roles...
          </strong>

        </div>

        <section
          v-else
          class="roles-card"
        >

          <div class="card-heading">

            <div>
              <h2>
                Roles disponibles
              </h2>

              <p>
                {{
                  roles.length
                }}
                roles registrados.
              </p>
            </div>

            <button
              class="refresh"
              @click="loadData"
            >
              ↻ Actualizar
            </button>

          </div>

          <div class="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>
                    Rol
                  </th>

                  <th>
                    Descripción
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Permisos
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>

                <tr
                  v-for="
                    role in roles
                  "
                  :key="
                    role.id
                  "
                >

                  <td>
                    <strong>
                      {{ role.nombre }}
                    </strong>
                  </td>

                  <td class="description">
                    {{
                      role.descripcion ||
                      '--'
                    }}
                  </td>

                  <td>

                    <span
                      class="status"
                      :class="
                        role.estado
                          ? 'active'
                          : 'inactive'
                      "
                    >
                      {{
                        role.estado
                          ? 'Activo'
                          : 'Inactivo'
                      }}
                    </span>

                  </td>

                  <td>
                    <span class="count">
                      {{
                        rolePermissionCount(
                          role
                        )
                      }}
                      permisos
                    </span>
                  </td>

                  <td>

                    <span
                      v-if="
                        isSystemRole(
                          role
                        )
                      "
                      class="
                        role-type
                        system
                      "
                    >
                      Sistema
                    </span>

                    <span
                      v-else
                      class="
                        role-type
                        custom
                      "
                    >
                      Personalizado
                    </span>

                  </td>

                  <td>

                    <div class="actions">

                      <button
                        class="edit"
                        @click="
                          openEdit(
                            role
                          )
                        "
                      >
                        {{
                          isAdministrator(
                            role
                          )
                            ? 'Ver'
                            : 'Editar'
                        }}
                      </button>

                      <button
                        v-if="
                          !isSystemRole(
                            role
                          )
                        "
                        class="delete"
                        @click="
                          deleteRole(
                            role
                          )
                        "
                      >
                        Eliminar
                      </button>

                    </div>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </section>

      </section>

    </main>

    

    <div
      v-if="showModal"
      class="modal-overlay"
      @click.self="
        closeModal
      "
    >

      <div class="modal">

        <div class="modal-header">

          <div>

            <span>
              {{
                mode === 'create'
                  ? 'Nuevo rol'
                  : 'Configuración'
              }}
            </span>

            <h2>
              {{
                mode === 'create'
                  ? 'Crear rol'
                  : editingRole
                      ?.nombre
              }}
            </h2>

          </div>

          <button
            class="close"
            @click="
              closeModal
            "
          >
            ×
          </button>

        </div>

        <div
          v-if="
            editingRole &&
            isAdministrator(
              editingRole
            )
          "
          class="admin-warning"
        >
          El rol Administrador está
          protegido para evitar eliminar
          permisos necesarios para
          administrar el sistema.
        </div>

        <div class="form-grid">

          <div class="field">

            <label>
              Nombre *
            </label>

            <input
              v-model="
                form.nombre
              "
              type="text"
              maxlength="50"
              :disabled="
                editingRole &&
                isSystemRole(
                  editingRole
                )
              "
            />

            <small
              v-if="
                formErrors.nombre
              "
              class="field-error"
            >
              {{
                formErrors.nombre
              }}
            </small>

          </div>

          <div class="field">

            <label>
              Estado
            </label>

            <select
              v-model="
                form.estado
              "
              :disabled="
                editingRole &&
                isSystemRole(
                  editingRole
                )
              "
            >
              <option
                :value="true"
              >
                Activo
              </option>

              <option
                :value="false"
              >
                Inactivo
              </option>
            </select>

          </div>

          <div class="field full">

            <label>
              Descripción
            </label>

            <textarea
              v-model="
                form.descripcion
              "
              maxlength="150"
              rows="3"
              :disabled="
                editingRole &&
                isAdministrator(
                  editingRole
                )
              "
            >
            </textarea>

          </div>

        </div>

        <div class="permissions-header">

          <div>
            <h3>
              Permisos
            </h3>

            <p>
              Selecciona las acciones que
              podrá realizar este rol.
            </p>
          </div>

          <strong>
            {{
              form.permissions
                .length
            }}
            seleccionados
          </strong>

        </div>

        <div class="permission-groups">

          <section
            v-for="
              (
                groupPermissions,
                group
              )
              in permissionGroups
            "
            :key="
              group
            "
            class="permission-group"
          >

            <div class="group-heading">

              <strong>
                {{
                  groupLabel(
                    group
                  )
                }}
              </strong>

              <button
                type="button"
                :disabled="
                  editingRole &&
                  isAdministrator(
                    editingRole
                  )
                "
                @click="
                  selectGroup(
                    groupPermissions
                  )
                "
              >
                Seleccionar grupo
              </button>

            </div>

            <div class="permission-list">

              <label
                v-for="
                  permission
                  in groupPermissions
                "
                :key="
                  permission.id
                "
                class="permission"
              >

                <input
                  type="checkbox"
                  :checked="
                    form.permissions
                      .includes(
                        permission.id
                      )
                  "
                  :disabled="
                    editingRole &&
                    isAdministrator(
                      editingRole
                    )
                  "
                  @change="
                    togglePermission(
                      permission.id
                    )
                  "
                />

                <div>

                  <strong>
                    {{
                      permissionLabel(
                        permission.nombre
                      )
                    }}
                  </strong>

                  <span>
                    {{
                      permission.nombre
                    }}
                  </span>

                </div>

              </label>

            </div>

          </section>

        </div>

        <div class="modal-actions">

          <button
            class="secondary"
            @click="
              closeModal
            "
          >
            {{
              editingRole &&
              isAdministrator(
                editingRole
              )
                ? 'Cerrar'
                : 'Cancelar'
            }}
          </button>

          <button
            v-if="
              !(
                editingRole &&
                isAdministrator(
                  editingRole
                )
              )
            "
            class="primary"
            :disabled="
              saving
            "
            @click="
              saveRole
            "
          >
            {{
              saving
                ? 'Guardando...'
                : mode ===
                    'create'
                  ? 'Crear rol'
                  : 'Guardar cambios'
            }}
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-layout {
  min-height: 100vh;
  display: flex;
  background: #f5f8fc;
  color: #183550;
}

.sidebar {
  width: 255px;
  min-height: 100vh;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e5edf5;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 42px;
}

.logo {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #e4f1ff;
  color: #176fc8;
  font-weight: 800;
}

.brand strong,
.brand span {
  display: block;
}

.brand span {
  margin-top: 2px;
  color: #8796a7;
  font-size: 10px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.menu-item {
  min-height: 45px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  border-radius: 11px;
  color: #53677f;
  text-decoration: none;
  font-size: 11px;
}

.menu-item.router-link-active {
  background: #e4f1ff;
  color: #176bc5;
  font-weight: 700;
}

.menu-item.disabled {
  opacity: 0.45;
}

.logout {
  min-height: 43px;
  margin-top: auto;
  border: 1px solid #dce5ed;
  background: white;
  color: #5a7187;
  border-radius: 10px;
  cursor: pointer;
}

main {
  flex: 1;
  min-width: 0;
}

.topbar {
  height: 76px;
  padding: 0 34px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-bottom: 1px solid #eaf0f5;
}

.topbar strong,
.topbar span {
  display: block;
}

.topbar span {
  margin-top: 2px;
  color: #8998a8;
  font-size: 9px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #dfedff;
  color: #176bc5;
  font-weight: 800;
}

.content {
  padding: 30px 34px 45px;
}

.heading {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.connected {
  color: #219856;
  font-size: 10px;
  font-weight: 700;
}

.heading h1 {
  margin: 5px 0;
  color: #12305a;
  font-size: 34px;
}

.heading p {
  margin: 0;
  color: #74869a;
}

.new-button {
  min-height: 45px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #247ede;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.notice {
  margin-bottom: 16px;
  padding: 13px 16px;
  background: #edf6ff;
  border-radius: 11px;
}

.notice strong,
.notice span {
  display: block;
}

.notice strong {
  color: #2e6fae;
  font-size: 10px;
}

.notice span {
  margin-top: 3px;
  color: #698199;
  font-size: 9px;
}

.message {
  margin-bottom: 15px;
  padding: 13px 16px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}

.message.success {
  background: #e2f8eb;
  color: #218f51;
}

.message.error {
  background: #ffeaea;
  color: #c34a4a;
}

.roles-card {
  overflow: hidden;
  background: white;
  border-radius: 18px;
  box-shadow:
    0 6px 25px
    rgba(39, 77, 120, 0.055);
}

.card-heading {
  padding: 21px 23px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-heading h2 {
  margin: 0;
}

.card-heading p {
  margin: 4px 0 0;
  color: #8494a6;
  font-size: 9px;
}

.refresh {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #d8e2eb;
  background: white;
  color: #506a82;
  border-radius: 9px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 18px;
  border-top: 1px solid #edf1f5;
  text-align: left;
  font-size: 10px;
}

th {
  background: #f8fafc;
  color: #7b8c9e;
  font-size: 9px;
}

td strong {
  color: #294963;
}

.description {
  max-width: 300px;
  color: #6d8195;
}

.status,
.role-type,
.count {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 8px;
  font-weight: 700;
}

.status.active {
  background: #dff7e8;
  color: #219653;
}

.status.inactive {
  background: #eceff3;
  color: #748496;
}

.role-type.system {
  background: #e4f1ff;
  color: #2675bd;
}

.role-type.custom {
  background: #f0eaff;
  color: #7657ad;
}

.count {
  background: #f2f5f8;
  color: #60768b;
}

.actions {
  display: flex;
  gap: 7px;
}

.actions button {
  min-height: 32px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 8px;
  font-weight: 700;
  cursor: pointer;
}

.edit {
  border: 1px solid #cdddec;
  background: #edf6ff;
  color: #2675bd;
}

.delete {
  border: 1px solid #f1cccc;
  background: #fff1f1;
  color: #c34b4b;
}

.state {
  min-height: 300px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
}

.loader {
  width: 38px;
  height: 38px;
  border: 3px solid #dbe6ef;
  border-top-color: #247ede;
  border-radius: 50%;
  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform:
      rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  padding: 20px;
  display: grid;
  place-items: center;
  background:
    rgba(8, 24, 43, 0.73);
}

.modal {
  width: 100%;
  max-width: 850px;
  max-height: 94vh;
  overflow-y: auto;
  padding: 25px;
  background: white;
  border-radius: 20px;
}

.modal-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.modal-header span {
  color: #2678ca;
  font-size: 9px;
  font-weight: 700;
}

.modal-header h2 {
  margin: 4px 0 0;
}

.close {
  width: 39px;
  height: 39px;
  border: 0;
  border-radius: 50%;
  background: #eef3f7;
  font-size: 24px;
}

.admin-warning {
  margin-bottom: 16px;
  padding: 13px;
  background: #fff5dc;
  color: #986c14;
  border-radius: 10px;
  font-size: 9px;
}

.form-grid {
  display: grid;
  grid-template-columns:
    1fr 1fr;
  gap: 14px;
}

.field.full {
  grid-column:
    1 / -1;
}

.field label {
  display: block;
  margin-bottom: 6px;
  color: #536b82;
  font-size: 9px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d9e3ec;
  border-radius: 9px;
  color: #405d77;
  font: inherit;
}

.field input:disabled,
.field select:disabled,
.field textarea:disabled {
  background: #f3f5f7;
}

.field-error {
  display: block;
  margin-top: 5px;
  color: #c94d4d;
  font-size: 8px;
}

.permissions-header {
  margin: 24px 0 12px;
  display: flex;
  justify-content: space-between;
}

.permissions-header h3 {
  margin: 0;
}

.permissions-header p {
  margin: 4px 0 0;
  color: #8091a4;
  font-size: 9px;
}

.permissions-header > strong {
  color: #2678ca;
  font-size: 9px;
}

.permission-groups {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 12px;
}

.permission-group {
  padding: 14px;
  border: 1px solid #e2eaf1;
  border-radius: 12px;
}

.group-heading {
  margin-bottom: 11px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-heading strong {
  color: #36536c;
}

.group-heading button {
  border: 0;
  background: transparent;
  color: #2678ca;
  font-size: 8px;
  cursor: pointer;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission {
  padding: 8px;
  display: flex;
  gap: 9px;
  border-radius: 8px;
  cursor: pointer;
}

.permission:hover {
  background: #f6f9fc;
}

.permission input {
  margin-top: 2px;
}

.permission strong,
.permission span {
  display: block;
}

.permission strong {
  color: #506a82;
  font-size: 9px;
}

.permission span {
  margin-top: 2px;
  color: #97a3b0;
  font-size: 7px;
}

.modal-actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.primary,
.secondary {
  min-height: 42px;
  padding: 0 17px;
  border-radius: 9px;
  font-weight: 700;
}

.primary {
  border: 0;
  background: #247ede;
  color: white;
}

.secondary {
  border: 1px solid #d7e1ea;
  background: white;
  color: #526980;
}

@media (
  max-width: 760px
) {
  .sidebar {
    display: none;
  }

  .content {
    padding: 20px;
  }

  .heading {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid,
  .permission-groups {
    grid-template-columns:
      1fr;
  }
}
</style>