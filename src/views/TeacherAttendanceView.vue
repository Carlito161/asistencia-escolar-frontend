<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'

import {
  useRoute,
  useRouter,
} from 'vue-router'

import attendanceService
  from '@/services/attendanceService'

import teacherService
  from '@/services/teacherService'

import {
  rebuildBackendQr,
} from '@/utils/qrUtils'

import {
  useAuthStore,
} from '@/stores/auth'

const route =
  useRoute()

const router =
  useRouter()

const authStore =
  useAuthStore()

const loading =
  ref(true)

const loadingQr =
  ref(false)

const error =
  ref('')

const qrError =
  ref('')

const section =
  ref(null)

const students =
  ref([])

const attendanceRecords =
  ref([])

const cleanQr =
  ref('')

const originalQr =
  ref('')

const showOriginal =
  ref(false)

const fullscreenQr =
  ref(false)

const sectionId =
  computed(() => {
    return Number(
      route.query
        .seccion ||
      route.query
        .clase ||
      0,
    )
  })

const today =
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

const presentCount =
  computed(() =>
    attendanceRecords
      .value
      .filter(
        (item) =>
          item.estado ===
          'PRESENTE',
      )
      .length,
  )

const lateCount =
  computed(() =>
    attendanceRecords
      .value
      .filter(
        (item) =>
          item.estado ===
          'TARDIA',
      )
      .length,
  )

const absentCount =
  computed(() =>
    attendanceRecords
      .value
      .filter(
        (item) =>
          item.estado ===
          'AUSENTE',
      )
      .length,
  )

const totalStudents =
  computed(
    () =>
      students
        .value
        .length,
  )

const pendingCount =
  computed(() => {
    const registered =
      new Set(
        attendanceRecords
          .value
          .map(
            (item) =>
              Number(
                item
                  .estudiante_id,
              ),
          ),
      )

    return students
      .value
      .filter(
        (student) =>
          !registered.has(
            Number(
              student.id,
            ),
          ),
      )
      .length
  })

const attendancePercentage =
  computed(() => {
    if (
      totalStudents.value ===
      0
    ) {
      return 0
    }

    return Math.round(
      (
        (
          presentCount.value +
          lateCount.value
        ) /
        totalStudents.value
      ) *
        100,
    )
  })

const studentRows =
  computed(() => {
    return students
      .value
      .map(
        (student) => {
          const record =
            attendanceRecords
              .value
              .find(
                (item) =>
                  Number(
                    item
                      .estudiante_id,
                  ) ===
                  Number(
                    student.id,
                  ),
              )

          if (!record) {
            return {
              id:
                student.id,

              name:
                `${student.nombres} ${student.apellidos}`,

              code:
                student
                  .codigo_estudiante,

              time:
                '--',

              status:
                'PENDIENTE',
            }
          }

          return {
            id:
              student.id,

            name:
              `${student.nombres} ${student.apellidos}`,

            code:
              student
                .codigo_estudiante,

            time:
              record
                .hora_entrada,

            status:
              record.estado,
          }
        },
      )
  })

const selectFirstSection =
  async () => {
    const response =
      await teacherService
        .getSections({
          estado: true,
        })

    const first =
      response?.data?.[0]

    if (!first) {
      error.value =
        'No existen secciones activas.'

      return false
    }

    await router.replace({
      path:
        '/docente/asistencia',

      query: {
        seccion:
          first.id,
      },
    })

    return true
  }

const loadSection =
  async () => {
    loading.value = true
    error.value = ''

    try {

      if (!sectionId.value) {
        await selectFirstSection()

        return
      }

      section.value =
        await teacherService
          .getSection(
            sectionId.value,
          )

      await loadAttendance()

      await generateQr()
    } catch (requestError) {
      console.error(
        'Error cargando sección:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        requestError
          ?.message ||
        'No fue posible cargar la sección.'
    } finally {
      loading.value = false
    }
  }

const loadAttendance =
  async () => {
    if (!sectionId.value) {
      return
    }

    const date =
      today()

    const [
      studentsResponse,
      attendanceResponse,
    ] =
      await Promise.all([
        teacherService
          .getStudentsBySection(
            sectionId.value,
          ),

        attendanceService
          .getAllReport({
            seccion_id:
              sectionId.value,

            fecha_desde:
              date,

            fecha_hasta:
              date,

            per_page: 100,
          }),
      ])

    students.value =
      studentsResponse
        ?.data ?? []

    attendanceRecords.value =
      attendanceResponse
        ?.data ?? []
  }

const generateQr =
  async () => {
    if (!sectionId.value) {
      return
    }

    qrError.value = ''
    cleanQr.value = ''
    originalQr.value = ''

    loadingQr.value = true

    try {
      const response =
        await attendanceService
          .generateQr(
            sectionId.value,
          )

      const backendQr =
        response
          ?.data
          ?.qr_base64 ||
        response
          ?.qr_base64 ||
        response
          ?.data
          ?.data
          ?.qr_base64

      if (!backendQr) {
        throw new Error(
          'No fue posible obtener el código QR.',
        )
      }

      const rebuilt =
        await rebuildBackendQr(
          backendQr,
        )

      originalQr.value =
        rebuilt.originalImage

      cleanQr.value =
        rebuilt.cleanImage
    } catch (requestError) {
      console.error(
        'Error generando QR:',
        requestError,
      )

      qrError.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        requestError
          ?.message ||
        'No fue posible generar el QR.'
    } finally {
      loadingQr.value = false
    }
  }

const refreshAll =
  async () => {
    try {
      await loadAttendance()
    } catch (requestError) {
      console.error(
        requestError,
      )
    }
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

      case 'PENDIENTE':
        return 'Pendiente'

      default:
        return status
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

      case 'PENDIENTE':
        return 'pending'

      default:
        return ''
    }
  }

const goBack =
  () => {
    router.push(
      '/docente',
    )
  }

onMounted(
  async () => {
    authStore.loadSession()

    await loadSection()
  },
)

watch(
  sectionId,

  async (
    newValue,
    oldValue,
  ) => {
    if (
      !newValue ||
      newValue === oldValue
    ) {
      return
    }

    await loadSection()
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
    </aside>

    <main>

      <header class="topbar">

        <button
          type="button"
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

        

        <div
          v-if="loading"
          class="state-card"
        >

          <div class="loader"></div>

          <strong>
            Cargando sección...
          </strong>

        </div>

        

        <div
          v-else-if="error"
          class="state-card"
        >

          <h2>
            No fue posible cargar
            la asistencia
          </h2>

          <p>
            {{ error }}
          </p>

          <button
            @click="loadSection"
          >
            Reintentar
          </button>

        </div>

        <template
          v-else-if="section"
        >

          

          <div class="heading">

            <h1>
              Asistencia -
              {{
                section
                  .grado
                  ?.nombre
              }}
              {{
                section.nombre
              }}
            </h1>

            <p>
              Genera el código QR
              para registrar la asistencia.
            </p>

          </div>

          

          <div class="stats-grid">

            <article>
              <span class="green">
                ✓
              </span>

              <div>
                <small>
                  Presentes
                </small>

                <strong>
                  {{ presentCount }}
                </strong>
              </div>
            </article>

            <article>
              <span class="orange">
                !
              </span>

              <div>
                <small>
                  Tardanzas
                </small>

                <strong>
                  {{ lateCount }}
                </strong>
              </div>
            </article>

            <article>
              <span class="gray">
                …
              </span>

              <div>
                <small>
                  Pendientes
                </small>

                <strong>
                  {{ pendingCount }}
                </strong>
              </div>
            </article>

            <article>
              <span class="blue">
                %
              </span>

              <div>
                <small>
                  Asistencia
                </small>

                <strong>
                  {{
                    attendancePercentage
                  }}%
                </strong>
              </div>
            </article>

          </div>

          

          <section class="qr-card">

            <div class="qr-heading">

              <div>
                <h2>
                  Código QR de asistencia
                </h2>

                <p>
                  Escanea este código para registrar la asistencia.
                </p>
              </div>

              <button
                type="button"
                @click="generateQr"
              >
                ↻ Actualizar QR
              </button>

            </div>

            <div
              v-if="loadingQr"
              class="qr-state"
            >
              Generando código QR...
            </div>

            <div
              v-else-if="qrError"
              class="qr-error"
            >

              <strong>
                No se pudo generar el QR
              </strong>

              <p>
                {{ qrError }}
              </p>

              <button
                @click="generateQr"
              >
                Intentar nuevamente
              </button>

            </div>

            <div
              v-else-if="cleanQr"
              class="qr-layout"
            >

              <div class="qr-wrapper">

                <img
                  :src="
                    showOriginal
                      ? originalQr
                      : cleanQr
                  "
                  alt="Código QR"
                />

              </div>

              <div class="qr-info">

                <span class="ready">
                  ● Listo para escanear
                </span>

                <h3>
                  Sección
                  {{
                    section.nombre
                  }}
                </h3>

                <p>
                  Utiliza la versión
                  optimizada para facilitar
                  el escaneo con webcam.
                </p>

                <button
                  class="primary"
                  @click="
                    fullscreenQr = true
                  "
                >
                  ⛶ Ampliar QR
                </button>

                <button
                  class="secondary"
                  @click="
                    showOriginal =
                      !showOriginal
                  "
                >
                  {{
                    showOriginal
                      ? 'Ver QR optimizado'
                      : 'Ver QR original'
                  }}
                </button>

              </div>

            </div>

          </section>

          

          <section class="students-card">

            <div class="students-heading">

              <div>
                <h2>
                  Estudiantes
                </h2>

                <p>
                  Estado actual de la sección.
                </p>
              </div>

              <button
                @click="refreshAll"
              >
                ↻ Actualizar asistencia
              </button>

            </div>

            <div
              v-if="
                studentRows.length ===
                0
              "
              class="empty"
            >
              Esta sección no tiene
              estudiantes activos.
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
                      student
                      in studentRows
                    "
                    :key="
                      student.id
                    "
                  >

                    <td>
                      <strong>
                        {{ student.name }}
                      </strong>
                    </td>

                    <td>
                      {{ student.code }}
                    </td>

                    <td>
                      {{ student.time }}
                    </td>

                    <td>

                      <span
                        class="status"
                        :class="
                          statusClass(
                            student.status
                          )
                        "
                      >
                        {{
                          statusLabel(
                            student.status
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

    

    <div
      v-if="fullscreenQr"
      class="fullscreen"
      @click.self="
        fullscreenQr = false
      "
    >

      <button
        class="close-fullscreen"
        @click="
          fullscreenQr = false
        "
      >
        ×
      </button>

      <div class="fullscreen-card">

        <h2>
          Código de asistencia
        </h2>

        <p>
          {{
            section
              ?.grado
              ?.nombre
          }}
          -
          {{
            section?.nombre
          }}
        </p>

        <img
          :src="cleanQr"
          alt="QR ampliado"
        />

      </div>

    </div>

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
  color: #176fc8;
  border-radius: 12px;
  font-weight: 800;
}

.brand h2 {
  margin: 0;
  font-size: 18px;
}

.brand span {
  color: #8795a6;
  font-size: 11px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  padding: 13px 15px;
  border-radius: 11px;
  color: #53677f;
  text-decoration: none;
}

.menu-item.router-link-active {
  background: #e4f1ff;
  color: #176ac4;
  font-weight: 700;
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

.topbar > button {
  border: 0;
  background: transparent;
  color: #2678cb;
  cursor: pointer;
}

.profile {
  display: flex;
  align-items: center;
  gap: 9px;
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
  background: #dfedff;
  color: #176ac4;
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
  color: #209956;
  font-size: 11px;
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

.stats-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stats-grid article {
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

.stats-grid article > span {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 800;
}

.green {
  background: #e0f7e9;
  color: #219754;
}

.orange {
  background: #fff1d5;
  color: #b27b13;
}

.gray {
  background: #edf1f5;
  color: #72849a;
}

.blue {
  background: #e4f1ff;
  color: #2479cf;
}

.stats-grid small,
.stats-grid strong {
  display: block;
}

.stats-grid small {
  color: #77899d;
}

.stats-grid strong {
  font-size: 25px;
}

.qr-card,
.students-card {
  margin-bottom: 20px;
  background: white;
  border-radius: 18px;
  box-shadow:
    0 6px 25px
    rgba(39, 77, 120, 0.055);
}

.qr-card {
  padding: 23px;
}

.qr-heading,
.students-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.qr-heading h2,
.students-heading h2 {
  margin: 0;
  font-size: 18px;
}

.qr-heading p,
.students-heading p {
  margin: 4px 0 0;
  color: #8393a5;
  font-size: 10px;
}

.qr-heading > button,
.students-heading > button {
  min-height: 39px;
  padding: 0 14px;
  border: 1px solid #d8e2eb;
  background: white;
  color: #506981;
  border-radius: 9px;
  cursor: pointer;
}

.qr-layout {
  margin-top: 20px;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 35px;
  background: #f6f9fd;
  border-radius: 16px;
}

.qr-wrapper {
  width: 420px;
  height: 420px;
  padding: 16px;
  display: grid;
  place-items: center;
  background: white;
  border-radius: 15px;
}

.qr-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.qr-info {
  width: 230px;
}

.ready {
  color: #219855;
  font-size: 10px;
  font-weight: 700;
}

.qr-info h3 {
  margin: 12px 0 7px;
}

.qr-info p {
  color: #75899d;
  font-size: 11px;
  line-height: 1.5;
}

.primary,
.secondary {
  width: 100%;
  min-height: 43px;
  margin-top: 9px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
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

.qr-state,
.qr-error {
  margin-top: 20px;
  padding: 35px;
  background: #f7fafc;
  border-radius: 13px;
  text-align: center;
}

.qr-error p {
  color: #7e8fa1;
}

.qr-error button {
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  background: #247ede;
  color: white;
  border-radius: 9px;
}

.students-heading {
  padding: 21px 23px;
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
  color: #5a7187;
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
  color: #ce4949;
}

.status.pending {
  background: #edf1f5;
  color: #708296;
}

.empty {
  padding: 40px;
  color: #8795a6;
  text-align: center;
}

.state-card {
  max-width: 600px;
  margin: 70px auto;
  padding: 45px;
  background: white;
  border-radius: 18px;
  text-align: center;
}

.state-card p {
  color: #7e8fa1;
}

.state-card button {
  min-height: 42px;
  padding: 0 16px;
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

.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: rgba(9, 23, 40, 0.9);
}

.close-fullscreen {
  position: fixed;
  top: 20px;
  right: 25px;
  width: 48px;
  height: 48px;
  border: 0;
  background: white;
  border-radius: 50%;
  font-size: 29px;
  cursor: pointer;
}

.fullscreen-card {
  padding: 25px;
  background: white;
  border-radius: 20px;
  text-align: center;
}

.fullscreen-card h2 {
  margin: 0;
}

.fullscreen-card p {
  color: #74869a;
}

.fullscreen-card img {
  width: min(
    75vh,
    800px
  );

  max-width: 80vw;

  object-fit: contain;

  image-rendering: pixelated;
}

@media (max-width: 1050px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .qr-layout {
    flex-direction: column;
  }

  .qr-info {
    width: 100%;
    max-width: 420px;
  }
}

@media (max-width: 760px) {
  .sidebar {
    display: none;
  }

  .content {
    padding: 20px;
  }

  .qr-wrapper {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
