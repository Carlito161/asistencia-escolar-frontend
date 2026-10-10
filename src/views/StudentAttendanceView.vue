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
import SessionLogout from '@/components/SessionLogout.vue'

const router =
  useRouter()

const loading =
  ref(true)

const error =
  ref('')

const records =
  ref([])

const pagination =
  ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  })

const loadHistory =
  async (
    page = 1,
  ) => {
    loading.value = true
    error.value = ''

    try {
      const response =
        await attendanceService
          .getMyHistory({
            page,
            per_page: 15,
          })

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

        total:
          meta?.total ||
          records
            .value.length,

        perPage:
          meta?.per_page ||
          15,
      }
    } catch (requestError) {
      console.error(
        'Error cargando historial:',
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
          'Tu sesión ha expirado. Inicia sesión nuevamente.'

        return
      }

      if (status === 403) {
        error.value =
          message ||
          'No tienes permiso para consultar el historial.'

        return
      }

      if (status === 404) {
        error.value =
          message ||
          'No se encontró un estudiante asociado a tu usuario.'

        return
      }

      error.value =
        message ||
        'No fue posible cargar tu historial.'
    } finally {
      loading.value =
        false
    }
  }

const presentCount =
  computed(() =>
    records.value.filter(
      (item) =>
        item.estado ===
        'PRESENTE',
    ).length,
  )

const lateCount =
  computed(() =>
    records.value.filter(
      (item) =>
        item.estado ===
        'TARDIA',
    ).length,
  )

const absentCount =
  computed(() =>
    records.value.filter(
      (item) =>
        item.estado ===
        'AUSENTE',
    ).length,
  )

const formatDate =
  (date) => {
    if (!date) {
      return '--'
    }

    const parts =
      String(date)
        .substring(0, 10)
        .split('-')

    if (
      parts.length !== 3
    ) {
      return date
    }

    return (
      `${parts[2]}/` +
      `${parts[1]}/` +
      parts[0]
    )
  }

const formatTime =
  (time) => {
    if (!time) {
      return '--'
    }

    return time
  }

const stateLabel =
  (state) => {
    switch (state) {
      case 'PRESENTE':
        return 'Presente'

      case 'TARDIA':
        return 'Tardanza'

      case 'AUSENTE':
        return 'Ausente'

      default:
        return state
    }
  }

const stateClass =
  (state) => {
    switch (state) {
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

const previousPage =
  async () => {
    if (
      pagination.value
        .currentPage <= 1
    ) {
      return
    }

    await loadHistory(
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

    await loadHistory(
      pagination.value
        .currentPage + 1,
    )
  }

const goBack =
  () => {
    router.push(
      '/estudiante',
    )
  }

onMounted(
  async () => {
    await loadHistory()
  },
)
</script>

<template>
  <div class="student-layout">

    <aside class="sidebar">

      <div class="brand">

        <div class="brand-icon">
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

      <nav>

        <RouterLink
          to="/estudiante"
        >
          ⌂ Inicio
        </RouterLink>

        <RouterLink
          to="/estudiante/asistencia"
          class="active"
        >
          ▣ Mi asistencia
        </RouterLink>

      </nav>

      <div class="sidebar-footer">
        📚

        <p>
          Consulta aquí todos
          tus registros.
        </p>
      </div>

    </aside>

    <main>

      <header class="topbar">

        <button
          type="button"
          class="back"
          @click="goBack"
        >
          ← Volver al inicio
        </button>

        <SessionLogout />

      </header>

      <section class="content">

        <div class="heading">

          <span>
            Historial
          </span>

          <h1>
            Mi asistencia
          </h1>

          <p>
            Consulta tu historial de asistencia.
          </p>

        </div>

        

        <div
          v-if="loading"
          class="state-card"
        >

          <div class="loader">
          </div>

          <strong>
            Cargando historial...
          </strong>

        </div>

        

        <div
          v-else-if="error"
          class="
            state-card
            error-card
          "
        >

          <div class="state-icon">
            !
          </div>

          <h2>
            No fue posible cargar
            tu asistencia
          </h2>

          <p>
            {{ error }}
          </p>

          <button
            @click="
              loadHistory()
            "
          >
            Intentar nuevamente
          </button>

        </div>

        <template v-else>

          

          <div class="summary-grid">

            <article>

              <div class="icon green">
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
                  En esta página
                </small>
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
                  {{ lateCount }}
                </strong>

                <small>
                  En esta página
                </small>
              </div>

            </article>

            <article>

              <div class="icon red">
                ×
              </div>

              <div>
                <span>
                  Ausencias
                </span>

                <strong>
                  {{ absentCount }}
                </strong>

                <small>
                  En esta página
                </small>
              </div>

            </article>

            <article>

              <div class="icon blue">
                📋
              </div>

              <div>
                <span>
                  Total registros
                </span>

                <strong>
                  {{
                    pagination.total
                  }}
                </strong>

                <small>
                  Historial completo
                </small>
              </div>

            </article>

          </div>

          

          <section class="records-card">

            <div class="card-header">

              <div>

                <h2>
                  Registros de asistencia
                </h2>

                <p>
                  Más recientes primero.
                </p>

              </div>

              <button
                type="button"
                class="refresh"
                @click="
                  loadHistory(
                    pagination
                      .currentPage
                  )
                "
              >
                ↻ Actualizar
              </button>

            </div>

            <div
              v-if="
                records.length ===
                0
              "
              class="empty"
            >

              <span>
                📋
              </span>

              <strong>
                No hay registros
              </strong>

              <p>
                Tus asistencias aparecerán
                aquí cuando sean registradas.
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
                      record
                      in records
                    "
                    :key="record.id"
                  >

                    <td>
                      <strong>
                        {{
                          formatDate(
                            record
                              .fecha_asistencia
                          )
                        }}
                      </strong>
                    </td>

                    <td>
                      {{
                        formatTime(
                          record
                            .hora_entrada
                        )
                      }}
                    </td>

                    <td>

                      <span
                        class="status"
                        :class="
                          stateClass(
                            record.estado
                          )
                        "
                      >
                        {{
                          stateLabel(
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
                pagination.lastPage >
                1
              "
              class="pagination"
            >

              <button
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

        </template>

      </section>

    </main>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.student-layout {
  min-height: 100vh;

  display: flex;

  background: #f5f8fc;

  color: #183551;
}

.sidebar {
  width: 250px;

  min-height: 100vh;

  padding: 28px 18px;

  display: flex;

  flex-direction: column;

  background: white;

  border-right:
    1px solid #e5edf5;
}

.brand {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 43px;
}

.brand-icon {
  width: 45px;

  height: 45px;

  display: grid;

  place-items: center;

  background: #e5f2ff;

  color: #1873ce;

  border-radius: 12px;

  font-weight: 800;
}

.brand h2 {
  margin: 0;

  font-size: 18px;
}

.brand span {
  color: #8493a5;

  font-size: 11px;
}

.sidebar nav {
  display: flex;

  flex-direction: column;

  gap: 8px;
}

.sidebar nav a {
  padding:
    13px 15px;

  color: #536880;

  border-radius: 11px;

  text-decoration: none;
}

.sidebar nav a.active {
  background: #e4f1ff;

  color: #176ac4;

  font-weight: 700;
}

.sidebar-footer {
  margin-top: auto;

  padding: 18px;

  background: #f3f8fd;

  border-radius: 14px;

  text-align: center;

  font-size: 38px;
}

.sidebar-footer p {
  color: #8192a5;

  font-size: 10px;

  line-height: 1.5;
}

main {
  flex: 1;

  min-width: 0;
}

.topbar {
  height: 76px;

  padding:
    0 34px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  background: white;

  border-bottom:
    1px solid #eaf0f5;
}

.back {
  border: 0;

  background: transparent;

  color: #2678cb;

  cursor: pointer;
}

.backend-badge {
  padding:
    7px 11px;

  background: #e1f8eb;

  color: #209751;

  border-radius: 20px;

  font-size: 10px;

  font-weight: 700;
}

.content {
  padding:
    30px 34px 45px;
}

.heading {
  margin-bottom: 24px;
}

.heading > span {
  color: #267acd;

  font-size: 11px;

  font-weight: 700;
}

.heading h1 {
  margin:
    4px 0;

  color: #12305a;

  font-size: 35px;
}

.heading p {
  margin: 0;

  color: #74879b;
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
  width: 47px;

  height: 47px;

  flex-shrink: 0;

  display: grid;

  place-items: center;

  border-radius: 12px;

  font-weight: 800;
}

.icon.green {
  background: #e2f8eb;

  color: #21a35a;
}

.icon.yellow {
  background: #fff2d8;

  color: #b98018;
}

.icon.red {
  background: #ffe5e5;

  color: #d44d4d;
}

.icon.blue {
  background: #e4f1ff;

  color: #2277cc;
}

.summary-grid span,
.summary-grid strong,
.summary-grid small {
  display: block;
}

.summary-grid span {
  color: #74879b;

  font-size: 10px;
}

.summary-grid strong {
  color: #1c3e61;

  font-size: 25px;
}

.summary-grid small {
  color: #98a3b0;

  font-size: 8px;
}

.records-card {
  overflow: hidden;

  background: white;

  border-radius: 18px;

  box-shadow:
    0 6px 25px
    rgba(39, 77, 120, 0.06);
}

.card-header {
  padding: 21px 23px;

  display: flex;

  justify-content: space-between;

  align-items: center;
}

.card-header h2 {
  margin: 0;

  color: #17395d;

  font-size: 18px;
}

.card-header p {
  margin:
    4px 0 0;

  color: #8695a6;

  font-size: 10px;
}

.refresh {
  min-height: 39px;

  padding:
    0 14px;

  border:
    1px solid #d8e3ec;

  background: white;

  color: #557089;

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
  padding:
    15px 22px;

  border-top:
    1px solid #edf1f5;

  text-align: left;

  font-size: 11px;
}

th {
  background: #f8fafc;

  color: #7a8b9e;

  font-size: 10px;
}

td {
  color: #597087;
}

td strong {
  color: #294b68;
}

.observation {
  max-width: 440px;

  line-height: 1.5;
}

.status {
  display: inline-block;

  min-width: 82px;

  padding:
    5px 9px;

  border-radius: 20px;

  text-align: center;

  font-size: 9px;

  font-weight: 700;
}

.status.present {
  background: #e0f7e9;

  color: #209551;
}

.status.late {
  background: #fff1d5;

  color: #ad7812;
}

.status.absent {
  background: #ffe4e4;

  color: #ce4949;
}

.pagination {
  padding:
    16px 22px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  border-top:
    1px solid #edf1f5;
}

.pagination span {
  color: #72849a;

  font-size: 10px;
}

.pagination button {
  min-height: 36px;

  padding:
    0 13px;

  border:
    1px solid #d8e2eb;

  background: white;

  color: #49647d;

  border-radius: 8px;

  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.45;

  cursor: default;
}

.state-card {
  max-width: 600px;

  margin:
    70px auto;

  padding: 45px;

  background: white;

  border-radius: 18px;

  text-align: center;
}

.loader {
  width: 38px;

  height: 38px;

  margin:
    0 auto 17px;

  border:
    3px solid #dbe7f1;

  border-top-color:
    #267fda;

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

.state-icon {
  width: 64px;

  height: 64px;

  margin:
    0 auto 15px;

  display: grid;

  place-items: center;

  background: #ffe6e6;

  color: #d64d4d;

  border-radius: 50%;

  font-size: 28px;

  font-weight: 800;
}

.error-card p {
  color: #7f8fa1;
}

.error-card button {
  min-height: 43px;

  padding:
    0 17px;

  border: 0;

  background: #247ede;

  color: white;

  border-radius: 10px;

  cursor: pointer;
}

.empty {
  padding:
    55px 20px;

  text-align: center;
}

.empty > span {
  display: block;

  font-size: 43px;
}

.empty strong {
  color: #506980;
}

.empty p {
  color: #8997a7;

  font-size: 11px;
}

@media (
  max-width: 1000px
) {
  .summary-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
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

  .topbar {
    padding:
      0 20px;
  }
}

@media (
  max-width: 520px
) {
  .summary-grid {
    grid-template-columns:
      1fr;
  }
}
</style>
