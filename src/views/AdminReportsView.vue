<script setup>
import { csvCell } from '@/utils/attendance'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'

import adminReportService
  from '@/services/adminReportService'

const loading =
  ref(true)

const catalogLoading =
  ref(true)

const exporting =
  ref(false)

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

const filters =
  ref({
    gradoId: '',
    seccionId: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    perPage: 15,
  })

const availableSections =
  computed(() => {
    if (
      !filters.value
        .gradoId
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
              .gradoId,
          ),
      )
  })

const pagePresent =
  computed(
    () =>
      records.value
        .filter(
          (record) =>
            record.estado ===
            'PRESENTE',
        )
        .length,
  )

const pageLate =
  computed(
    () =>
      records.value
        .filter(
          (record) =>
            record.estado ===
            'TARDIA',
        )
        .length,
  )

const pageAbsent =
  computed(
    () =>
      records.value
        .filter(
          (record) =>
            record.estado ===
            'AUSENTE',
        )
        .length,
  )

watch(
  () =>
    filters.value
      .gradoId,

  () => {
    if (
      !filters.value
        .seccionId
    ) {
      return
    }

    const exists =
      availableSections.value
        .some(
          (section) =>
            Number(
              section.id,
            ) ===
            Number(
              filters.value
                .seccionId,
            ),
        )

    if (!exists) {
      filters.value
        .seccionId = ''
    }
  },
)

const loadCatalogs =
  async () => {
    catalogLoading.value =
      true

    try {
      const [
        gradeResult,
        sectionResult,
      ] =
        await Promise.all([
          adminReportService
            .getActiveGrades(),

          adminReportService
            .getActiveSections(),
        ])

      grades.value =
        gradeResult

      sections.value =
        sectionResult
    } catch (
      requestError
    ) {
      console.error(
        'Error cargando catálogos:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible cargar grados y secciones.'
    } finally {
      catalogLoading.value =
        false
    }
  }

const validateDates =
  () => {
    if (
      filters.value
        .fechaDesde &&
      filters.value
        .fechaHasta &&
      filters.value
        .fechaHasta <
        filters.value
          .fechaDesde
    ) {
      error.value =
        'La fecha hasta no puede ser anterior a la fecha desde.'

      return false
    }

    return true
  }

const buildParams =
  (
    page = 1,
    includePerPage = true,
  ) => {
    const params = {
      page,
    }

    if (
      includePerPage
    ) {
      params.per_page =
        Number(
          filters.value
            .perPage,
        )
    }

    if (
      filters.value
        .gradoId
    ) {
      params.grado_id =
        Number(
          filters.value
            .gradoId,
        )
    }

    if (
      filters.value
        .seccionId
    ) {
      params.seccion_id =
        Number(
          filters.value
            .seccionId,
        )
    }

    if (
      filters.value
        .estado
    ) {
      params.estado =
        filters.value
          .estado
    }

    if (
      filters.value
        .fechaDesde
    ) {
      params.fecha_desde =
        filters.value
          .fechaDesde
    }

    if (
      filters.value
        .fechaHasta
    ) {
      params.fecha_hasta =
        filters.value
          .fechaHasta
    }

    return params
  }

const loadReport =
  async (
    page = 1,
  ) => {
    error.value = ''

    if (
      !validateDates()
    ) {
      return
    }

    loading.value =
      true

    try {
      const response =
        await adminReportService
          .getReport(
            buildParams(
              page,
            ),
          )

      records.value =
        response?.data ||
        []

      pagination.value = {
        currentPage:
          response
            ?.meta
            ?.current_page ||
          page,

        lastPage:
          response
            ?.meta
            ?.last_page ||
          1,

        perPage:
          response
            ?.meta
            ?.per_page ||
          Number(
            filters.value
              .perPage,
          ),

        total:
          response
            ?.meta
            ?.total ||
          0,
      }
    } catch (
      requestError
    ) {
      console.error(
        'Error cargando reporte:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible cargar el reporte de asistencias.'
    } finally {
      loading.value =
        false
    }
  }

const applyFilters =
  async () => {
    await loadReport(
      1,
    )
  }

const clearFilters =
  async () => {
    filters.value = {
      gradoId: '',
      seccionId: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
      perPage: 15,
    }

    error.value = ''

    await loadReport(
      1,
    )
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

const gradeName =
  (
    record,
  ) => {
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
  (
    record,
  ) => {
    return (
      record
        ?.estudiante
        ?.seccion
        ?.nombre ||
      '--'
    )
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

const formatTime =
  (
    time,
  ) => {
    if (!time) {
      return '--'
    }

    return String(
      time,
    ).substring(
      0,
      8,
    )
  }

const csvValue = csvCell

const exportCsv =
  async () => {
    error.value = ''

    if (
      !validateDates()
    ) {
      return
    }

    exporting.value =
      true

    try {
      const params =
        buildParams(
          1,
          false,
        )

      delete params.page

      const allRecords =
        await adminReportService
          .getAllReportRecords(
            params,
          )

      if (
        allRecords.length ===
        0
      ) {
        error.value =
          'No hay registros para exportar con los filtros seleccionados.'

        return
      }

      const headers = [
        'Código',
        'Estudiante',
        'Grado',
        'Sección',
        'Fecha',
        'Hora',
        'Estado',
        'Observaciones',
      ]

      const rows =
        allRecords.map(
          (record) => [
            studentCode(
              record,
            ),

            studentName(
              record,
            ),

            gradeName(
              record,
            ),

            sectionName(
              record,
            ),

            formatDate(
              record
                .fecha_asistencia,
            ),

            formatTime(
              record
                .hora_entrada,
            ),

            statusLabel(
              record.estado,
            ),

            record
              .observaciones ||
            '',
          ],
        )

      const csv =
        [
          headers,
          ...rows,
        ]
          .map(
            (row) =>
              row
                .map(
                  csvValue,
                )
                .join(
                  ';',
                ),
          )
          .join(
            '\n',
          )

      const blob =
        new Blob(
          [
            '\ufeff',
            csv,
          ],
          {
            type:
              'text/csv;charset=utf-8;',
          },
        )

      const url =
        URL
          .createObjectURL(
            blob,
          )

      const link =
        document
          .createElement(
            'a',
          )

      const today =
        new Date()
          .toISOString()
          .substring(
            0,
            10,
          )

      link.href =
        url

      link.download =
        `reporte_asistencias_${today}.csv`

      document.body
        .appendChild(
          link,
        )

      link.click()

      link.remove()

      URL
        .revokeObjectURL(
          url,
        )
    } catch (
      requestError
    ) {
      console.error(
        'Error exportando reporte:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible exportar el reporte.'
    } finally {
      exporting.value =
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

const changePerPage =
  async () => {
    await loadReport(
      1,
    )
  }

onMounted(
  async () => {
    await loadCatalogs()

    await loadReport()
  },
)
</script>

<template>
  <div class="reports-page">

    

    <header class="topbar">

      <div>

        <strong>
          Administración
        </strong>

        <span>
          Reportes de asistencia
        </span>

      </div>

    </header>

    

    <section class="content">

      

      <div class="heading">

        <div>

          <h1>
            Reportes de asistencia
          </h1>

          <p>
            Consulta y exporta los
            registros de asistencia de
            los estudiantes.
          </p>

        </div>

        <button
          type="button"
          class="export-button"
          :disabled="
            exporting ||
            loading
          "
          @click="
            exportCsv
          "
        >
          {{
            exporting
              ? 'Exportando...'
              : '⬇ Exportar CSV'
          }}
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

      

      <section class="filters-card">

        <div class="filters-title">

          <div>

            <strong>
              Filtros
            </strong>

            <span>
              Puedes combinar varios filtros.
            </span>

          </div>

        </div>

        <div class="filters-grid">

          

          <div class="field">

            <label>
              Grado
            </label>

            <select
              v-model="
                filters.gradoId
              "
              :disabled="
                catalogLoading
              "
            >

              <option value="">
                Todos los grados
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
                filters.seccionId
              "
              :disabled="
                catalogLoading
              "
            >

              <option value="">
                Todas las secciones
              </option>

              <option
                v-for="
                  section
                  in availableSections
                "
                :key="
                  section.id
                "
                :value="
                  section.id
                "
              >
                {{
                  section.nombre
                }}
                <template
                  v-if="
                    section.grado
                  "
                >
                  -
                  {{
                    section
                      .grado
                      .nombre
                  }}
                </template>
              </option>

            </select>

          </div>

          

          <div class="field">

            <label>
              Estado de asistencia
            </label>

            <select
              v-model="
                filters.estado
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
              Fecha desde
            </label>

            <input
              v-model="
                filters.fechaDesde
              "
              type="date"
            />

          </div>

          

          <div class="field">

            <label>
              Fecha hasta
            </label>

            <input
              v-model="
                filters.fechaHasta
              "
              type="date"
            />

          </div>

          

          <div class="field">

            <label>
              Registros por página
            </label>

            <select
              v-model="
                filters.perPage
              "
              @change="
                changePerPage
              "
            >

              <option
                :value="15"
              >
                15
              </option>

              <option
                :value="25"
              >
                25
              </option>

              <option
                :value="50"
              >
                50
              </option>

              <option
                :value="100"
              >
                100
              </option>

            </select>

          </div>

        </div>

        <div class="filter-actions">

          <button
            type="button"
            class="secondary"
            @click="
              clearFilters
            "
          >
            Limpiar filtros
          </button>

          <button
            type="button"
            class="primary"
            @click="
              applyFilters
            "
          >
            🔎 Generar reporte
          </button>

        </div>

      </section>

      

      <div class="stats-grid">

        <article class="stat-card">

          <div class="stat-icon">
            📋
          </div>

          <div>

            <span>
              Registros encontrados
            </span>

            <strong>
              {{ pagination.total }}
            </strong>

          </div>

        </article>

        <article class="stat-card">

          <div class="stat-icon">
            ✅
          </div>

          <div>

            <span>
              Presentes en esta página
            </span>

            <strong>
              {{ pagePresent }}
            </strong>

          </div>

        </article>

        <article class="stat-card">

          <div class="stat-icon">
            ⏰
          </div>

          <div>

            <span>
              Tardanzas en esta página
            </span>

            <strong>
              {{ pageLate }}
            </strong>

          </div>

        </article>

        <article class="stat-card">

          <div class="stat-icon">
            ✕
          </div>

          <div>

            <span>
              Ausentes en esta página
            </span>

            <strong>
              {{ pageAbsent }}
            </strong>

          </div>

        </article>

      </div>

      

      <section class="report-card">

        <div class="card-heading">

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
            class="refresh"
            :disabled="
              loading
            "
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
            Cargando reporte...
          </strong>

        </div>

        

        <div
          v-else-if="
            records.length === 0
          "
          class="state"
        >

          <div class="empty-icon">
            📊
          </div>

          <strong>
            No se encontraron registros
          </strong>

          <span>
            Prueba con otros filtros.
          </span>

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
                  Fecha
                </th>

                <th>
                  Hora
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Observaciones
                </th>

              </tr>

            </thead>

            <tbody>

              <tr
                v-for="
                  record
                  in records
                "
                :key="
                  record.id
                "
              >

                <td>

                  <span class="student-code">
                    {{
                      studentCode(
                        record
                      )
                    }}
                  </span>

                </td>

                <td>

                  <div class="student">

                    <div class="student-avatar">
                      {{
                        studentName(
                          record
                        )
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </div>

                    <strong>
                      {{
                        studentName(
                          record
                        )
                      }}
                    </strong>

                  </div>

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

                <td>

                  <span class="observations">
                    {{
                      record
                        .observaciones ||
                      '--'
                    }}
                  </span>

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
              pagination.currentPage <=
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
            {{ pagination.currentPage }}
            de
            {{ pagination.lastPage }}
          </span>

          <button
            type="button"
            :disabled="
              pagination.currentPage >=
              pagination.lastPage
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

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.reports-page {
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
  font-size: 13px;
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
  gap: 20px;
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
  font-size: 11px;
}

.export-button {
  min-height: 45px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #218f51;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.export-button:disabled {
  opacity: 0.55;
  cursor: default;
}

.message {
  margin-bottom: 15px;
  padding: 13px 16px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}

.message.error {
  background: #ffeaea;
  color: #c34a4a;
}

.filters-card {
  margin-bottom: 18px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow:
    0 5px 20px
    rgba(39, 77, 120, 0.04);
}

.filters-title {
  margin-bottom: 16px;
}

.filters-title strong,
.filters-title span {
  display: block;
}

.filters-title strong {
  color: #36536c;
}

.filters-title span {
  margin-top: 3px;
  color: #8797a8;
  font-size: 9px;
}

.filters-grid {
  display: grid;
  grid-template-columns:
    repeat(
      3,
      minmax(180px, 1fr)
    );
  gap: 13px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  color: #536b82;
  font-size: 9px;
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
}

.field input:focus,
.field select:focus {
  border-color: #2780d8;
  box-shadow:
    0 0 0 3px
    rgba(39, 128, 216, 0.07);
}

.filter-actions {
  margin-top: 17px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.primary,
.secondary {
  min-height: 41px;
  padding: 0 16px;
  border-radius: 9px;
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

.stats-grid {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  min-height: 100px;
  padding: 17px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 14px;
  box-shadow:
    0 5px 20px
    rgba(39, 77, 120, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: #edf5fd;
  border-radius: 11px;
  font-size: 19px;
}

.stat-card span,
.stat-card strong {
  display: block;
}

.stat-card span {
  color: #7f91a3;
  font-size: 8px;
}

.stat-card strong {
  margin-top: 2px;
  color: #294963;
  font-size: 23px;
}

.report-card {
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
  color: #294963;
  font-size: 18px;
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
  cursor: pointer;
}

.refresh:disabled {
  opacity: 0.5;
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
  padding: 14px 16px;
  border-top: 1px solid #edf1f5;
  text-align: left;
  vertical-align: middle;
  font-size: 10px;
}

th {
  background: #f8fafc;
  color: #7b8c9e;
  font-size: 8px;
  white-space: nowrap;
}

td {
  color: #5b7187;
}

.student-code {
  color: #2676c4;
  font-weight: 700;
}

.student {
  min-width: 170px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.student-avatar {
  width: 33px;
  height: 33px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #e4f1ff;
  color: #2677c8;
  font-weight: 800;
}

.student strong {
  color: #294963;
  font-size: 10px;
}

.status {
  display: inline-block;
  min-width: 76px;
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

.observations {
  display: block;
  min-width: 210px;
  max-width: 350px;
  line-height: 1.45;
}

.state {
  min-height: 280px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  text-align: center;
}

.state strong {
  color: #506980;
}

.state span {
  color: #8997a7;
  font-size: 9px;
}

.empty-icon {
  font-size: 43px;
}

.loader {
  width: 37px;
  height: 37px;
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

.pagination {
  padding: 15px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #edf1f5;
}

.pagination span {
  color: #75879b;
  font-size: 9px;
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
  opacity: 0.4;
  cursor: default;
}

@media (
  max-width: 1100px
) {
  .filters-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns:
      repeat(2, 1fr);
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
  }

  .export-button {
    align-self: flex-start;
  }

  .filters-grid,
  .stats-grid {
    grid-template-columns:
      1fr;
  }
}
</style>
