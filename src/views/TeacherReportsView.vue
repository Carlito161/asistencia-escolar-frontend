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

import attendanceService
  from '@/services/attendanceService'

import teacherService
  from '@/services/teacherService'

import {
  useAuthStore,
} from '@/stores/auth'

const router =
  useRouter()

const authStore =
  useAuthStore()

const loading =
  ref(true)

const loadingCatalogs =
  ref(true)

const error =
  ref('')

const records =
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

const getToday =
  () => {
    const date =
      new Date()

    const year =
      date.getFullYear()

    const month =
      String(
        date.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )

    const day =
      String(
        date.getDate(),
      ).padStart(
        2,
        '0',
      )

    return (
      `${year}-${month}-${day}`
    )
  }

const filters =
  ref({
    gradeId:
      '',

    sectionId:
      '',

    status:
      '',

    dateFrom:
      getToday(),

    dateTo:
      getToday(),
  })

const loadGrades =
  async () => {
    const response =
      await teacherService
        .getGrades({
          estado: true,
        })

    grades.value =
      response?.data || []
  }

const loadSections =
  async () => {
    const params = {
      estado: true,
    }

    if (
      filters.value.gradeId
    ) {
      params.grado_id =
        filters.value.gradeId
    }

    const response =
      await teacherService
        .getSections(
          params,
        )

    sections.value =
      response?.data || []
  }

const loadCatalogs =
  async () => {
    loadingCatalogs.value =
      true

    try {
      await Promise.all([
        loadGrades(),
        loadSections(),
      ])
    } catch (requestError) {
      console.error(
        'Error cargando catálogos:',
        requestError,
      )
    } finally {
      loadingCatalogs.value =
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

    if (
      filters.value.gradeId
    ) {
      params.grado_id =
        filters.value.gradeId
    }

    if (
      filters.value.sectionId
    ) {
      params.seccion_id =
        filters.value.sectionId
    }

    if (
      filters.value.status
    ) {
      params.estado =
        filters.value.status
    }

    if (
      filters.value.dateFrom
    ) {
      params.fecha_desde =
        filters.value.dateFrom
    }

    if (
      filters.value.dateTo
    ) {
      params.fecha_hasta =
        filters.value.dateTo
    }

    return params
  }

const loadReport =
  async (
    page = 1,
  ) => {
    loading.value =
      true

    error.value =
      ''

    try {
      const response =
        await attendanceService
          .getReport(
            buildParams(
              page,
            ),
          )

      records.value =
        response?.data || []

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
        'Error cargando reporte:',
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
          'No tienes permiso para consultar reportes.'

        return
      }

      if (status === 422) {
        error.value =
          message ||
          'Revisa los filtros seleccionados.'

        return
      }

      error.value =
        message ||
        'No fue posible cargar el reporte.'
    } finally {
      loading.value =
        false
    }
  }

const applyFilters =
  async () => {
    if (
      filters.value.dateFrom &&
      filters.value.dateTo &&
      filters.value.dateTo <
        filters.value.dateFrom
    ) {
      error.value =
        'La fecha final no puede ser menor que la fecha inicial.'

      return
    }

    await loadReport(
      1,
    )
  }

const clearFilters =
  async () => {
    filters.value = {
      gradeId: '',
      sectionId: '',
      status: '',
      dateFrom:
        getToday(),

      dateTo:
        getToday(),
    }

    await loadSections()

    await loadReport(
      1,
    )
  }

watch(
  () =>
    filters.value
      .gradeId,

  async () => {

    filters.value
      .sectionId = ''

    await loadSections()
  },
)

const presentCount =
  computed(() => {
    return records.value
      .filter(
        (record) =>
          record.estado ===
          'PRESENTE',
      )
      .length
  })

const lateCount =
  computed(() => {
    return records.value
      .filter(
        (record) =>
          record.estado ===
          'TARDIA',
      )
      .length
  })

const absentCount =
  computed(() => {
    return records.value
      .filter(
        (record) =>
          record.estado ===
          'AUSENTE',
      )
      .length
  })

const studentName =
  (record) => {
    const student =
      record?.estudiante

    if (!student) {
      return 'Estudiante'
    }

    return (
      `${student.nombres || ''} ` +
      `${student.apellidos || ''}`
    ).trim()
  }

const studentCode =
  (record) => {
    return (
      record
        ?.estudiante
        ?.codigo_estudiante ||
      '--'
    )
  }

const gradeName =
  (record) => {
    return (
      record
        ?.estudiante
        ?.seccion
        ?.grado
        ?.nombre ||
      '--'
    )
  }

const sectionName =
  (record) => {
    return (
      record
        ?.estudiante
        ?.seccion
        ?.nombre ||
      '--'
    )
  }

const statusLabel =
  (status) => {
    switch (status) {
      case 'PRESENTE':
        return 'Presente'

      case 'TARDIA':
        return 'Tardanza'

      case 'AUSENTE':
        return 'Ausente'

      default:
        return status || '--'
    }
  }

const statusClass =
  (status) => {
    switch (status) {
      case 'PRESENTE':
        return 'present'

      case 'TARDIA':
        return 'late'

      case 'AUSENTE':
        return 'absent'

      default:
        return ''
    }
  }

const formatDate =
  (date) => {
    if (!date) {
      return '--'
    }

    const cleanDate =
      String(date)
        .substring(
          0,
          10,
        )

    const parts =
      cleanDate.split(
        '-',
      )

    if (
      parts.length !==
      3
    ) {
      return cleanDate
    }

    return (
      `${parts[2]}/` +
      `${parts[1]}/` +
      parts[0]
    )
  }

const previousPage =
  async () => {
    if (
      pagination.value
        .currentPage <= 1
    ) {
      return
    }

    await loadReport(
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

    await loadReport(
      pagination.value
        .currentPage + 1,
    )
  }

const goBack =
  () => {
    router.push(
      '/docente',
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

    await loadReport()
  },
)
</script>

<template>
  <div class="teacher-layout">

    

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
            Control escolar
          </span>
        </div>

      </div>

      <nav class="menu">

        <RouterLink
          to="/docente"
          class="menu-item"
        >
          <span>
            ⌂
          </span>

          Inicio
        </RouterLink>

        <RouterLink
          to="/docente/asistencia"
          class="menu-item"
        >
          <span>
            ▣
          </span>

          Generar asistencia
        </RouterLink>

        <RouterLink
          to="/docente/reportes"
          class="menu-item"
        >
          <span>
            📊
          </span>

          Reportes
        </RouterLink>

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
          @click="goBack"
        >
          ← Volver
        </button>

        <div class="profile">

          <div class="avatar">
            D
          </div>

          <div>
            <strong>
              Docente
            </strong>

            <span>
              {{ authStore.email }}
            </span>
          </div>

        </div>

      </header>

      <section class="content">

        

        <div class="heading">

          <h1>
            Reportes de asistencia
          </h1>

          <p>
            Consulta los registros almacenados
            en el sistema utilizando los filtros.
          </p>

        </div>

        

        <section class="filters-card">

          <div class="filters-heading">

            <div>
              <h2>
                Filtros
              </h2>

              <p>
                Puedes combinar varios filtros.
              </p>
            </div>

            <span>
              {{
                pagination.total
              }}
              registros encontrados
            </span>

          </div>

          <div class="filters-grid">

            

            <div class="field">

              <label>
                Grado
              </label>

              <select
                v-model="
                  filters.gradeId
                "
                :disabled="
                  loadingCatalogs
                "
              >

                <option value="">
                  Todos los grados
                </option>

                <option
                  v-for="
                    grade in grades
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
                  loadingCatalogs
                "
              >

                <option value="">
                  Todas las secciones
                </option>

                <option
                  v-for="
                    section in sections
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

                <option value="PRESENTE">
                  Presente
                </option>

                <option value="TARDIA">
                  Tardanza
                </option>

                <option value="AUSENTE">
                  Ausente
                </option>

              </select>

            </div>

            

            <div class="field">

              <label>
                Desde
              </label>

              <input
                v-model="
                  filters.dateFrom
                "
                type="date"
              />

            </div>

            

            <div class="field">

              <label>
                Hasta
              </label>

              <input
                v-model="
                  filters.dateTo
                "
                type="date"
              />

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
              :disabled="
                loading
              "
              @click="
                applyFilters
              "
            >
              🔎 Buscar
            </button>

          </div>

        </section>

        

        <div
          v-if="error"
          class="error-box"
        >

          <strong>
            No fue posible consultar
            el reporte
          </strong>

          <span>
            {{ error }}
          </span>

        </div>

        

        <div class="summary-grid">

          <article>

            <div class="summary-icon blue">
              📋
            </div>

            <div>
              <span>
                Total encontrados
              </span>

              <strong>
                {{
                  pagination.total
                }}
              </strong>

              <small>
                Según filtros
              </small>
            </div>

          </article>

          <article>

            <div class="summary-icon green">
              ✓
            </div>

            <div>
              <span>
                Presentes
              </span>

              <strong>
                {{ presentCount }}
              </strong>

              <small>
                Página actual
              </small>
            </div>

          </article>

          <article>

            <div class="summary-icon yellow">
              !
            </div>

            <div>
              <span>
                Tardanzas
              </span>

              <strong>
                {{ lateCount }}
              </strong>

              <small>
                Página actual
              </small>
            </div>

          </article>

          <article>

            <div class="summary-icon red">
              ×
            </div>

            <div>
              <span>
                Ausentes
              </span>

              <strong>
                {{ absentCount }}
              </strong>

              <small>
                Página actual
              </small>
            </div>

          </article>

        </div>

        

        <section class="report-card">

          <div class="report-heading">

            <div>
              <h2>
                Registros de asistencia
              </h2>

              <p>
                Consulta detallada de los registros de asistencia.
              </p>
            </div>

            <button
              type="button"
              class="refresh-button"
              @click="
                loadReport(
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
              Consultando registros...
            </strong>

          </div>

          

          <div
            v-else-if="
              records.length === 0
            "
            class="state"
          >

            <div class="empty-icon">
              📋
            </div>

            <strong>
              No se encontraron registros
            </strong>

            <p>
              Cambia los filtros e intenta
              nuevamente.
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
                    Estudiante
                  </th>

                  <th>
                    Código
                  </th>

                  <th>
                    Grado
                  </th>

                  <th>
                    Sección
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Hora
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Observación
                  </th>
                </tr>

              </thead>

              <tbody>

                <tr
                  v-for="
                    record in records
                  "
                  :key="
                    record.id
                  "
                >

                  <td>
                    <strong>
                      {{
                        studentName(
                          record
                        )
                      }}
                    </strong>
                  </td>

                  <td>
                    {{
                      studentCode(
                        record
                      )
                    }}
                  </td>

                  <td>
                    {{
                      gradeName(
                        record
                      )
                    }}
                  </td>

                  <td>
                    {{
                      sectionName(
                        record
                      )
                    }}
                  </td>

                  <td>
                    {{
                      formatDate(
                        record
                          .fecha_asistencia
                      )
                    }}
                  </td>

                  <td>
                    {{
                      record
                        .hora_entrada ||
                      '--'
                    }}
                  </td>

                  <td>

                    <span
                      class="status"
                      :class="
                        statusClass(
                          record.estado
                        )
                      "
                    >
                      {{
                        statusLabel(
                          record.estado
                        )
                      }}
                    </span>

                  </td>

                  <td class="observation">
                    {{
                      record
                        .observaciones ||
                      '--'
                    }}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

          

          <div
            v-if="
              !loading &&
              pagination.lastPage > 1
            "
            class="pagination"
          >

            <button
              type="button"
              :disabled="
                pagination
                  .currentPage <= 1
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

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.teacher-layout {
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
  background: #e4f1ff;
  color: #176fc9;
  border-radius: 12px;
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
  color: #2478cd;
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
  color: #8997a7;
  font-size: 9px;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: #dfedff;
  color: #176bc5;
  border-radius: 50%;
  font-weight: 800;
}

.content {
  padding: 30px 34px 45px;
}

.heading {
  margin-bottom: 24px;
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

.filters-card,
.report-card {
  margin-bottom: 20px;
  background: white;
  border-radius: 18px;
  box-shadow:
    0 6px 25px
    rgba(39, 77, 120, 0.055);
}

.filters-card {
  padding: 22px;
}

.filters-heading {
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-heading h2 {
  margin: 0;
  font-size: 18px;
}

.filters-heading p {
  margin: 4px 0 0;
  color: #8494a6;
  font-size: 10px;
}

.filters-heading > span {
  padding: 6px 10px;
  background: #e6f2ff;
  color: #2676c4;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.filters-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(130px, 1fr));
  gap: 12px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  color: #526a82;
  font-size: 10px;
  font-weight: 700;
}

.field select,
.field input {
  width: 100%;
  height: 43px;
  padding: 0 11px;
  border: 1px solid #dbe4ed;
  border-radius: 9px;
  background: white;
  color: #415d77;
  outline: none;
}

.field select:focus,
.field input:focus {
  border-color: #2780d8;
}

.filter-actions {
  margin-top: 17px;
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

.primary-button:disabled {
  opacity: 0.6;
}

.error-box {
  margin-bottom: 20px;
  padding: 14px 17px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #ffeaea;
  color: #ba4848;
  border-radius: 11px;
}

.error-box span {
  font-size: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.summary-grid article {
  min-height: 105px;
  padding: 17px;
  display: flex;
  align-items: center;
  gap: 13px;
  background: white;
  border-radius: 15px;
  box-shadow:
    0 6px 22px
    rgba(39, 77, 120, 0.05);
}

.summary-icon {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-weight: 800;
}

.summary-icon.blue {
  background: #e5f2ff;
  color: #2478cd;
}

.summary-icon.green {
  background: #e1f7e9;
  color: #219956;
}

.summary-icon.yellow {
  background: #fff1d5;
  color: #b27c14;
}

.summary-icon.red {
  background: #ffe5e5;
  color: #d34b4b;
}

.summary-grid span,
.summary-grid strong,
.summary-grid small {
  display: block;
}

.summary-grid span {
  color: #75879b;
  font-size: 10px;
}

.summary-grid strong {
  color: #1b3d61;
  font-size: 26px;
}

.summary-grid small {
  color: #98a3b0;
  font-size: 8px;
}

.report-card {
  overflow: hidden;
}

.report-heading {
  padding: 21px 23px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-heading h2 {
  margin: 0;
  font-size: 18px;
}

.report-heading p {
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
  padding: 13px 17px;
  border-top: 1px solid #edf1f5;
  text-align: left;
  font-size: 10px;
  vertical-align: top;
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

td strong {
  color: #294963;
}

.observation {
  min-width: 230px;
  max-width: 330px;
  line-height: 1.45;
}

.status {
  display: inline-block;
  min-width: 78px;
  padding: 5px 8px;
  border-radius: 20px;
  text-align: center;
  font-size: 9px;
  font-weight: 700;
}

.status.present {
  background: #dff7e8;
  color: #219653;
}

.status.late {
  background: #fff1d5;
  color: #ad7814;
}

.status.absent {
  background: #ffe4e4;
  color: #ce4949;
}

.state {
  min-height: 250px;
  padding: 50px 20px;
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
  font-size: 39px;
}

.loader {
  width: 35px;
  height: 35px;
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

@media (max-width: 1100px) {
  .filters-grid {
    grid-template-columns:
      repeat(3, 1fr);
  }

  .summary-grid {
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

  .filters-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    gap: 10px;
    flex-direction: column;
  }
}
</style>