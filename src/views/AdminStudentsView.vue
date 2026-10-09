<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

import studentService
  from '@/services/studentService'

import {
  useAuthStore,
} from '@/stores/auth'

const router =
  useRouter()

const authStore =
  useAuthStore()

const loading =
  ref(true)

const catalogLoading =
  ref(true)

const actionLoading =
  ref(false)

const error =
  ref('')

const success =
  ref('')

const students =
  ref([])

const grades =
  ref([])

const sections =
  ref([])

const pagination =
  ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  })

const filters =
  ref({
    search: '',
    gradeId: '',
    sectionId: '',
    status: 'true',
  })

const filteredSections =
  computed(() => {
    if (
      !filters.value
        .gradeId
    ) {
      return sections.value
    }

    return sections.value
      .filter(
        (section) =>
          Number(
            section.grado_id,
          ) ===
          Number(
            filters.value
              .gradeId,
          ),
      )
  })

const showFormModal =
  ref(false)

const formMode =
  ref('create')

const editingId =
  ref(null)

const fieldErrors =
  ref({})

const form =
  ref({
    codigo_estudiante: '',
    nombres: '',
    apellidos: '',
    email: '',
    grado_id: '',
    seccion_id: '',
    estado: true,
  })

const formSections =
  computed(() => {
    if (
      !form.value
        .grado_id
    ) {
      return sections.value
    }

    return sections.value
      .filter(
        (section) =>
          Number(
            section.grado_id,
          ) ===
          Number(
            form.value
              .grado_id,
          ),
      )
  })

const showCredentials =
  ref(false)

const credentials =
  ref({
    name: '',
    email: '',
    password: '',
  })

const copyMessage =
  ref('')

const loadCatalogs =
  async () => {
    catalogLoading.value =
      true

    try {
      const [
        gradesResult,
        sectionsResult,
      ] =
        await Promise.all([
          studentService
            .getActiveGrades(),

          studentService
            .getActiveSections(),
        ])

      grades.value =
        gradesResult

      sections.value =
        sectionsResult
    } catch (requestError) {
      console.error(
        'Error cargando catálogos:',
        requestError,
      )

      error.value =
        'No fue posible cargar los grados y secciones.'
    } finally {
      catalogLoading.value =
        false
    }
  }

const buildParams =
  (
    page = 1,
  ) => {
    const params = {
      page,
      per_page: 15,
    }

    const search =
      filters.value
        .search
        .trim()

    if (search) {
      params.search =
        search
    }

    if (
      filters.value
        .gradeId
    ) {
      params.grado_id =
        filters.value
          .gradeId
    }

    if (
      filters.value
        .sectionId
    ) {
      params.seccion_id =
        filters.value
          .sectionId
    }

    if (
      filters.value
        .status !==
      ''
    ) {
      params.estado =
        filters.value
          .status
    }

    return params
  }

const loadStudents =
  async (
    page = 1,
  ) => {
    loading.value = true
    error.value = ''

    try {
      const response =
        await studentService
          .getStudents(
            buildParams(
              page,
            ),
          )

      students.value =
        response?.data ||
        []

      const meta =
        response?.meta

      pagination.value = {
        currentPage:
          meta?.current_page ||
          page,

        lastPage:
          meta?.last_page ||
          1,

        perPage:
          meta?.per_page ||
          15,

        total:
          meta?.total ||
          0,
      }
    } catch (requestError) {
      console.error(
        'Error cargando estudiantes:',
        requestError,
      )

      const status =
        requestError
          ?.response
          ?.status

      const message =
        requestError
          ?.response
          ?.data
          ?.message

      if (status === 401) {
        error.value =
          'Tu sesión ha expirado.'

        return
      }

      if (status === 403) {
        error.value =
          message ||
          'No tienes permiso para consultar estudiantes.'

        return
      }

      error.value =
        message ||
        'No fue posible cargar los estudiantes.'
    } finally {
      loading.value =
        false
    }
  }

watch(
  () =>
    filters.value
      .gradeId,

  () => {
    if (
      !filters.value
        .sectionId
    ) {
      return
    }

    const sectionStillValid =
      filteredSections
        .value
        .some(
          (section) =>
            Number(
              section.id,
            ) ===
            Number(
              filters.value
                .sectionId,
            ),
        )

    if (
      !sectionStillValid
    ) {
      filters.value
        .sectionId = ''
    }
  },
)

const applyFilters =
  async () => {
    await loadStudents(
      1,
    )
  }

const clearFilters =
  async () => {
    filters.value = {
      search: '',
      gradeId: '',
      sectionId: '',
      status: 'true',
    }

    await loadStudents(
      1,
    )
  }

const resetForm =
  () => {
    form.value = {
      codigo_estudiante: '',
      nombres: '',
      apellidos: '',
      email: '',
      grado_id: '',
      seccion_id: '',
      estado: true,
    }

    fieldErrors.value =
      {}

    editingId.value =
      null
  }

const openCreate =
  () => {
    resetForm()

    formMode.value =
      'create'

    showFormModal.value =
      true
  }

const openEdit =
  (
    student,
  ) => {
    fieldErrors.value =
      {}

    formMode.value =
      'edit'

    editingId.value =
      student.id

    form.value = {
      codigo_estudiante:
        student
          .codigo_estudiante,

      nombres:
        student.nombres,

      apellidos:
        student.apellidos,

      email: '',

      grado_id:
        student
          ?.seccion
          ?.grado_id ||
        student
          ?.seccion
          ?.grado
          ?.id ||
        '',

      seccion_id:
        student
          .seccion_id ||
        '',

      estado:
        Boolean(
          student.estado,
        ),
    }

    showFormModal.value =
      true
  }

const onFormGradeChange =
  () => {
    if (
      !form.value
        .seccion_id
    ) {
      return
    }

    const valid =
      formSections.value
        .some(
          (section) =>
            Number(
              section.id,
            ) ===
            Number(
              form.value
                .seccion_id,
            ),
        )

    if (!valid) {
      form.value
        .seccion_id = ''
    }
  }

const closeForm =
  () => {
    if (
      actionLoading.value
    ) {
      return
    }

    showFormModal.value =
      false

    fieldErrors.value =
      {}
  }

const validateForm =
  () => {
    const errors = {}

    if (
      !form.value
        .codigo_estudiante
        .trim()
    ) {
      errors.codigo_estudiante =
        'El código del estudiante es requerido.'
    }

    if (
      !form.value
        .nombres
        .trim()
    ) {
      errors.nombres =
        'Los nombres son requeridos.'
    }

    if (
      !form.value
        .apellidos
        .trim()
    ) {
      errors.apellidos =
        'Los apellidos son requeridos.'
    }

    if (
      formMode.value ===
        'create' &&
      !form.value
        .email
        .trim()
    ) {
      errors.email =
        'El correo electrónico es requerido.'
    }

    if (
      !form.value
        .grado_id
    ) {
      errors.grado_id =
        'Selecciona un grado.'
    }

    if (
      !form.value
        .seccion_id
    ) {
      errors.seccion_id =
        'Selecciona una sección.'
    }

    fieldErrors.value =
      errors

    return (
      Object.keys(
        errors,
      ).length ===
      0
    )
  }

const applyBackendErrors =
  (
    requestError,
  ) => {
    const backendErrors =
      requestError
        ?.response
        ?.data
        ?.errors

    if (
      !backendErrors
    ) {
      return false
    }

    const mapped = {}

    Object.entries(
      backendErrors,
    ).forEach(
      ([
        field,
        messages,
      ]) => {
        mapped[field] =
          Array.isArray(
            messages,
          )
            ? messages[0]
            : String(
                messages,
              )
      },
    )

    fieldErrors.value =
      mapped

    return true
  }

const submitForm =
  async () => {
    success.value = ''
    error.value = ''

    if (
      !validateForm()
    ) {
      return
    }

    actionLoading.value =
      true

    try {

      if (
        formMode.value ===
        'create'
      ) {
        const payload = {
          codigo_estudiante:
            form.value
              .codigo_estudiante
              .trim(),

          nombres:
            form.value
              .nombres
              .trim(),

          apellidos:
            form.value
              .apellidos
              .trim(),

          email:
            form.value
              .email
              .trim(),

          seccion_id:
            Number(
              form.value
                .seccion_id,
            ),

          estado:
            Boolean(
              form.value
                .estado,
            ),
        }

        const response =
          await studentService
            .createStudent(
              payload,
            )

        // La contraseña temporal solo se devuelve al crear el estudiante.
        credentials.value = {
          name:
            `${form.value.nombres} ${form.value.apellidos}`,

          email:
            form.value.email,

          password:
            response
              ?.temporal_password ||
            '',
        }

        showFormModal.value =
          false

        showCredentials.value =
          true

        success.value =
          'Estudiante creado correctamente.'

        await loadStudents(
          1,
        )

        return
      }

      const payload = {
        codigo_estudiante:
          form.value
            .codigo_estudiante
            .trim(),

        nombres:
          form.value
            .nombres
            .trim(),

        apellidos:
          form.value
            .apellidos
            .trim(),

        seccion_id:
          Number(
            form.value
              .seccion_id,
          ),

        estado:
          Boolean(
            form.value
              .estado,
          ),
      }

      await studentService
        .updateStudent(
          editingId.value,
          payload,
        )

      showFormModal.value =
        false

      success.value =
        'Estudiante actualizado correctamente.'

      await loadStudents(
        pagination.value
          .currentPage,
      )
    } catch (requestError) {
      console.error(
        'Error guardando estudiante:',
        requestError,
      )

      if (
        requestError
          ?.response
          ?.status ===
        422
      ) {
        const applied =
          applyBackendErrors(
            requestError,
          )

        if (applied) {
          return
        }
      }

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible guardar el estudiante.'
    } finally {
      actionLoading.value =
        false
    }
  }

const toggleStatus =
  async (
    student,
  ) => {
    success.value = ''
    error.value = ''

    if (
      student.estado
    ) {
      const confirmed =
        window.confirm(
          `¿Deseas inactivar a ${student.nombres} ${student.apellidos}?`,
        )

      if (!confirmed) {
        return
      }

      actionLoading.value =
        true

      try {
        await studentService
          .deactivateStudent(
            student.id,
          )

        success.value =
          'Estudiante inactivado correctamente.'

        await loadStudents(
          pagination.value
            .currentPage,
        )
      } catch (
        requestError
      ) {
        console.error(
          requestError,
        )

        error.value =
          requestError
            ?.response
            ?.data
            ?.message ||
          'No fue posible inactivar el estudiante.'
      } finally {
        actionLoading.value =
          false
      }

      return
    }

    const confirmed =
      window.confirm(
        `¿Deseas reactivar a ${student.nombres} ${student.apellidos}?`,
      )

    if (!confirmed) {
      return
    }

    actionLoading.value =
      true

    try {
      await studentService
        .updateStudent(
          student.id,
          {
            codigo_estudiante:
              student
                .codigo_estudiante,

            nombres:
              student.nombres,

            apellidos:
              student.apellidos,

            seccion_id:
              Number(
                student
                  .seccion_id,
              ),

            estado: true,
          },
        )

      success.value =
        'Estudiante reactivado correctamente.'

      await loadStudents(
        pagination.value
          .currentPage,
      )
    } catch (
      requestError
    ) {
      console.error(
        requestError,
      )

      const validation =
        requestError
          ?.response
          ?.data
          ?.errors

      if (
        validation
          ?.seccion_id
      ) {
        error.value =
          validation
            .seccion_id[0]

        return
      }

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible reactivar el estudiante.'
    } finally {
      actionLoading.value =
        false
    }
  }

const previousPage =
  async () => {
    if (
      pagination.value
        .currentPage <= 1
    ) {
      return
    }

    await loadStudents(
      pagination.value
        .currentPage - 1,
    )
  }

const nextPage =
  async () => {
    if (
      pagination.value
        .currentPage >=
      pagination.value
        .lastPage
    ) {
      return
    }

    await loadStudents(
      pagination.value
        .currentPage + 1,
    )
  }

const gradeName =
  (student) => {
    return (
      student
        ?.seccion
        ?.grado
        ?.nombre ||
      '--'
    )
  }

const sectionName =
  (student) => {
    return (
      student
        ?.seccion
        ?.nombre ||
      '--'
    )
  }

const copyCredentials =
  async () => {
    const text =
      `Usuario: ${credentials.value.email}\n` +
      `Contraseña temporal: ${credentials.value.password}`

    try {
      await navigator
        .clipboard
        .writeText(
          text,
        )

      copyMessage.value =
        'Credenciales copiadas.'
    } catch {
      copyMessage.value =
        'No fue posible copiar automáticamente.'
    }
  }

const closeCredentials =
  () => {
    showCredentials.value =
      false

    credentials.value = {
      name: '',
      email: '',
      password: '',
    }

    copyMessage.value =
      ''
  }

const goHome =
  () => {
    router.push(
      '/admin',
    )
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

    await loadCatalogs()

    await loadStudents()
  },
)
</script>

<template>
  <div class="admin-layout">

    

    <aside class="sidebar">

      <div class="brand">

        <div class="brand-logo">
          QR
        </div>

        <div>
          <h2>
            Asistencia QR
          </h2>

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
          <span>⌂</span>
          Inicio
        </RouterLink>

        <RouterLink
          to="/admin/estudiantes"
          class="menu-item"
        >
          <span>🎒</span>
          Estudiantes
        </RouterLink>

        <div
          class="menu-item disabled"
        >
          <span>🎓</span>
          Grados
        </div>

        <div
          class="menu-item disabled"
        >
          <span>🏫</span>
          Secciones
        </div>

        <div
          class="menu-item disabled"
        >
          <span>📊</span>
          Reportes
        </div>

      </nav>

      <button
        type="button"
        class="logout-button"
        @click="logout"
      >
        ↪ Cerrar sesión
      </button>

    </aside>

    

    <main>

      <header class="topbar">

        <button
          type="button"
          class="back-button"
          @click="goHome"
        >
          ← Panel principal
        </button>

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
              Gestión de estudiantes
            </h1>

            <p>
              Administra los alumnos registrados
              en el sistema.
            </p>

          </div>

          <button
            type="button"
            class="new-button"
            :disabled="
              catalogLoading
            "
            @click="openCreate"
          >
            + Nuevo estudiante
          </button>

        </div>

        

        <div
          v-if="success"
          class="message success-message"
        >
          ✓ {{ success }}
        </div>

        <div
          v-if="error"
          class="message error-message"
        >
          ! {{ error }}
        </div>

        

        <section class="filters-card">

          <div class="filters-grid">

            <div
              class="field search-field"
            >

              <label>
                Buscar
              </label>

              <input
                v-model="
                  filters.search
                "
                type="text"
                placeholder="Nombre, apellido o código..."
                @keyup.enter="
                  applyFilters
                "
              />

            </div>

            <div class="field">

              <label>
                Grado
              </label>

              <select
                v-model="
                  filters.gradeId
                "
                :disabled="
                  catalogLoading
                "
              >

                <option value="">
                  Todos
                </option>

                <option
                  v-for="
                    grade
                    in grades
                  "
                  :key="
                    grade.id
                  "
                  :value="
                    grade.id
                  "
                >
                  {{ grade.nombre }}
                </option>

              </select>

            </div>

            <div class="field">

              <label>
                Sección
              </label>

              <select
                v-model="
                  filters.sectionId
                "
                :disabled="
                  catalogLoading
                "
              >

                <option value="">
                  Todas
                </option>

                <option
                  v-for="
                    section
                    in filteredSections
                  "
                  :key="
                    section.id
                  "
                  :value="
                    section.id
                  "
                >
                  {{
                    section
                      .grado
                      ?.nombre
                  }}
                  -
                  {{ section.nombre }}
                </option>

              </select>

            </div>

            <div class="field">

              <label>
                Estado
              </label>

              <select
                v-model="
                  filters.status
                "
              >
                <option value="">
                  Todos
                </option>

                <option value="true">
                  Activos
                </option>

                <option value="false">
                  Inactivos
                </option>
              </select>

            </div>

          </div>

          <div class="filter-actions">

            <button
              type="button"
              class="secondary-button"
              @click="
                clearFilters
              "
            >
              Limpiar
            </button>

            <button
              type="button"
              class="primary-button"
              @click="
                applyFilters
              "
            >
              🔎 Buscar
            </button>

          </div>

        </section>

        

        <div class="summary-card">

          <div>

            <span>
              Estudiantes encontrados
            </span>

            <strong>
              {{ pagination.total }}
            </strong>

          </div>

        </div>

        

        <section class="students-card">

          <div class="card-heading">

            <div>
              <h2>
                Estudiantes
              </h2>

              <p>
                Listado paginado del sistema.
              </p>
            </div>

            <button
              type="button"
              class="refresh-button"
              @click="
                loadStudents(
                  pagination.currentPage
                )
              "
            >
              ↻ Actualizar
            </button>

          </div>

          

          <div
            v-if="loading"
            class="state"
          >

            <div class="loader">
            </div>

            <strong>
              Cargando estudiantes...
            </strong>

          </div>

          

          <div
            v-else-if="
              students.length ===
              0
            "
            class="state"
          >

            <div class="empty-icon">
              🎒
            </div>

            <strong>
              No se encontraron estudiantes
            </strong>

            <p>
              Cambia los filtros o crea
              un nuevo estudiante.
            </p>

          </div>

          

          <div
            v-else
            class="table-wrapper"
          >

            <table>

              <thead>

                <tr>
                  <th>
                    Código
                  </th>

                  <th>
                    Estudiante
                  </th>

                  <th>
                    Grado
                  </th>

                  <th>
                    Sección
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>

              </thead>

              <tbody>

                <tr
                  v-for="
                    student
                    in students
                  "
                  :key="
                    student.id
                  "
                >

                  <td>
                    <span class="code">
                      {{
                        student
                          .codigo_estudiante
                      }}
                    </span>
                  </td>

                  <td>

                    <div class="student-cell">

                      <div class="student-avatar">
                        {{
                          student
                            .nombres
                            ?.charAt(0)
                            ?.toUpperCase()
                        }}
                      </div>

                      <div>

                        <strong>
                          {{
                            student.nombres
                          }}
                          {{
                            student.apellidos
                          }}
                        </strong>

                        <span>
                          ID:
                          {{ student.id }}
                        </span>

                      </div>

                    </div>

                  </td>

                  <td>
                    {{
                      gradeName(
                        student
                      )
                    }}
                  </td>

                  <td>
                    {{
                      sectionName(
                        student
                      )
                    }}
                  </td>

                  <td>

                    <span
                      class="status"
                      :class="
                        student.estado
                          ? 'active'
                          : 'inactive'
                      "
                    >
                      {{
                        student.estado
                          ? 'Activo'
                          : 'Inactivo'
                      }}
                    </span>

                  </td>

                  <td>

                    <div class="actions">

                      <button
                        type="button"
                        class="edit-button"
                        @click="
                          openEdit(
                            student
                          )
                        "
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        :class="
                          student.estado
                            ? 'disable-button'
                            : 'activate-button'
                        "
                        :disabled="
                          actionLoading
                        "
                        @click="
                          toggleStatus(
                            student
                          )
                        "
                      >
                        {{
                          student.estado
                            ? 'Inactivar'
                            : 'Reactivar'
                        }}
                      </button>

                    </div>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

          

          <div
            v-if="
              !loading &&
              pagination.lastPage >
                1
            "
            class="pagination"
          >

            <button
              type="button"
              :disabled="
                pagination
                  .currentPage <=
                1
              "
              @click="
                previousPage
              "
            >
              ← Anterior
            </button>

            <span>
              Página
              {{
                pagination
                  .currentPage
              }}
              de
              {{
                pagination
                  .lastPage
              }}
            </span>

            <button
              type="button"
              :disabled="
                pagination
                  .currentPage >=
                pagination
                  .lastPage
              "
              @click="
                nextPage
              "
            >
              Siguiente →
            </button>

          </div>

        </section>

      </section>

    </main>

    

    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="
        closeForm
      "
    >

      <div class="modal-card">

        <div class="modal-header">

          <div>

            <span>
              {{
                formMode ===
                'create'
                  ? 'Nuevo registro'
                  : 'Editar registro'
              }}
            </span>

            <h2>
              {{
                formMode ===
                'create'
                  ? 'Crear estudiante'
                  : 'Editar estudiante'
              }}
            </h2>

          </div>

          <button
            type="button"
            class="close-button"
            @click="
              closeForm
            "
          >
            ×
          </button>

        </div>

        <div class="form-grid">

          

          <div class="field">

            <label>
              Código de estudiante *
            </label>

            <input
              v-model="
                form.codigo_estudiante
              "
              type="text"
              maxlength="30"
              placeholder="Ej. EST-004"
            />

            <small
              v-if="
                fieldErrors
                  .codigo_estudiante
              "
              class="field-error"
            >
              {{
                fieldErrors
                  .codigo_estudiante
              }}
            </small>

          </div>

          

          <div class="field">

            <label>
              Nombres *
            </label>

            <input
              v-model="
                form.nombres
              "
              type="text"
              maxlength="100"
              placeholder="Nombres"
            />

            <small
              v-if="
                fieldErrors
                  .nombres
              "
              class="field-error"
            >
              {{
                fieldErrors
                  .nombres
              }}
            </small>

          </div>

          

          <div class="field">

            <label>
              Apellidos *
            </label>

            <input
              v-model="
                form.apellidos
              "
              type="text"
              maxlength="100"
              placeholder="Apellidos"
            />

            <small
              v-if="
                fieldErrors
                  .apellidos
              "
              class="field-error"
            >
              {{
                fieldErrors
                  .apellidos
              }}
            </small>

          </div>

          

          <div
            v-if="
              formMode ===
              'create'
            "
            class="field"
          >

            <label>
              Correo electrónico *
            </label>

            <input
              v-model="
                form.email
              "
              type="email"
              maxlength="255"
              placeholder="alumno@uped.edu.sv"
            />

            <small
              v-if="
                fieldErrors.email
              "
              class="field-error"
            >
              {{
                fieldErrors.email
              }}
            </small>

          </div>

          

          <div
            v-else
            class="
              field
              info-field
            "
          >

            <label>
              Usuario del sistema
            </label>

            <div class="info-box">
              El correo electrónico no puede
              modificarse desde esta pantalla.
            </div>

          </div>

          

          <div class="field">

            <label>
              Grado *
            </label>

            <select
              v-model="
                form.grado_id
              "
              @change="
                onFormGradeChange
              "
            >

              <option value="">
                Selecciona un grado
              </option>

              <option
                v-for="
                  grade
                  in grades
                "
                :key="
                  grade.id
                "
                :value="
                  grade.id
                "
              >
                {{ grade.nombre }}
              </option>

            </select>

            <small
              v-if="
                fieldErrors
                  .grado_id
              "
              class="field-error"
            >
              {{
                fieldErrors
                  .grado_id
              }}
            </small>

          </div>

          

          <div class="field">

            <label>
              Sección *
            </label>

            <select
              v-model="
                form.seccion_id
              "
              :disabled="
                !form.grado_id
              "
            >

              <option value="">
                Selecciona una sección
              </option>

              <option
                v-for="
                  section
                  in formSections
                "
                :key="
                  section.id
                "
                :value="
                  section.id
                "
              >
                {{ section.nombre }}
              </option>

            </select>

            <small
              v-if="
                fieldErrors
                  .seccion_id
              "
              class="field-error"
            >
              {{
                fieldErrors
                  .seccion_id
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

        </div>

        <div class="form-note">

          <template
            v-if="
              formMode ===
              'create'
            "
          >
            Al crear el estudiante,
            se creará automáticamente su usuario
            con rol
            <strong>Alumno</strong>
            y generará una contraseña
            temporal.
          </template>

          <template v-else>
            El QR del estudiante no será
            modificado durante la edición.
          </template>

        </div>

        <div class="modal-actions">

          <button
            type="button"
            class="secondary-button"
            :disabled="
              actionLoading
            "
            @click="
              closeForm
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            class="primary-button"
            :disabled="
              actionLoading
            "
            @click="
              submitForm
            "
          >
            {{
              actionLoading
                ? 'Guardando...'
                : formMode ===
                    'create'
                  ? 'Crear estudiante'
                  : 'Guardar cambios'
            }}
          </button>

        </div>

      </div>

    </div>

    

    <div
      v-if="showCredentials"
      class="modal-overlay"
    >

      <div
        class="
          modal-card
          credentials-card
        "
      >

        <div class="credentials-icon">
          ✓
        </div>

        <h2>
          Estudiante creado
        </h2>

        <p class="credentials-description">
          Guarda estas credenciales.
          La contraseña temporal se muestra
          únicamente en este momento.
        </p>

        <div class="credential-row">

          <span>
            Estudiante
          </span>

          <strong>
            {{ credentials.name }}
          </strong>

        </div>

        <div class="credential-row">

          <span>
            Usuario
          </span>

          <strong>
            {{ credentials.email }}
          </strong>

        </div>

        <div class="credential-row password-row">

          <span>
            Contraseña temporal
          </span>

          <strong>
            {{ credentials.password }}
          </strong>

        </div>

        <div class="credential-warning">
          ⚠ Esta contraseña debe ser
          guardada antes de cerrar esta
          ventana.
        </div>

        <p
          v-if="copyMessage"
          class="copy-message"
        >
          {{ copyMessage }}
        </p>

        <div class="credential-actions">

          <button
            type="button"
            class="secondary-button"
            @click="
              copyCredentials
            "
          >
            📋 Copiar credenciales
          </button>

          <button
            type="button"
            class="primary-button"
            @click="
              closeCredentials
            "
          >
            Entendido
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
  width: 250px;
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
  margin-bottom: 43px;
}

.brand-logo {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #e4f1ff;
  color: #176fc8;
  font-weight: 800;
}

.brand h2 {
  margin: 0;
  font-size: 18px;
}

.brand span {
  color: #8796a7;
  font-size: 11px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-radius: 11px;
  color: #53677f;
  text-decoration: none;
}

.menu-item.router-link-active {
  background: #e4f1ff;
  color: #176bc5;
  font-weight: 700;
}

.menu-item.disabled {
  opacity: 0.5;
}

.logout-button {
  min-height: 44px;
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

.back-button {
  border: 0;
  background: transparent;
  color: #2678cb;
  cursor: pointer;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile strong,
.profile span {
  display: block;
}

.profile span {
  color: #8897a8;
  font-size: 9px;
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
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}

.connected {
  color: #219856;
  font-size: 11px;
  font-weight: 700;
}

.heading h1 {
  margin: 5px 0;
  color: #12305a;
  font-size: 35px;
}

.heading p {
  margin: 0;
  color: #74869a;
}

.new-button {
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 11px;
  background: #247ede;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.new-button:disabled {
  opacity: 0.5;
}

.message {
  margin-bottom: 15px;
  padding: 13px 16px;
  border-radius: 11px;
  font-size: 11px;
  font-weight: 700;
}

.success-message {
  background: #e2f8eb;
  color: #218f51;
}

.error-message {
  background: #ffeaea;
  color: #c34a4a;
}

.filters-card {
  margin-bottom: 18px;
  padding: 20px;
  background: white;
  border-radius: 17px;
  box-shadow:
    0 6px 24px
    rgba(39, 77, 120, 0.05);
}

.filters-grid {
  display: grid;
  grid-template-columns:
    minmax(250px, 1.8fr)
    repeat(3, minmax(140px, 1fr));
  gap: 12px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  color: #536b82;
  font-size: 10px;
  font-weight: 700;
}

.field input,
.field select {
  width: 100%;
  min-height: 43px;
  padding: 0 11px;
  border: 1px solid #d9e3ec;
  border-radius: 9px;
  background: white;
  color: #405d77;
  outline: none;
  font: inherit;
}

.field input:focus,
.field select:focus {
  border-color: #2780d8;
  box-shadow:
    0 0 0 3px
    rgba(39, 128, 216, 0.07);
}

.field input:disabled,
.field select:disabled {
  background: #f4f6f8;
  cursor: not-allowed;
}

.filter-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.primary-button,
.secondary-button {
  min-height: 42px;
  padding: 0 17px;
  border-radius: 9px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #247ede;
  color: white;
}

.secondary-button {
  border: 1px solid #d7e1ea;
  background: white;
  color: #526980;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.summary-card {
  margin-bottom: 18px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 14px;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: #78899c;
  font-size: 10px;
}

.summary-card strong {
  color: #1d4164;
  font-size: 24px;
}

.summary-note {
  color: #8494a6;
  font-size: 10px;
}

.students-card {
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
  font-size: 18px;
}

.card-heading p {
  margin: 4px 0 0;
  color: #8494a6;
  font-size: 10px;
}

.refresh-button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #d8e2eb;
  background: white;
  color: #506a82;
  border-radius: 9px;
  cursor: pointer;
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
  vertical-align: middle;
  font-size: 10px;
}

th {
  background: #f8fafc;
  color: #7b8c9e;
  font-size: 9px;
  white-space: nowrap;
}

td {
  color: #5b7187;
}

.code {
  color: #2677c8;
  font-weight: 700;
}

.student-cell {
  min-width: 210px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-avatar {
  width: 37px;
  height: 37px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e5f2ff;
  color: #2677c8;
  font-weight: 800;
}

.student-cell strong,
.student-cell span {
  display: block;
}

.student-cell strong {
  color: #294963;
  font-size: 11px;
}

.student-cell span {
  margin-top: 2px;
  color: #94a0ae;
  font-size: 8px;
}

.status {
  display: inline-block;
  min-width: 70px;
  padding: 5px 9px;
  border-radius: 20px;
  text-align: center;
  font-size: 9px;
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

.actions {
  display: flex;
  gap: 7px;
}

.actions button {
  min-height: 33px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
}

.edit-button {
  border: 1px solid #cdddec;
  background: #edf6ff;
  color: #2675bd;
}

.disable-button {
  border: 1px solid #f1cccc;
  background: #fff1f1;
  color: #c34b4b;
}

.activate-button {
  border: 1px solid #c8e8d4;
  background: #e7f8ed;
  color: #218f51;
}

.state {
  min-height: 260px;
  padding: 50px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #77899c;
  text-align: center;
}

.state p {
  margin: 0;
  font-size: 10px;
}

.empty-icon {
  font-size: 42px;
}

.loader {
  width: 37px;
  height: 37px;
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

.pagination {
  padding: 15px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #edf1f5;
}

.pagination span {
  color: #75879b;
  font-size: 10px;
}

.pagination button {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid #d7e1ea;
  background: white;
  color: #506980;
  border-radius: 8px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: default;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  padding: 20px;
  display: grid;
  place-items: center;
  background: rgba(9, 25, 44, 0.72);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 100%;
  max-width: 720px;
  max-height: 94vh;
  overflow-y: auto;
  padding: 25px;
  background: white;
  border-radius: 20px;
  box-shadow:
    0 25px 80px
    rgba(10, 35, 60, 0.22);
}

.modal-header {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.modal-header span {
  color: #2678ca;
  font-size: 10px;
  font-weight: 700;
}

.modal-header h2 {
  margin: 4px 0 0;
  color: #17395d;
}

.close-button {
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  border: 0;
  background: #eef3f7;
  color: #54697f;
  border-radius: 50%;
  font-size: 25px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 16px;
}

.field-error {
  display: block;
  margin-top: 5px;
  color: #c94d4d;
  font-size: 9px;
}

.info-box {
  min-height: 43px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  background: #f1f6fb;
  color: #687e94;
  border-radius: 9px;
  font-size: 9px;
  line-height: 1.4;
}

.form-note {
  margin-top: 19px;
  padding: 13px 15px;
  background: #edf6ff;
  color: #58728b;
  border-radius: 10px;
  font-size: 10px;
  line-height: 1.5;
}

.modal-actions {
  margin-top: 23px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.credentials-card {
  max-width: 520px;
  text-align: center;
}

.credentials-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 17px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e0f7e9;
  color: #219653;
  font-size: 31px;
  font-weight: 800;
}

.credentials-card h2 {
  margin: 0;
  color: #17395d;
}

.credentials-description {
  margin: 8px auto 21px;
  max-width: 390px;
  color: #778a9d;
  font-size: 11px;
  line-height: 1.55;
}

.credential-row {
  margin-top: 9px;
  padding: 12px 14px;
  background: #f6f9fc;
  border-radius: 10px;
  text-align: left;
}

.credential-row span,
.credential-row strong {
  display: block;
}

.credential-row span {
  color: #8494a6;
  font-size: 9px;
}

.credential-row strong {
  margin-top: 4px;
  color: #294963;
  font-size: 12px;
}

.password-row {
  background: #eef6ff;
}

.password-row strong {
  color: #176bc5;
  font-size: 17px;
  letter-spacing: 1px;
}

.credential-warning {
  margin-top: 16px;
  padding: 12px;
  background: #fff5dc;
  color: #986c14;
  border-radius: 10px;
  font-size: 10px;
}

.copy-message {
  color: #218f51;
  font-size: 10px;
}

.credential-actions {
  margin-top: 20px;
  display: grid;
  grid-template-columns:
    1fr 1fr;
  gap: 9px;
}

@media (max-width: 1100px) {
  .filters-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
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

  .new-button {
    width: 100%;
  }

  .filters-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .credential-actions {
    grid-template-columns: 1fr;
  }

  .pagination {
    gap: 10px;
    flex-direction: column;
  }
}
</style>