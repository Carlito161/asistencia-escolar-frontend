<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

import adminService
  from '@/services/adminService'

const router =
  useRouter()

const loading =
  ref(true)

const error =
  ref('')

const dashboard =
  ref({
    date: '',
    students: 0,
    grades: 0,
    sections: 0,
    attendanceToday: 0,
    present: 0,
    late: 0,
    absent: 0,
    recent: [],
  })

const presentPercentage =
  computed(() => {
    if (
      !dashboard.value
        .attendanceToday
    ) {
      return 0
    }

    return Math.round(
      dashboard.value.present /
      dashboard.value.attendanceToday *
      100,
    )
  })

const latePercentage =
  computed(() => {
    if (
      !dashboard.value
        .attendanceToday
    ) {
      return 0
    }

    return Math.round(
      dashboard.value.late /
      dashboard.value.attendanceToday *
      100,
    )
  })

const absentPercentage =
  computed(() => {
    if (
      !dashboard.value
        .attendanceToday
    ) {
      return 0
    }

    return Math.round(
      dashboard.value.absent /
      dashboard.value.attendanceToday *
      100,
    )
  })

const loadDashboard =
  async () => {
    loading.value =
      true

    error.value = ''

    try {
      dashboard.value =
        await adminService
          .getDashboard()
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
        'No fue posible cargar el panel administrativo.'
    } finally {
      loading.value =
        false
    }
  }

const statusLabel =
  (
    status,
  ) => {
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
  (
    status,
  ) => {
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

const studentName =
  (
    record,
  ) => {
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
  (
    record,
  ) => {
    return (
      record
        ?.estudiante
        ?.codigo_estudiante ||
      '--'
    )
  }

const studentSection =
  (
    record,
  ) => {
    const section =
      record
        ?.estudiante
        ?.seccion

    if (!section) {
      return '--'
    }

    const grade =
      section
        ?.grado
        ?.nombre

    if (
      grade &&
      section.nombre
    ) {
      return (
        `${grade} - ` +
        section.nombre
      )
    }

    return (
      grade ||
      section.nombre ||
      '--'
    )
  }

const formatDate =
  (
    date,
  ) => {
    if (!date) {
      return '--'
    }

    const value =
      String(
        date,
      ).substring(
        0,
        10,
      )

    const parts =
      value.split(
        '-',
      )

    if (
      parts.length !== 3
    ) {
      return value
    }

    return (
      `${parts[2]}/` +
      `${parts[1]}/` +
      parts[0]
    )
  }

const goStudents =
  () =>
    router.push(
      '/admin/estudiantes',
    )

const goRoles =
  () =>
    router.push(
      '/admin/roles',
    )

const goGrades =
  () =>
    router.push(
      '/admin/grados',
    )

const goSections =
  () =>
    router.push(
      '/admin/secciones',
    )

const goReports =
  () =>
    router.push(
      '/admin/reportes',
    )

onMounted(
  async () => {
    await loadDashboard()
  },
)
</script>

<template>
  <div class="admin-dashboard">

    <header class="topbar">

      <div>

        <strong>
          Administración
        </strong>

        <span>
          Panel principal
        </span>

      </div>

    </header>

    <section class="content">

      <div class="heading">

        <div>

          <h1>
            Panel de administración
          </h1>

          <p>
            Resumen general del sistema
            de asistencia escolar.
          </p>

        </div>

        <button
          type="button"
          class="refresh"
          :disabled="
            loading
          "
          @click="
            loadDashboard
          "
        >
          ↻ Actualizar
        </button>

      </div>

      <div
        v-if="error"
        class="
          message
          error
        "
      >
        ! {{ error }}
      </div>

      <div
        v-if="loading"
        class="loading-card"
      >

        <div class="loader">
        </div>

        <strong>
          Cargando información...
        </strong>

      </div>

      <template v-else>

        

        <div class="stats-grid">

          <article
            class="stat-card clickable"
            @click="
              goStudents
            "
          >

            <div class="stat-icon">
              🎒
            </div>

            <div>

              <span>
                Estudiantes activos
              </span>

              <strong>
                {{ dashboard.students }}
              </strong>

            </div>

          </article>

          <article
            class="stat-card clickable"
            @click="
              goGrades
            "
          >

            <div class="stat-icon">
              🎓
            </div>

            <div>

              <span>
                Grados activos
              </span>

              <strong>
                {{ dashboard.grades }}
              </strong>

            </div>

          </article>

          <article
            class="stat-card clickable"
            @click="
              goSections
            "
          >

            <div class="stat-icon">
              🏫
            </div>

            <div>

              <span>
                Secciones activas
              </span>

              <strong>
                {{ dashboard.sections }}
              </strong>

            </div>

          </article>

          <article
            class="stat-card clickable"
            @click="
              goReports
            "
          >

            <div class="stat-icon">
              📋
            </div>

            <div>

              <span>
                Asistencias hoy
              </span>

              <strong>
                {{
                  dashboard
                    .attendanceToday
                }}
              </strong>

            </div>

          </article>

        </div>

        

        <div class="dashboard-grid">

          

          <section class="attendance-card">

            <div class="card-header">

              <div>

                <span class="label">
                  Hoy
                </span>

                <h2>
                  Resumen de asistencia
                </h2>

              </div>

              <button
                type="button"
                class="small-link"
                @click="
                  goReports
                "
              >
                Ver reportes →
              </button>

            </div>

            <div class="attendance-row">

              <span>
                Presente
              </span>

              <strong>
                {{ dashboard.present }}
                <small>
                  {{ presentPercentage }}%
                </small>
              </strong>

            </div>

            <div class="progress">

              <div
                class="present-bar"
                :style="{
                  width:
                    `${presentPercentage}%`,
                }"
              >
              </div>

            </div>

            <div class="attendance-row">

              <span>
                Tardanza
              </span>

              <strong>
                {{ dashboard.late }}
                <small>
                  {{ latePercentage }}%
                </small>
              </strong>

            </div>

            <div class="progress">

              <div
                class="late-bar"
                :style="{
                  width:
                    `${latePercentage}%`,
                }"
              >
              </div>

            </div>

            <div class="attendance-row">

              <span>
                Ausente
              </span>

              <strong>
                {{ dashboard.absent }}
                <small>
                  {{ absentPercentage }}%
                </small>
              </strong>

            </div>

            <div class="progress">

              <div
                class="absent-bar"
                :style="{
                  width:
                    `${absentPercentage}%`,
                }"
              >
              </div>

            </div>

          </section>

          

          <section class="quick-card">

            <span class="label">
              Administración
            </span>

            <h2>
              Accesos rápidos
            </h2>

            <button
              type="button"
              class="quick-option"
              @click="
                goStudents
              "
            >
              <span>
                🎒
              </span>

              <div>
                <strong>
                  Estudiantes
                </strong>

                <small>
                  Administrar alumnos
                </small>
              </div>

              →
            </button>

            <button
              type="button"
              class="quick-option"
              @click="
                goRoles
              "
            >
              <span>
                🔐
              </span>

              <div>
                <strong>
                  Roles y permisos
                </strong>

                <small>
                  Configuración de acceso
                </small>
              </div>

              →
            </button>

            <button
              type="button"
              class="quick-option"
              @click="
                goGrades
              "
            >
              <span>
                🎓
              </span>

              <div>
                <strong>
                  Grados
                </strong>

                <small>
                  Gestionar grados
                </small>
              </div>

              →
            </button>

            <button
              type="button"
              class="quick-option"
              @click="
                goSections
              "
            >
              <span>
                🏫
              </span>

              <div>
                <strong>
                  Secciones
                </strong>

                <small>
                  Gestionar secciones
                </small>
              </div>

              →
            </button>

            <button
              type="button"
              class="quick-option"
              @click="
                goReports
              "
            >
              <span>
                📊
              </span>

              <div>
                <strong>
                  Reportes
                </strong>

                <small>
                  Consultar asistencias
                </small>
              </div>

              →
            </button>

          </section>

        </div>

        

        <section class="recent-card">

          <div class="card-header">

            <div>

              <span class="label">
                Actividad
              </span>

              <h2>
                Asistencias recientes
              </h2>

            </div>

            <button
              type="button"
              class="small-link"
              @click="
                goReports
              "
            >
              Ver todas →
            </button>

          </div>

          <div
            v-if="
              dashboard
                .recent
                .length === 0
            "
            class="empty"
          >
            No hay asistencias
            registradas hoy.
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
                    Grado / Sección
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

                </tr>

              </thead>

              <tbody>

                <tr
                  v-for="
                    record
                    in dashboard.recent
                  "
                  :key="
                    record.id
                  "
                >

                  <td>
                    {{
                      studentCode(
                        record
                      )
                    }}
                  </td>

                  <td>
                    {{
                      studentName(
                        record
                      )
                    }}
                  </td>

                  <td>
                    {{
                      studentSection(
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

                </tr>

              </tbody>

            </table>

          </div>

        </section>

      </template>

    </section>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-dashboard {
  min-height: 100vh;
  background: #f5f8fc;
  color: #183550;
}

.topbar {
  height: 76px;
  padding: 0 34px;
  display: flex;
  align-items: center;
  background: white;
  border-bottom: 1px solid #eaf0f5;
}

.topbar strong,
.topbar span {
  display: block;
}

.topbar strong {
  color: #294963;
}

.topbar span {
  margin-top: 3px;
  color: #8998a8;
  font-size: 9px;
}

.content {
  padding: 30px 34px 45px;
}

.heading {
  margin-bottom: 22px;
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

.refresh {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #d7e1ea;
  background: white;
  color: #526980;
  border-radius: 9px;
  cursor: pointer;
}

.stats-grid {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  min-height: 104px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 13px;
  background: white;
  border-radius: 15px;
  box-shadow:
    0 5px 20px
    rgba(39, 77, 120, 0.04);
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  transform:
    translateY(-2px);
}

.stat-icon {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  background: #edf5fd;
  border-radius: 11px;
  font-size: 20px;
}

.stat-card span,
.stat-card strong {
  display: block;
}

.stat-card span {
  color: #8192a3;
  font-size: 9px;
}

.stat-card strong {
  margin-top: 3px;
  color: #294963;
  font-size: 25px;
}

.dashboard-grid {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns:
    1.35fr 0.65fr;
  gap: 18px;
}

.attendance-card,
.quick-card,
.recent-card {
  padding: 21px;
  background: white;
  border-radius: 17px;
  box-shadow:
    0 5px 20px
    rgba(39, 77, 120, 0.04);
}

.card-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #2678ca;
  font-size: 9px;
  font-weight: 700;
}

h2 {
  margin: 4px 0 0;
  color: #294963;
  font-size: 18px;
}

.small-link {
  border: 0;
  background: transparent;
  color: #2476c8;
  font-size: 9px;
  cursor: pointer;
}

.attendance-row {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  color: #536a82;
  font-size: 10px;
}

.attendance-row small {
  margin-left: 4px;
  color: #8a99a9;
}

.progress {
  height: 8px;
  margin-top: 7px;
  overflow: hidden;
  background: #edf2f6;
  border-radius: 20px;
}

.progress div {
  height: 100%;
}

.present-bar {
  background: #29ba67;
}

.late-bar {
  background: #f2ac2c;
}

.absent-bar {
  background: #eb5858;
}

.quick-option {
  width: 100%;
  min-height: 57px;
  margin-top: 9px;
  padding: 9px 11px;
  display: grid;
  grid-template-columns:
    35px 1fr auto;
  gap: 8px;
  align-items: center;
  border: 1px solid #e2eaf1;
  background: #f9fbfd;
  border-radius: 10px;
  color: #526980;
  text-align: left;
  cursor: pointer;
}

.quick-option:hover {
  background: #f1f7fd;
}

.quick-option strong,
.quick-option small {
  display: block;
}

.quick-option strong {
  color: #36536c;
  font-size: 9px;
}

.quick-option small {
  margin-top: 2px;
  color: #8797a8;
  font-size: 7px;
}

.recent-card {
  padding: 0;
  overflow: hidden;
}

.recent-card .card-header {
  padding: 20px;
  margin: 0;
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
  padding: 13px 16px;
  border-top: 1px solid #edf1f5;
  text-align: left;
  font-size: 9px;
}

th {
  background: #f8fafc;
  color: #7b8c9e;
}

.status {
  display: inline-block;
  min-width: 74px;
  padding: 5px 8px;
  border-radius: 20px;
  text-align: center;
  font-size: 8px;
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

.empty {
  padding: 45px;
  text-align: center;
  color: #8494a6;
}

.message.error {
  margin-bottom: 15px;
  padding: 13px;
  background: #ffeaea;
  color: #c34a4a;
  border-radius: 10px;
}

.loading-card {
  min-height: 280px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  background: white;
  border-radius: 18px;
}

.loader {
  width: 38px;
  height: 38px;
  border: 3px solid #dbe6ef;
  border-top-color: #247ede;
  border-radius: 50%;
  animation:
    spin 0.8s
    linear infinite;
}

@keyframes spin {
  to {
    transform:
      rotate(360deg);
  }
}

@media (
  max-width: 1100px
) {
  .stats-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns:
      1fr;
  }
}

@media (
  max-width: 760px
) {
  .content {
    padding: 20px;
  }

  .heading {
    align-items: stretch;
    flex-direction: column;
    gap: 15px;
  }

  .stats-grid {
    grid-template-columns:
      1fr;
  }
}
</style>