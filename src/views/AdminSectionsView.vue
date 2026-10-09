<script setup>
import {
  onMounted,
  reactive,
  ref,
} from 'vue'

import sectionService
  from '@/services/sectionService'

import attendanceService
  from '@/services/attendanceService'

const loading =
  ref(true)

const catalogLoading =
  ref(true)

const saving =
  ref(false)

const error =
  ref('')

const success =
  ref('')

const sections =
  ref([])

const grades =
  ref([])

const scheduleChecks =
  reactive({})

const pagination =
  ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  })

const filters =
  ref({
    gradeId: '',
    status: 'true',
  })

const showModal =
  ref(false)

const mode =
  ref('create')

const editingId =
  ref(null)

const fieldErrors =
  ref({})

const form =
  ref({
    nombre: '',
    grado_id: '',
    estado: true,
  })

const loadGrades =
  async () => {
    catalogLoading.value =
      true

    try {
      grades.value =
        await sectionService
          .getActiveGrades()
    } catch (
      requestError
    ) {
      console.error(
        'Error cargando grados:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible cargar los grados.'
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
        .status !== ''
    ) {
      params.estado =
        filters.value
          .status
    }

    return params
  }

const loadSections =
  async (
    page = 1,
  ) => {
    loading.value =
      true

    error.value = ''

    try {
      const response =
        await sectionService
          .getSections(
            buildParams(
              page,
            ),
          )

      sections.value =
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

        total:
          response
            ?.meta
            ?.total ||
          0,
      }

      Object.keys(
        scheduleChecks,
      ).forEach(
        (key) => {
          delete scheduleChecks[
            key
          ]
        },
      )
    } catch (
      requestError
    ) {
      console.error(
        'Error cargando secciones:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible cargar las secciones.'
    } finally {
      loading.value =
        false
    }
  }

const applyFilters =
  async () => {
    await loadSections(
      1,
    )
  }

const clearFilters =
  async () => {
    filters.value = {
      gradeId: '',
      status: 'true',
    }

    await loadSections(
      1,
    )
  }

// La API no expone el horario en el detalle; generar-qr devuelve el horario de la sección.
const checkSchedule =
  async (
    section,
  ) => {
    scheduleChecks[
      section.id
    ] = {
      loading: true,
      status: 'loading',
      schedule: '',
      message: '',
    }

    try {
      const response =
        await attendanceService
          .generateQr(
            section.id,
          )

      const payload =
        response?.data ??
        response

      const schedule =
        payload
          ?.seccion
          ?.horario

      if (schedule) {
        scheduleChecks[
          section.id
        ] = {
          loading: false,
          status: 'ok',
          schedule,
          message:
            'Horario activo',
        }

        return
      }

      scheduleChecks[
        section.id
      ] = {
        loading: false,
        status: 'unknown',
        schedule: '',
        message:
          'No fue posible determinar el horario.',
      }
    } catch (
      requestError
    ) {
      console.error(
        'Error comprobando horario:',
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
          ?.message ||
        'No fue posible comprobar el horario.'

      if (
        status === 400 &&
        message
          .toLowerCase()
          .includes(
            'horario',
          )
      ) {
        scheduleChecks[
          section.id
        ] = {
          loading: false,
          status: 'missing',
          schedule: '',
          message:
            'Sin horario activo',
        }

        return
      }

      if (
        status === 400 &&
        !section.estado
      ) {
        scheduleChecks[
          section.id
        ] = {
          loading: false,
          status: 'inactive',
          schedule: '',
          message:
            'Sección inactiva',
        }

        return
      }

      scheduleChecks[
        section.id
      ] = {
        loading: false,
        status: 'error',
        schedule: '',
        message,
      }
    }
  }

const resetForm =
  () => {
    form.value = {
      nombre: '',
      grado_id: '',
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

    mode.value =
      'create'

    showModal.value =
      true
  }

const openEdit =
  (
    section,
  ) => {
    mode.value =
      'edit'

    editingId.value =
      section.id

    fieldErrors.value =
      {}

    form.value = {
      nombre:
        section.nombre,

      grado_id:
        section.grado_id,

      estado:
        Boolean(
          section.estado,
        ),
    }

    showModal.value =
      true
  }

const closeModal =
  () => {
    if (
      saving.value
    ) {
      return
    }

    showModal.value =
      false

    fieldErrors.value =
      {}
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
        'El nombre de la sección es requerido.'
    }

    if (
      form.value
        .nombre
        .trim()
        .length > 20
    ) {
      errors.nombre =
        'El nombre no puede superar los 20 caracteres.'
    }

    if (
      !form.value
        .grado_id
    ) {
      errors.grado_id =
        'Selecciona un grado.'
    }

    fieldErrors.value =
      errors

    return (
      Object.keys(
        errors,
      ).length === 0
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

const saveSection =
  async () => {
    error.value = ''
    success.value = ''

    if (
      !validate()
    ) {
      return
    }

    saving.value =
      true

    try {

      const payload = {
        nombre:
          form.value
            .nombre
            .trim(),

        grado_id:
          Number(
            form.value
              .grado_id,
          ),

        estado:
          Boolean(
            form.value
              .estado,
          ),
      }

      if (
        mode.value ===
        'create'
      ) {
        await sectionService
          .createSection(
            payload,
          )

        success.value =
          'Sección creada correctamente. Puedes comprobar si tiene un horario activo desde la tabla.'

        await loadSections(
          1,
        )
      } else {
        await sectionService
          .updateSection(
            editingId.value,
            payload,
          )

        success.value =
          'Sección actualizada correctamente.'

        await loadSections(
          pagination.value
            .currentPage,
        )
      }

      showModal.value =
        false
    } catch (
      requestError
    ) {
      console.error(
        'Error guardando sección:',
        requestError,
      )

      if (
        requestError
          ?.response
          ?.status ===
        422
      ) {
        if (
          applyBackendErrors(
            requestError,
          )
        ) {
          return
        }
      }

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible guardar la sección.'
    } finally {
      saving.value =
        false
    }
  }

const toggleStatus =
  async (
    section,
  ) => {
    error.value = ''
    success.value = ''

    if (
      section.estado
    ) {
      const confirmed =
        window.confirm(
          `¿Deseas inactivar la sección "${section.nombre}"?`,
        )

      if (
        !confirmed
      ) {
        return
      }

      try {
        await sectionService
          .deactivateSection(
            section.id,
          )

        success.value =
          'Sección inactivada correctamente.'

        await loadSections(
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
            ?.estado
        ) {
          error.value =
            validation
              .estado[0]

          return
        }

        error.value =
          requestError
            ?.response
            ?.data
            ?.message ||
          'No fue posible inactivar la sección.'
      }

      return
    }

    const confirmed =
      window.confirm(
        `¿Deseas reactivar la sección "${section.nombre}"?`,
      )

    if (
      !confirmed
    ) {
      return
    }

    try {
      await sectionService
        .updateSection(
          section.id,
          {
            nombre:
              section.nombre,

            grado_id:
              Number(
                section
                  .grado_id,
              ),

            estado: true,
          },
        )

      success.value =
        'Sección reactivada correctamente.'

      await loadSections(
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
        'No fue posible reactivar la sección.'
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

    await loadSections(
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

    await loadSections(
      pagination.value
        .currentPage + 1,
    )
  }

onMounted(
  async () => {
    await loadGrades()

    await loadSections()
  },
)
</script>

<template>
  <div class="sections-page">

    

    <header class="topbar">

      <div>

        <strong>
          Administración
        </strong>

        <span>
          Gestión de secciones
        </span>

      </div>

    </header>

    <section class="content">

      

      <div class="heading">

        <div>

          <h1>
            Gestión de secciones
          </h1>

          <p>
            Administra las secciones de
            cada grado y verifica su
            configuración de asistencia.
          </p>

        </div>

        <button
          type="button"
          class="new-button"
          :disabled="
            catalogLoading
          "
          @click="
            openCreate
          "
        >
          + Nueva sección
        </button>

      </div>

      

      <div
        v-if="success"
        class="
          message
          success
        "
      >
        ✓ {{ success }}
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

        <div class="filters-grid">

          <div class="field">

            <label>
              Grado
            </label>

            <select
              v-model="
                filters.gradeId
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
              Estado
            </label>

            <select
              v-model="
                filters.status
              "
            >

              <option value="">
                Todas
              </option>

              <option value="true">
                Activas
              </option>

              <option value="false">
                Inactivas
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
            Limpiar
          </button>

          <button
            type="button"
            class="primary"
            @click="
              applyFilters
            "
          >
            🔎 Buscar
          </button>

        </div>

      </section>

      

      <div class="summary">

        <div>

          <span>
            Secciones encontradas
          </span>

          <strong>
            {{ pagination.total }}
          </strong>

        </div>

      </div>

      

      <section class="sections-card">

        <div class="card-heading">

          <div>

            <h2>
              Secciones
            </h2>

            <p>
              Grado, estado y configuración
              horaria.
            </p>

          </div>

          <button
            type="button"
            class="refresh"
            @click="
              loadSections(
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
            Cargando secciones...
          </strong>

        </div>

        

        <div
          v-else-if="
            sections.length === 0
          "
          class="state"
        >

          <div class="empty-icon">
            🏫
          </div>

          <strong>
            No se encontraron secciones
          </strong>

        </div>

        

        <div
          v-else
          class="table-wrapper"
        >

          <table>

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Sección
                </th>

                <th>
                  Grado
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Horario
                </th>

                <th>
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              <tr
                v-for="
                  section
                  in sections
                "
                :key="
                  section.id
                "
              >

                <td>
                  #{{ section.id }}
                </td>

                <td>

                  <strong class="section-name">
                    {{ section.nombre }}
                  </strong>

                </td>

                <td>
                  {{
                    section
                      .grado
                      ?.nombre ||
                    '--'
                  }}
                </td>

                

                <td>

                  <span
                    class="status"
                    :class="
                      section.estado
                        ? 'active'
                        : 'inactive'
                    "
                  >
                    {{
                      section.estado
                        ? 'Activa'
                        : 'Inactiva'
                    }}
                  </span>

                </td>

                

                <td>

                  

                  <button
                    v-if="
                      !scheduleChecks[
                        section.id
                      ]
                    "
                    type="button"
                    class="check-button"
                    @click="
                      checkSchedule(
                        section
                      )
                    "
                  >
                    🕐 Comprobar
                  </button>

                  

                  <span
                    v-else-if="
                      scheduleChecks[
                        section.id
                      ].loading
                    "
                    class="checking"
                  >
                    Comprobando...
                  </span>

                  

                  <div
                    v-else-if="
                      scheduleChecks[
                        section.id
                      ].status ===
                      'ok'
                    "
                    class="schedule-ok"
                  >

                    <strong>
                      {{
                        scheduleChecks[
                          section.id
                        ].schedule
                      }}
                    </strong>

                    <span>
                      ✓ Horario activo
                    </span>

                  </div>

                  

                  <div
                    v-else-if="
                      scheduleChecks[
                        section.id
                      ].status ===
                      'missing'
                    "
                    class="schedule-missing"
                  >

                    <strong>
                      Sin horario activo
                    </strong>

                    <span>
                      QR no disponible
                    </span>

                  </div>

                  

                  <div
                    v-else-if="
                      scheduleChecks[
                        section.id
                      ].status ===
                      'inactive'
                    "
                    class="schedule-neutral"
                  >
                    Sección inactiva
                  </div>

                  

                  <div
                    v-else
                    class="schedule-error"
                  >

                    <span>
                      {{
                        scheduleChecks[
                          section.id
                        ].message
                      }}
                    </span>

                    <button
                      type="button"
                      @click="
                        checkSchedule(
                          section
                        )
                      "
                    >
                      Reintentar
                    </button>

                  </div>

                </td>

                

                <td>

                  <div class="actions">

                    <button
                      type="button"
                      class="edit"
                      @click="
                        openEdit(
                          section
                        )
                      "
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      :class="
                        section.estado
                          ? 'disable'
                          : 'activate'
                      "
                      @click="
                        toggleStatus(
                          section
                        )
                      "
                    >
                      {{
                        section.estado
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
                  ? 'Nuevo registro'
                  : 'Editar registro'
              }}
            </span>

            <h2>
              {{
                mode === 'create'
                  ? 'Crear sección'
                  : 'Editar sección'
              }}
            </h2>

          </div>

          <button
            type="button"
            class="close"
            @click="
              closeModal
            "
          >
            ×
          </button>

        </div>

        

        <div class="field">

          <label>
            Nombre de sección *
          </label>

          <input
            v-model="
              form.nombre
            "
            type="text"
            maxlength="20"
            placeholder="Ej. A"
          />

          <small
            v-if="
              fieldErrors.nombre
            "
            class="field-error"
          >
            {{ fieldErrors.nombre }}
          </small>

        </div>

        

        <div class="field">

          <label>
            Grado *
          </label>

          <select
            v-model="
              form.grado_id
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
              fieldErrors.grado_id
            "
            class="field-error"
          >
            {{ fieldErrors.grado_id }}
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
              Activa
            </option>

            <option
              :value="false"
            >
              Inactiva
            </option>

          </select>

        </div>

        <div class="form-note">
          Verifica desde el listado si la sección
          tiene un horario activo para registrar
          asistencia.
        </div>

        <div class="modal-actions">

          <button
            type="button"
            class="secondary"
            @click="
              closeModal
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            class="primary"
            :disabled="
              saving
            "
            @click="
              saveSection
            "
          >
            {{
              saving
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear sección'
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

.sections-page {
  min-height: 100vh;

  background: #f5f8fc;

  color: #183550;
}

.topbar {
  height: 76px;

  padding:
    0 34px;

  display: flex;
  align-items: center;

  background: white;

  border-bottom:
    1px solid #eaf0f5;
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
  padding:
    30px 34px 45px;
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
  margin:
    5px 0;

  color: #12305a;

  font-size: 34px;
}

.heading p {
  margin: 0;

  color: #74869a;
}

.new-button {
  min-height: 45px;

  padding:
    0 18px;

  border: 0;

  border-radius: 10px;

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

  padding:
    13px 16px;

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

.filters-card {
  margin-bottom: 17px;

  padding: 19px;

  background: white;

  border-radius: 16px;

  box-shadow:
    0 5px 20px
    rgba(
      39,
      77,
      120,
      0.04
    );
}

.filters-grid {
  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        200px,
        1fr
      )
    );

  gap: 12px;
}

.field {
  margin-bottom: 14px;
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

  padding:
    0 11px;

  border:
    1px solid #d9e3ec;

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
    rgba(
      39,
      128,
      216,
      0.07
    );
}

.field-error {
  display: block;

  margin-top: 5px;

  color: #c94d4d;

  font-size: 8px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;

  gap: 9px;
}

.primary,
.secondary {
  min-height: 41px;

  padding:
    0 16px;

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
  border:
    1px solid #d7e1ea;

  background: white;

  color: #526980;
}

.summary {
  margin-bottom: 17px;

  padding:
    15px 19px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  background: white;

  border-radius: 14px;
}

.summary span,
.summary strong {
  display: block;
}

.summary span {
  color: #8494a6;

  font-size: 9px;
}

.summary strong {
  color: #1d4164;

  font-size: 24px;
}

.sections-card {
  overflow: hidden;

  background: white;

  border-radius: 18px;

  box-shadow:
    0 6px 25px
    rgba(
      39,
      77,
      120,
      0.055
    );
}

.card-heading {
  padding:
    21px 23px;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-heading h2 {
  margin: 0;
}

.card-heading p {
  margin:
    4px 0 0;

  color: #8494a6;

  font-size: 9px;
}

.refresh {
  min-height: 38px;

  padding:
    0 13px;

  border:
    1px solid #d8e2eb;

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
  padding:
    14px 18px;

  border-top:
    1px solid #edf1f5;

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

.section-name {
  color: #294963;

  font-size: 12px;
}

.status {
  display: inline-block;

  min-width: 70px;

  padding:
    5px 9px;

  border-radius: 20px;

  text-align: center;

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

.check-button {
  min-height: 31px;

  padding:
    0 10px;

  border:
    1px solid #cdddec;

  background: #edf6ff;

  color: #2675bd;

  border-radius: 7px;

  font-size: 8px;
  font-weight: 700;

  cursor: pointer;
}

.checking {
  color: #798b9e;

  font-size: 9px;
}

.schedule-ok strong,
.schedule-ok span,
.schedule-missing strong,
.schedule-missing span {
  display: block;
}

.schedule-ok strong {
  color: #2470b5;

  font-size: 10px;
}

.schedule-ok span {
  margin-top: 3px;

  color: #239454;

  font-size: 8px;
}

.schedule-missing strong {
  color: #c14f4f;

  font-size: 9px;
}

.schedule-missing span {
  margin-top: 3px;

  color: #9c7474;

  font-size: 8px;
}

.schedule-neutral {
  color: #8292a2;

  font-size: 9px;
}

.schedule-error {
  color: #c14f4f;

  font-size: 8px;
}

.schedule-error button {
  display: block;

  margin-top: 4px;

  padding: 0;

  border: 0;

  background: transparent;

  color: #2475bd;

  font-size: 8px;

  cursor: pointer;
}

.actions {
  display: flex;

  gap: 7px;
}

.actions button {
  min-height: 32px;

  padding:
    0 10px;

  border-radius: 7px;

  font-size: 8px;
  font-weight: 700;

  cursor: pointer;
}

.edit {
  border:
    1px solid #cdddec;

  background: #edf6ff;

  color: #2675bd;
}

.disable {
  border:
    1px solid #f1cccc;

  background: #fff1f1;

  color: #c34b4b;
}

.activate {
  border:
    1px solid #c8e8d4;

  background: #e7f8ed;

  color: #218f51;
}

.state {
  min-height: 260px;

  display: grid;
  place-items: center;
  align-content: center;

  gap: 9px;
}

.empty-icon {
  font-size: 40px;
}

.loader {
  width: 37px;
  height: 37px;

  border:
    3px solid #dbe6ef;

  border-top-color:
    #247ede;

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
  padding:
    15px 22px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  border-top:
    1px solid #edf1f5;
}

.pagination span {
  color: #75879b;

  font-size: 9px;
}

.pagination button {
  min-height: 36px;

  padding:
    0 13px;

  border:
    1px solid #d7e1ea;

  background: white;

  color: #506980;

  border-radius: 8px;

  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;

  cursor: default;
}

.modal-overlay {
  position: fixed;

  inset: 0;

  z-index: 3000;

  padding: 20px;

  display: grid;
  place-items: center;

  background:
    rgba(
      8,
      24,
      43,
      0.73
    );

  backdrop-filter:
    blur(4px);
}

.modal {
  width: 100%;

  max-width: 540px;

  padding: 25px;

  background: white;

  border-radius: 20px;

  box-shadow:
    0 25px 80px
    rgba(
      10,
      35,
      60,
      0.22
    );
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
  margin:
    4px 0 0;
}

.close {
  width: 39px;
  height: 39px;

  border: 0;

  background: #eef3f7;

  border-radius: 50%;

  font-size: 24px;

  cursor: pointer;
}

.form-note {
  margin-top: 5px;

  padding: 12px;

  background: #edf6ff;

  color: #60798f;

  border-radius: 9px;

  font-size: 9px;

  line-height: 1.5;
}

.modal-actions {
  margin-top: 21px;

  display: flex;
  justify-content: flex-end;

  gap: 9px;
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

  .filters-grid {
    grid-template-columns:
      1fr;
  }

  .summary {
    align-items: flex-start;

    flex-direction: column;

    gap: 8px;
  }
}
</style>