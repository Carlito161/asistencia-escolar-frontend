<script setup>
import {
  onMounted,
  ref,
} from 'vue'

import gradeService
  from '@/services/gradeService'

const loading =
  ref(true)

const saving =
  ref(false)

const changingStatus =
  ref(null)

const error =
  ref('')

const success =
  ref('')

const grades =
  ref([])

const pagination =
  ref({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  })

const filters =
  ref({
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
    estado: true,
  })

const buildParams =
  (
    page = 1,
  ) => {
    const params = {
      page,
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

const loadGrades =
  async (
    page = 1,
  ) => {
    loading.value =
      true

    error.value = ''

    try {
      const response =
        await gradeService
          .getGrades(
            buildParams(
              page,
            ),
          )

      grades.value =
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
      loading.value =
        false
    }
  }

const applyFilters =
  async () => {
    await loadGrades(
      1,
    )
  }

const clearFilters =
  async () => {
    filters.value = {
      status: 'true',
    }

    await loadGrades(
      1,
    )
  }

const resetForm =
  () => {
    form.value = {
      nombre: '',
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
    grade,
  ) => {
    mode.value =
      'edit'

    editingId.value =
      grade.id

    fieldErrors.value =
      {}

    form.value = {
      nombre:
        grade.nombre,

      estado:
        Boolean(
          grade.estado,
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

    const name =
      form.value
        .nombre
        .trim()

    if (!name) {
      errors.nombre =
        'El nombre del grado es requerido.'
    }

    if (
      name.length > 50
    ) {
      errors.nombre =
        'El nombre no puede superar los 50 caracteres.'
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

const saveGrade =
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
        await gradeService
          .createGrade(
            payload,
          )

        success.value =
          'Grado creado correctamente.'

        showModal.value =
          false

        await loadGrades(
          1,
        )

        return
      }

      await gradeService
        .updateGrade(
          editingId.value,
          payload,
        )

      success.value =
        'Grado actualizado correctamente.'

      showModal.value =
        false

      await loadGrades(
        pagination.value
          .currentPage,
      )
    } catch (
      requestError
    ) {
      console.error(
        'Error guardando grado:',
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
        'No fue posible guardar el grado.'
    } finally {
      saving.value =
        false
    }
  }

const toggleStatus =
  async (
    grade,
  ) => {
    error.value = ''
    success.value = ''

    changingStatus.value =
      grade.id

    if (
      grade.estado
    ) {
      const confirmed =
        window.confirm(
          `¿Deseas inactivar el grado "${grade.nombre}"?`,
        )

      if (
        !confirmed
      ) {
        changingStatus.value =
          null

        return
      }

      try {
        await gradeService
          .deactivateGrade(
            grade.id,
          )

        success.value =
          'Grado inactivado correctamente.'

        await loadGrades(
          pagination.value
            .currentPage,
        )
      } catch (
        requestError
      ) {
        console.error(
          'Error inactivando grado:',
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
            ?.length
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
          'No fue posible inactivar el grado.'
      } finally {
        changingStatus.value =
          null
      }

      return
    }

    const confirmed =
      window.confirm(
        `¿Deseas reactivar el grado "${grade.nombre}"?`,
      )

    if (
      !confirmed
    ) {
      changingStatus.value =
        null

      return
    }

    try {
      await gradeService
        .updateGrade(
          grade.id,
          {
            nombre:
              grade.nombre,

            estado:
              true,
          },
        )

      success.value =
        'Grado reactivado correctamente.'

      await loadGrades(
        pagination.value
          .currentPage,
      )
    } catch (
      requestError
    ) {
      console.error(
        'Error reactivando grado:',
        requestError,
      )

      error.value =
        requestError
          ?.response
          ?.data
          ?.message ||
        'No fue posible reactivar el grado.'
    } finally {
      changingStatus.value =
        null
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

    await loadGrades(
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

    await loadGrades(
      pagination.value
        .currentPage + 1,
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
      new Date(
        date,
      )

    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return '--'
    }

    return value
      .toLocaleDateString(
        'es-SV',
        {
          day:
            '2-digit',

          month:
            '2-digit',

          year:
            'numeric',
        },
      )
  }

onMounted(
  async () => {
    await loadGrades()
  },
)
</script>

<template>
  <div class="grades-page">

    

    <header class="topbar">

      <div>

        <strong>
          Administración
        </strong>

        <span>
          Gestión de grados
        </span>

      </div>

    </header>

    

    <section class="content">

      

      <div class="heading">

        <div>

          <h1>
            Gestión de grados
          </h1>

          <p>
            Crea, modifica y administra
            los grados utilizados por las
            secciones y estudiantes.
          </p>

        </div>

        <button
          type="button"
          class="new-button"
          @click="
            openCreate
          "
        >
          + Nuevo grado
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

        <div class="filters-content">

          <div class="field filter-field">

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

        </div>

      </section>

      

      <div class="summary-card">

        <div class="summary-icon">
          🎓
        </div>

        <div>

          <span>
            Grados encontrados
          </span>

          <strong>
            {{ pagination.total }}
          </strong>

        </div>

      </div>

      

      <section class="grades-card">

        <div class="card-heading">

          <div>

            <h2>
              Grados
            </h2>

            <p>
              Registros disponibles en
              el sistema.
            </p>

          </div>

          <button
            type="button"
            class="refresh"
            :disabled="loading"
            @click="
              loadGrades(
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
            Cargando grados...
          </strong>

        </div>

        

        <div
          v-else-if="
            grades.length === 0
          "
          class="state"
        >

          <div class="empty-icon">
            🎓
          </div>

          <strong>
            No se encontraron grados
          </strong>

          <span>
            Intenta cambiar el filtro
            seleccionado.
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
                  ID
                </th>

                <th>
                  Grado
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Creado
                </th>

                <th>
                  Actualizado
                </th>

                <th>
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              <tr
                v-for="
                  grade
                  in grades
                "
                :key="
                  grade.id
                "
              >

                <td>

                  <span class="id-badge">
                    #{{ grade.id }}
                  </span>

                </td>

                <td>

                  <div class="grade-cell">

                    <div class="grade-icon">
                      🎓
                    </div>

                    <strong>
                      {{ grade.nombre }}
                    </strong>

                  </div>

                </td>

                <td>

                  <span
                    class="status"
                    :class="
                      grade.estado
                        ? 'active'
                        : 'inactive'
                    "
                  >
                    {{
                      grade.estado
                        ? 'Activo'
                        : 'Inactivo'
                    }}
                  </span>

                </td>

                <td>
                  {{
                    formatDate(
                      grade.created_at
                    )
                  }}
                </td>

                <td>
                  {{
                    formatDate(
                      grade.updated_at
                    )
                  }}
                </td>

                <td>

                  <div class="actions">

                    <button
                      type="button"
                      class="edit"
                      @click="
                        openEdit(
                          grade
                        )
                      "
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      :disabled="
                        changingStatus ===
                        grade.id
                      "
                      :class="
                        grade.estado
                          ? 'disable'
                          : 'activate'
                      "
                      @click="
                        toggleStatus(
                          grade
                        )
                      "
                    >
                      {{
                        changingStatus ===
                        grade.id
                          ? 'Procesando...'
                          : grade.estado
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
                  ? 'Crear grado'
                  : 'Editar grado'
              }}
            </h2>

            <p>
              {{
                mode === 'create'
                  ? 'Agrega un nuevo grado al sistema.'
                  : 'Modifica la información del grado.'
              }}
            </p>

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
            Nombre del grado *
          </label>

          <input
            v-model="
              form.nombre
            "
            type="text"
            maxlength="50"
            placeholder="Ej. Primero Básico"
            @keyup.enter="
              saveGrade
            "
          />

          <div class="input-info">

            <small
              v-if="
                fieldErrors.nombre
              "
              class="field-error"
            >
              {{ fieldErrors.nombre }}
            </small>

            <small
              v-else
              class="characters"
            >
              {{
                form.nombre.length
              }}/50
            </small>

          </div>

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

        

        <div class="form-note">

          <span>
            ℹ
          </span>

          <p>
            Un grado con secciones activas
            asociadas no puede ser
            inactivado hasta que dichas
            secciones sean inactivadas.
          </p>

        </div>

        

        <div class="modal-actions">

          <button
            type="button"
            class="secondary"
            :disabled="
              saving
            "
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
              saveGrade
            "
          >
            {{
              saving
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear grado'
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

.grades-page {
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
  font-size: 13px;
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

  font-size: 11px;
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

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.new-button:hover {
  background: #176dca;

  transform:
    translateY(-1px);
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

.filters-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  gap: 15px;
}

.filter-field {
  width: 300px;
  margin-bottom: 0;
}

.filter-actions {
  display: flex;

  gap: 9px;
}

.field {
  margin-bottom: 17px;
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

.input-info {
  min-height: 18px;

  margin-top: 4px;

  display: flex;
  justify-content: flex-end;
}

.field-error {
  width: 100%;

  color: #c94d4d;

  font-size: 8px;
}

.characters {
  color: #8b9aaa;

  font-size: 8px;
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

.primary:hover:not(:disabled) {
  background: #176dca;
}

.secondary {
  border:
    1px solid #d7e1ea;

  background: white;

  color: #526980;
}

.secondary:hover:not(:disabled) {
  background: #f6f9fc;
}

.primary:disabled,
.secondary:disabled {
  opacity: 0.5;

  cursor: default;
}

.summary-card {
  margin-bottom: 17px;

  padding: 16px 19px;

  display: flex;
  align-items: center;

  gap: 13px;

  background: white;

  border-radius: 14px;

  box-shadow:
    0 5px 20px
    rgba(
      39,
      77,
      120,
      0.04
    );
}

.summary-icon {
  width: 45px;
  height: 45px;

  display: grid;
  place-items: center;

  flex-shrink: 0;

  background: #f0eaff;

  border-radius: 11px;

  font-size: 20px;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: #8494a6;

  font-size: 9px;
}

.summary-card strong {
  margin-top: 2px;

  color: #1d4164;

  font-size: 24px;
}

.grades-card {
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

  color: #294963;

  font-size: 18px;
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

td {
  color: #5b7187;
}

.id-badge {
  color: #2676c4;

  font-weight: 700;
}

.grade-cell {
  min-width: 180px;

  display: flex;
  align-items: center;

  gap: 10px;
}

.grade-icon {
  width: 36px;
  height: 36px;

  display: grid;
  place-items: center;

  flex-shrink: 0;

  background: #f0eaff;

  border-radius: 9px;

  font-size: 16px;
}

.grade-cell strong {
  color: #294963;

  font-size: 11px;
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

.actions button:disabled {
  opacity: 0.55;

  cursor: default;
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

  max-width: 520px;

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
  margin-bottom: 22px;

  display: flex;
  justify-content: space-between;

  gap: 20px;
}

.modal-header span {
  color: #2678ca;

  font-size: 9px;
  font-weight: 700;
}

.modal-header h2 {
  margin:
    4px 0 0;

  color: #294963;
}

.modal-header p {
  margin:
    5px 0 0;

  color: #8494a6;

  font-size: 9px;
}

.close {
  width: 39px;
  height: 39px;

  flex-shrink: 0;

  border: 0;

  background: #eef3f7;

  border-radius: 50%;

  color: #60768a;

  font-size: 24px;

  cursor: pointer;
}

.form-note {
  padding: 12px;

  display: flex;
  align-items: flex-start;

  gap: 8px;

  background: #edf6ff;

  color: #60798f;

  border-radius: 9px;

  font-size: 9px;

  line-height: 1.5;
}

.form-note span {
  color: #2678ca;

  font-weight: 800;
}

.form-note p {
  margin: 0;
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

  .new-button {
    align-self: flex-start;
  }

  .filters-content {
    align-items: stretch;

    flex-direction: column;
  }

  .filter-field {
    width: 100%;
  }

  .filter-actions {
    justify-content: flex-end;
  }

  .pagination {
    gap: 10px;
  }
}
</style>