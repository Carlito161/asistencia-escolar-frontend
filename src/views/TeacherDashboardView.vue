<script setup>
import {
  computed,
  onMounted,
  ref,
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

const error =
  ref('')

const sections =
  ref([])

const recentRecords =
  ref([])

const statistics =
  ref({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
  })

const today = () => {
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

  return `${year}-${month}-${day}`
}

const attendancePercentage =
  computed(() => {
    if (
      statistics.value
        .total === 0
    ) {
      return 0
    }

    return Math.round(
      (
        (
          statistics.value
            .present +
          statistics.value
            .late
        ) /
        statistics.value
          .total
      ) *
        100,
    )
  })

const loadDashboard =
  async () => {
    loading.value = true
    error.value = ''

    try {
      const date =
        today()

      const [
        sectionsResponse,
        allResponse,
        presentResponse,
        lateResponse,
        absentResponse,
      ] =
        await Promise.all([

          teacherService
            .getSections({
              estado: true,
            }),

          attendanceService
            .getReport({
              fecha_desde:
                date,

              fecha_hasta:
                date,

              per_page: 8,
            }),

          attendanceService
            .getReport({
              fecha_desde:
                date,

              fecha_hasta:
                date,

              estado:
                'PRESENTE',

              per_page: 1,
            }),

          attendanceService
            .getReport({
              fecha_desde:
                date,

              fecha_hasta:
                date,

              estado:
                'TARDIA',

              per_page: 1,
            }),

          attendanceService
            .getReport({
              fecha_desde:
                date,

              fecha_hasta:
                date,

              estado:
                'AUSENTE',

              per_page: 1,
            }),
        ])

      sections.value =
        sectionsResponse
          ?.data ?? []

      recentRecords.value =
        allResponse
          ?.data ?? []

      statistics.value = {
        total:
          allResponse
            ?.meta
            ?.total ?? 0,

        present:
          presentResponse
            ?.meta
            ?.total ?? 0,

        late:
          lateResponse
            ?.meta
            ?.total ?? 0,

        absent:
          absentResponse
            ?.meta
            ?.total ?? 0,
      }
    } catch (requestError) {
      console.error(
        'Error dashboard docente:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        requestError
          ?.message ||
        'No fue posible cargar la información.'
    } finally {
      loading.value = false
    }
  }

const openAttendance =
  (section) => {
    router.push({
      path:
        '/docente/asistencia',

      query: {
        seccion:
          section.id,
      },
    })
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

const studentGrade =
  (record) => {
    const section =
      record
        ?.estudiante
        ?.seccion

    const grade =
      section
        ?.grado
        ?.nombre

    const sectionName =
      section
        ?.nombre

    if (
      grade &&
      sectionName
    ) {
      return (
        `${grade} - ` +
        `${sectionName}`
      )
    }

    return (
      grade ||
      sectionName ||
      '--'
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

    await loadDashboard()
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
    <span>⌂</span>
    Inicio
  </RouterLink>

  <RouterLink
    to="/docente/asistencia"
    class="menu-item"
  >
    <span>▣</span>
    Generar asistencia
  </RouterLink>

  <RouterLink
    to="/docente/reportes"
    class="menu-item"
  >
    <span>📊</span>
    Reportes
  </RouterLink>

</nav>
      <button
        class="logout-button"
        type="button"
        @click="logout"
      >
        ↪ Cerrar sesión
      </button>

    </aside>

    

    <main>

      <header class="topbar">

        <div>
          <strong>
            Panel docente
          </strong>

        </div>

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
            ¡Hola, Docente! 👋
          </h1>

          <p>
            Gestiona la asistencia
            de las secciones disponibles.
          </p>

        </div>

        

        <div
          v-if="loading"
          class="state-card"
        >

          <div class="loader"></div>

          <strong>
            Cargando información...
          </strong>

        </div>

        

        <div
          v-else-if="error"
          class="state-card"
        >

          <h2>
            No fue posible cargar
            el panel
          </h2>

          <p>
            {{ error }}
          </p>

          <button
            @click="loadDashboard"
          >
            Reintentar
          </button>

        </div>

        <template v-else>

          

          <div class="summary-grid">

            <article>

              <div class="icon blue">
                ✓
              </div>

              <div>
                <span>
                  Presentes hoy
                </span>

                <strong>
                  {{
                    statistics.present
                  }}
                </strong>
              </div>

            </article>

            <article>

              <div class="icon yellow">
                !
              </div>

              <div>
                <span>
                  Tardanzas
                </span>

                <strong>
                  {{
                    statistics.late
                  }}
                </strong>
              </div>

            </article>

            <article>

              <div class="icon red">
                ×
              </div>

              <div>
                <span>
                  Ausentes
                </span>

                <strong>
                  {{
                    statistics.absent
                  }}
                </strong>
              </div>

            </article>

            <article>

              <div class="icon green">
                %
              </div>

              <div>
                <span>
                  Asistencia
                </span>

                <strong>
                  {{
                    attendancePercentage
                  }}%
                </strong>
              </div>

            </article>

          </div>

          

          <section class="sections-card">

            <div class="card-heading">

              <div>
                <h2>
                  Secciones disponibles
                </h2>

                <p>
                  Selecciona una sección
                  para generar su QR.
                </p>
              </div>

              <span>
                {{
                  sections.length
                }}
                secciones
              </span>

            </div>

            <div
              v-if="
                sections.length ===
                0
              "
              class="empty"
            >
              No existen secciones
              activas disponibles.
            </div>

            <div
              v-else
              class="section-list"
            >

              <article
                v-for="
                  section
                  in sections
                "
                :key="
                  section.id
                "
                class="section-item"
              >

                <div class="section-icon">
                  📚
                </div>

                <div class="section-info">

                  <strong>
                    {{
                      section
                        .grado
                        ?.nombre ||
                      'Grado'
                    }}
                  </strong>

                  <span>
                    Sección
                    {{
                      section.nombre
                    }}
                  </span>

                </div>

                <span class="active-badge">
                  Activa
                </span>

                <button
                  type="button"
                  @click="
                    openAttendance(
                      section
                    )
                  "
                >
                  Generar QR
                </button>

              </article>

            </div>

          </section>

          

          <section class="records-card">

            <div class="card-heading">

              <div>
                <h2>
                  Últimos registros
                </h2>

                <p>
                  Asistencias registradas hoy.
                </p>
              </div>

              <button
                class="refresh-button"
                @click="loadDashboard"
              >
                ↻ Actualizar
              </button>

            </div>

            <div
              v-if="
                recentRecords.length ===
                0
              "
              class="empty"
            >
              No existen registros
              para hoy.
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
                      Grado / Sección
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
                      in recentRecords
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
                        studentGrade(
                          record
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
  border-right: 1px solid #e4edf5;
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
  color: #1672cf;
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

.topbar strong,
.topbar span {
  display: block;
}

.topbar span {
  color: #8897a8;
  font-size: 10px;
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
  background: #dfedff;
  color: #176bc5;
  border-radius: 50%;
  font-weight: 800;
}

.content {
  padding: 30px 34px 45px;
}

.heading {
  margin-bottom: 25px;
}

.connected {
  color: #219956;
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

.icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 800;
}

.blue {
  background: #e4f1ff;
  color: #2478cf;
}

.yellow {
  background: #fff1d8;
  color: #b67e14;
}

.red {
  background: #ffe5e5;
  color: #d34b4b;
}

.green {
  background: #e1f7e9;
  color: #219956;
}

.summary-grid span,
.summary-grid strong {
  display: block;
}

.summary-grid span {
  color: #75879b;
  font-size: 10px;
}

.summary-grid strong {
  color: #1b3d61;
  font-size: 27px;
}

.sections-card,
.records-card {
  margin-bottom: 20px;
  overflow: hidden;
  background: white;
  border-radius: 18px;
  box-shadow:
    0 6px 25px
    rgba(39, 77, 120, 0.055);
}

.sections-card {
  padding: 23px;
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 18px;
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

.card-heading > span {
  color: #2679cc;
  font-size: 10px;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.section-item {
  min-height: 89px;
  padding: 15px;
  display: grid;
  grid-template-columns:
    50px 1fr auto auto;
  gap: 15px;
  align-items: center;
  background: #f8fbfe;
  border: 1px solid #e6edf4;
  border-radius: 13px;
}

.section-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background: #e7f2ff;
  border-radius: 12px;
  font-size: 21px;
}

.section-info strong,
.section-info span {
  display: block;
}

.section-info strong {
  color: #284a68;
}

.section-info span {
  margin-top: 4px;
  color: #8091a4;
  font-size: 10px;
}

.active-badge {
  padding: 6px 9px;
  background: #e2f8eb;
  color: #229a57;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.section-item button {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  background: #247ede;
  color: white;
  border-radius: 9px;
  font-weight: 700;
  cursor: pointer;
}

.records-card .card-heading {
  margin: 0;
  padding: 21px 23px;
}

.refresh-button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid #d7e2eb;
  background: white;
  color: #526a81;
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
  padding: 14px 22px;
  border-top: 1px solid #edf1f5;
  text-align: left;
  font-size: 11px;
}

th {
  background: #f8fafc;
  color: #7b8c9e;
  font-size: 10px;
}

td {
  color: #5c7187;
}

td strong {
  color: #294963;
}

.status {
  display: inline-block;
  min-width: 80px;
  padding: 5px 9px;
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
  color: #cd4949;
}

.empty {
  padding: 35px;
  color: #8595a6;
  text-align: center;
  font-size: 11px;
}

.state-card {
  max-width: 580px;
  margin: 70px auto;
  padding: 45px;
  background: white;
  border-radius: 18px;
  text-align: center;
}

.state-card button {
  min-height: 42px;
  padding: 0 17px;
  border: 0;
  background: #247ede;
  color: white;
  border-radius: 9px;
}

.loader {
  width: 38px;
  height: 38px;
  margin: 0 auto 15px;
  border: 3px solid #dbe6ef;
  border-top-color: #247ede;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1050px) {
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

  .section-item {
    grid-template-columns:
      50px 1fr;
  }

  .active-badge,
  .section-item button {
    grid-column: 2;
  }
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>