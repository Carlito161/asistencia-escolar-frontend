<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
} from 'vue'

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode'

import attendanceService
  from '@/services/attendanceService'
import { useAuthStore } from '@/stores/auth'

import {
  useAttendanceStore,
} from '@/stores/Attendance'

import {
  decodeQrImage,
  fileToDataUrl,
} from '@/utils/qrUtils'

const attendanceStore =
  useAttendanceStore()
const authStore = useAuthStore()

onMounted(() => attendanceStore.loadHistory())

const student =
  ref({
    name:
      authStore.email || 'Estudiante',

    grade:
      'Perfil pendiente de API',

    level:
      '',
  })

const attendance =
  computed(
    () => ({
      percentage:
        attendanceStore
          .percentage,

      present:
        attendanceStore
          .present,

      late:
        attendanceStore
          .late,

      absent:
        attendanceStore
          .absent,

      todayStatus:
        attendanceStore
          .todayStatus,

      todayTime:
        attendanceStore
          .todayTime,
    }),
  )

const recentRecords =
  computed(
    () =>
      attendanceStore
        .recentRecords,
  )

const showScanner =
  ref(false)

const scannerStatus =
  ref('idle')

const scannerMessage =
  ref('')

const registrationResult =
  ref(null)

const selectedCameraId =
  ref('')

const availableCameras =
  ref([])

const fileInput =
  ref(null)

let qrScanner = null

let processingQr = false

const registerAttendance =
  async () => {
    scannerStatus.value =
      'scanning'

    scannerMessage.value =
      'Preparando cámara...'

    registrationResult.value =
      null

    processingQr = false

    showScanner.value =
      true

    await nextTick()

    await startScanner()
  }

const loadCameras =
  async () => {
    const cameras =
      await Html5Qrcode
        .getCameras()

    availableCameras.value =
      cameras || []

    if (
      availableCameras
        .value.length === 0
    ) {
      throw new Error(
        'No se encontró ninguna cámara.',
      )
    }

    const rear =
      availableCameras
        .value
        .find(
          (camera) => {
            const label =
              (
                camera.label ||
                ''
              )
                .toLowerCase()

            return (
              label.includes(
                'back',
              ) ||
              label.includes(
                'rear',
              ) ||
              label.includes(
                'environment',
              ) ||
              label.includes(
                'trasera',
              )
            )
          },
        )

    selectedCameraId.value =
      rear?.id ||
      availableCameras
        .value[0]
        .id
  }

const startScanner =
  async () => {
    try {
      await stopScanner()

      await loadCameras()

      qrScanner =
        new Html5Qrcode(
          'qr-reader',
          {
            formatsToSupport: [
              Html5QrcodeSupportedFormats
                .QR_CODE,
            ],

            verbose: false,
          },
        )

      await qrScanner.start(
        selectedCameraId.value,

        {

          fps: 8,

          disableFlip:
            false,
        },

        async (
          decodedText,
        ) => {
          await handleDetectedQr(
            decodedText,
          )
        },

        () => {},
      )

      scannerMessage.value =
        'Cámara lista. Mantén el QR completamente visible y aléjalo un poco si la imagen se ve borrosa.'
    } catch (error) {
      console.error(
        'Error cámara:',
        error,
      )

      scannerStatus.value =
        'cameraError'

      scannerMessage.value =
        error?.message ||
        'No fue posible abrir la cámara.'
    }
  }

const handleDetectedQr =
  async (token) => {
    if (
      processingQr ||
      !token
    ) {
      return
    }

    processingQr = true

    scannerStatus.value =
      'processing'

    scannerMessage.value =
      'Código detectado. Registrando asistencia...'

    await stopScanner()

    await sendAttendance(
      token,
    )
  }

const sendAttendance =
  async (token) => {
    const accessToken = authStore.accessToken
    try {
      const response =
        await attendanceService
          .registerAttendance(
            token,
          )

      if (accessToken !== authStore.accessToken) return

      if (
        !response ||
        response.success !==
          true ||
        !response.data
      ) {
        throw new Error(
          response?.message ||
          'El servidor no confirmó la asistencia.',
        )
      }

      registrationResult.value =
        attendanceStore
          .registerBackendAttendance(
            response.data,
          )

      await attendanceStore.loadHistory()

      scannerStatus.value =
        'success'

      scannerMessage.value =
        response.message ||
        'Asistencia registrada correctamente.'
    } catch (error) {
      if (accessToken !== authStore.accessToken) return
      console.error(
        'Error asistencia:',
        error,
      )

      const status =
        error?.response
          ?.status

      // Laravel puede guardar AUSENTE y responder 403; recargar evita un historial desactualizado.
      if (status === 403 || status === 409) await attendanceStore.loadHistory()

      const message =
        error?.response
          ?.data
          ?.message ||
        error?.message

      if (
        status === 409
      ) {
        scannerStatus.value =
          'alreadyRegistered'

        scannerMessage.value =
          message ||
          'La asistencia ya fue registrada para hoy.'

        return
      }

      scannerStatus.value =
        'backendError'

      scannerMessage.value =
        message ||
        'No fue posible registrar la asistencia.'
    }
  }

const openImagePicker =
  () => {
    fileInput
      .value
      ?.click()
  }

const handleImageSelected =
  async (event) => {
    const file =
      event.target
        ?.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    try {
      scannerStatus.value =
        'processing'

      scannerMessage.value =
        'Analizando imagen del QR...'

      await stopScanner()

      const dataUrl =
        await fileToDataUrl(
          file,
        )

      const token =
        await decodeQrImage(
          dataUrl,
        )

      await sendAttendance(
        token,
      )
    } catch (error) {
      console.error(
        'Error leyendo imagen:',
        error,
      )

      processingQr = false

      scannerStatus.value =
        'backendError'

      scannerMessage.value =
        'No pudimos encontrar un código QR válido en la imagen.'
    }
  }

const stopScanner =
  async () => {
    if (!qrScanner) {
      return
    }

    const scanner =
      qrScanner

    qrScanner = null

    try {
      if (
        scanner.isScanning
      ) {
        await scanner.stop()
      }

      try {
        scanner.clear()
      } catch {
        
      }
    } catch (error) {
      console.log(
        'Scanner detenido:',
        error,
      )
    }
  }

const scanAgain =
  async () => {
    processingQr = false

    registrationResult.value =
      null

    scannerStatus.value =
      'scanning'

    await nextTick()

    await startScanner()
  }

const closeScanner =
  async () => {
    await stopScanner()

    processingQr = false

    showScanner.value =
      false

    scannerStatus.value =
      'idle'

    scannerMessage.value =
      ''

    registrationResult.value =
      null
  }

const formatDate =
  (date) => {
    if (!date) {
      return '--'
    }

    const parts =
      date.split('-')

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

onBeforeUnmount(
  async () => {
    await stopScanner()
  },
)
</script>

<template>
  <div class="student-page">

    

    <aside class="sidebar">

      <div class="brand">

        <div class="brand-logo">
          QR
        </div>

        <div>
          <strong>
            Asistencia QR
          </strong>

          <span>
            Control escolar
          </span>
        </div>

      </div>

      <nav>

        <RouterLink
          to="/estudiante"
          class="active"
        >
          ⌂ Inicio
        </RouterLink>

        <RouterLink
          to="/estudiante/asistencia"
        >
          ▣ Mi asistencia
        </RouterLink>

      </nav>

    </aside>

    

    <main>
      <p v-if="attendanceStore.loading" role="status">Cargando historial real...</p>
      <p v-if="attendanceStore.error" role="alert">
        {{ attendanceStore.error }}
        <button type="button" @click="attendanceStore.loadHistory()">Reintentar</button>
      </p>
      <p>Los indicadores se calculan sobre las asistencias registradas; no incluyen días sin registro.</p>

      <header class="topbar">

        <div></div>

        <div class="profile">

          <div class="avatar">
            AP
          </div>

          <div>
            <strong>
              {{ student.name }}
            </strong>

            <span>
              Alumno
            </span>
          </div>

        </div>

      </header>

      <section class="content">

        <div class="welcome">

          <h1>
            ¡Hola,
            {{
              student.name
                .split(' ')[0]
            }}!
            👋
          </h1>

          <p>
            Registra tu asistencia
            utilizando el código QR
            de tu profesor.
          </p>

        </div>

        <div class="dashboard-grid">

          

          <section class="scan-card">

            <div class="scan-heading">

              <div class="scan-icon">
                QR
              </div>

              <div>
                <h2>
                  Registrar mi asistencia
                </h2>

                <p>
                  Escanea el código QR
                  mostrado por tu profesor.
                </p>
              </div>

            </div>

            <div class="illustration">
              🎒
              <span>
                ▦
              </span>
            </div>

            <button
              class="scan-button"
              type="button"
              @click="
                registerAttendance
              "
            >
              📷 Escanear con cámara
            </button>

            <button
              class="image-button"
              type="button"
              @click="
                openImagePicker
              "
            >
              🖼 Seleccionar imagen del QR
            </button>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="
                handleImageSelected
              "
            />

            <small>
              También puedes seleccionar
              una captura del QR si la
              webcam tiene dificultad
              para enfocarlo.
            </small>

          </section>

          

          <div class="right-column">

            <section class="grade-card">

              <h3>
                🎓 Mi grado y sección
              </h3>

              <div class="grade-box">

                <div>
                  <strong>
                    {{ student.grade }}
                  </strong>

                  <span>
                    {{ student.level }}
                  </span>
                </div>

                <span class="books">
                  📚
                </span>

              </div>

            </section>

            <section class="summary-card">

              <h3>
                📊 Asistencia
              </h3>

              <div class="summary-grid">

                <div>
                  <strong>
                    {{
                      attendance
                        .percentage
                    }}%
                  </strong>

                  <span>
                    Porcentaje
                  </span>
                </div>

                <div>
                  <strong>
                    {{
                      attendance
                        .present
                    }}
                  </strong>

                  <span>
                    Presentes
                  </span>
                </div>

                <div>
                  <strong>
                    {{
                      attendance
                        .late
                    }}
                  </strong>

                  <span>
                    Tardanzas
                  </span>
                </div>

                <div>
                  <strong>
                    {{
                      attendance
                        .absent
                    }}
                  </strong>

                  <span>
                    Ausencias
                  </span>
                </div>

              </div>

            </section>

          </div>

        </div>

        

        <section class="today-card">

          <div class="today-header">

            <h3>
              🕒 Mi asistencia de hoy
            </h3>

            <RouterLink
              to="/estudiante/asistencia"
            >
              Ver registros →
            </RouterLink>

          </div>

          <div class="today-grid">

            <div>
              <span>
                Hora
              </span>

              <strong>
                {{
                  attendance
                    .todayTime
                }}
              </strong>
            </div>

            <div>
              <span>
                Estado
              </span>

              <strong>
                {{
                  attendance
                    .todayStatus
                }}
              </strong>
            </div>

            <div class="recent">

              <span>
                Últimos registros
              </span>

              <div
                v-for="
                  record
                  in recentRecords
                "
                :key="
                  record.id
                "
                class="record"
              >
                <span>
                  {{ record.date }}
                </span>

                <span>
                  {{ record.time }}
                </span>

                <strong>
                  {{ record.status }}
                </strong>
              </div>

            </div>

          </div>

        </section>

      </section>

    </main>

    

    <div
      v-if="showScanner"
      class="scanner-overlay"
    >

      <div class="scanner-modal">

        <header>

          <div>
            <h2>
              Escanear código QR
            </h2>

            <p>
              Mantén completamente visible
              el QR dentro de la cámara.
            </p>
          </div>

          <button
            type="button"
            @click="
              closeScanner
            "
          >
            ×
          </button>

        </header>

        

        <template
          v-if="
            scannerStatus ===
            'scanning'
          "
        >

          <div
            id="qr-reader"
            class="qr-reader"
          ></div>

          <div class="scanner-help">

            <strong>
              Consejo
            </strong>

            <span>
              Si el QR se ve borroso,
              aléjalo de la webcam hasta
              que sus cuadrados se vean
              definidos.
            </span>

          </div>

          <p class="scanner-message">
            {{
              scannerMessage
            }}
          </p>

          <button
            class="modal-image-button"
            type="button"
            @click="
              openImagePicker
            "
          >
            🖼 Usar una imagen
          </button>

          <button
            class="cancel"
            type="button"
            @click="
              closeScanner
            "
          >
            Cancelar
          </button>

        </template>

        

        <div
          v-else-if="
            scannerStatus ===
            'processing'
          "
          class="result"
        >

          <div class="result-icon processing">
            QR
          </div>

          <h3>
            Procesando código
          </h3>

          <p>
            {{
              scannerMessage
            }}
          </p>

          <div class="loading-track">
            <div>
            </div>
          </div>

        </div>

        

        <div
          v-else-if="
            scannerStatus ===
            'success'
          "
          class="result"
        >

          <div class="result-icon success">
            ✓
          </div>

          <h3>
            ¡Asistencia registrada!
          </h3>

          <p>
            {{
              scannerMessage
            }}
          </p>

          <div
            v-if="
              registrationResult
            "
            class="result-grid"
          >

            <div>
              <span>
                Fecha
              </span>

              <strong>
                {{
                  formatDate(
                    registrationResult
                      .fecha_asistencia,
                  )
                }}
              </strong>
            </div>

            <div>
              <span>
                Hora
              </span>

              <strong>
                {{
                  registrationResult
                    .hora_entrada
                }}
              </strong>
            </div>

            <div>
              <span>
                Estado
              </span>

              <strong>
                {{
                  registrationResult
                    .status
                }}
              </strong>
            </div>

          </div>

          <div
            v-if="
              registrationResult
                ?.observaciones
            "
            class="observation"
          >
            {{
              registrationResult
                .observaciones
            }}
          </div>

          <button
            class="primary full"
            type="button"
            @click="
              closeScanner
            "
          >
            Cerrar
          </button>

        </div>

        

        <div
          v-else-if="
            scannerStatus ===
            'alreadyRegistered'
          "
          class="result"
        >

          <div class="result-icon info">
            !
          </div>

          <h3>
            Asistencia ya registrada
          </h3>

          <p>
            {{
              scannerMessage
            }}
          </p>

          <button
            class="primary full"
            type="button"
            @click="
              closeScanner
            "
          >
            Entendido
          </button>

        </div>

        

        <div
          v-else-if="
            scannerStatus ===
              'backendError' ||
            scannerStatus ===
              'cameraError'
          "
          class="result"
        >

          <div class="result-icon error">
            !
          </div>

          <h3>
            No se pudo continuar
          </h3>

          <p>
            {{
              scannerMessage
            }}
          </p>

          <div class="error-actions">

            <button
              class="secondary"
              type="button"
              @click="
                closeScanner
              "
            >
              Cerrar
            </button>

            <button
              class="primary"
              type="button"
              @click="
                scanAgain
              "
            >
              Reintentar cámara
            </button>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.student-page {
  min-height: 100vh;
  display: flex;
  background: #f5f8fc;
  color: #173253;
}

.sidebar {
  width: 250px;
  min-height: 100vh;
  padding: 28px 18px;
  background: white;
  border-right: 1px solid #e4ebf3;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 45px;
}

.brand-logo {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  background: #e6f2ff;
  color: #1472d0;
  border-radius: 12px;
  font-weight: 800;
}

.brand strong,
.brand span {
  display: block;
}

.brand span {
  margin-top: 3px;
  color: #8090a3;
  font-size: 11px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.sidebar nav a {
  padding: 13px 15px;
  color: #52667f;
  border-radius: 11px;
  text-decoration: none;
}

.sidebar nav a.active {
  background: #e1f0ff;
  color: #176bc5;
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
  border-bottom: 1px solid #edf1f5;
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
  color: #8998a9;
  font-size: 11px;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: #deedff;
  color: #176bc5;
  border-radius: 50%;
  font-weight: 700;
}

.content {
  padding: 30px 34px 45px;
}

.welcome {
  margin-bottom: 27px;
}

.welcome h1 {
  margin: 0;
  color: #122d55;
  font-size: 36px;
}

.welcome p {
  margin: 6px 0 0;
  color: #718399;
}

.dashboard-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.4fr)
    minmax(300px, 1fr);
  gap: 22px;
}

.scan-card,
.grade-card,
.summary-card,
.today-card {
  background: white;
  border-radius: 18px;
  box-shadow:
    0 6px 25px
    rgba(39, 77, 120, 0.06);
}

.scan-card {
  padding: 27px;
}

.scan-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}

.scan-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background: #e6f2ff;
  color: #1872cb;
  border-radius: 12px;
  font-weight: 800;
}

.scan-heading h2 {
  margin: 0;
}

.scan-heading p {
  margin: 5px 0 0;
  color: #7b8c9e;
  font-size: 13px;
}

.illustration {
  min-height: 245px;
  margin: 25px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  background: #f8fbfe;
  border-radius: 17px;
  font-size: 90px;
}

.illustration span {
  color: #75899e;
}

.scan-button,
.image-button {
  width: 100%;
  min-height: 54px;
  border-radius: 13px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.scan-button {
  border: 0;
  background:
    linear-gradient(
      135deg,
      #218cff,
      #196bd8
    );
  color: white;
}

.image-button {
  margin-top: 10px;
  border: 1px solid #d6e2ec;
  background: white;
  color: #516b83;
}

.hidden-input {
  display: none;
}

.scan-card small {
  display: block;
  margin-top: 12px;
  text-align: center;
  color: #8796a8;
  line-height: 1.5;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grade-card,
.summary-card {
  padding: 22px;
}

.grade-card h3,
.summary-card h3 {
  margin-top: 0;
}

.grade-box {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f3efff;
  border-radius: 14px;
}

.grade-box strong,
.grade-box span {
  display: block;
}

.grade-box strong {
  font-size: 32px;
}

.grade-box span {
  color: #78899d;
}

.books {
  font-size: 50px;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 10px;
}

.summary-grid > div {
  padding: 15px;
  background: #f8fbfe;
  border-radius: 11px;
}

.summary-grid strong,
.summary-grid span {
  display: block;
}

.summary-grid strong {
  color: #1c3c61;
  font-size: 24px;
}

.summary-grid span {
  margin-top: 4px;
  color: #8493a5;
  font-size: 11px;
}

.today-card {
  margin-top: 22px;
  padding: 22px;
}

.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.today-header h3 {
  margin: 0;
}

.today-header a {
  color: #2678ca;
  font-size: 12px;
  text-decoration: none;
}

.today-grid {
  margin-top: 17px;
  display: grid;
  grid-template-columns:
    1fr 1fr 1.5fr;
  gap: 15px;
}

.today-grid > div {
  padding: 16px;
  background: #f8fbfe;
  border-radius: 12px;
}

.today-grid span,
.today-grid strong {
  display: block;
}

.today-grid > div > span {
  color: #7e8fa2;
  font-size: 11px;
}

.today-grid > div > strong {
  margin-top: 7px;
  font-size: 19px;
}

.recent > span {
  margin-bottom: 7px;
}

.record {
  padding: 7px 0;
  display: grid;
  grid-template-columns:
    1fr 1fr auto;
  border-top: 1px solid #e8eef4;
  font-size: 10px;
}

.scanner-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  padding: 20px;
  display: grid;
  place-items: center;
  background: rgba(9, 25, 44, 0.72);
  backdrop-filter: blur(5px);
}

.scanner-modal {
  width: 100%;
  max-width: 650px;
  max-height: 95vh;
  overflow-y: auto;
  padding: 24px;
  background: white;
  border-radius: 21px;
}

.scanner-modal header {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
}

.scanner-modal header h2 {
  margin: 0;
}

.scanner-modal header p {
  margin: 5px 0 0;
  color: #7c8da0;
  font-size: 12px;
}

.scanner-modal header button {
  width: 39px;
  height: 39px;
  border: 0;
  background: #eef3f7;
  color: #54697f;
  border-radius: 50%;
  font-size: 25px;
  cursor: pointer;
}

.qr-reader {
  width: 100%;
  min-height: 390px;
  overflow: hidden;
  background: #101c29;
  border: 0 !important;
  border-radius: 16px;
}

.qr-reader :deep(video) {
  width: 100% !important;
  min-height: 390px;
  max-height: 520px;
  object-fit: contain !important;
  background: #101c29;
}

.scanner-help {
  margin-top: 12px;
  padding: 12px 14px;
  background: #eef7ff;
  border-radius: 11px;
}

.scanner-help strong,
.scanner-help span {
  display: block;
}

.scanner-help strong {
  color: #335f82;
  font-size: 11px;
}

.scanner-help span {
  margin-top: 4px;
  color: #698096;
  font-size: 11px;
  line-height: 1.5;
}

.scanner-message {
  color: #62778e;
  text-align: center;
  font-size: 12px;
}

.modal-image-button,
.cancel {
  width: 100%;
  min-height: 45px;
  border-radius: 11px;
  cursor: pointer;
}

.modal-image-button {
  border: 1px solid #cfdde9;
  background: #edf6ff;
  color: #2775bd;
  font-weight: 700;
}

.cancel {
  margin-top: 8px;
  border: 1px solid #d9e2eb;
  background: white;
  color: #526981;
}

.result {
  padding: 22px 5px 5px;
  text-align: center;
}

.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 31px;
  font-weight: 800;
}

.result-icon.processing {
  background: #e6f2ff;
  color: #247bd4;
}

.result-icon.success {
  background: #e1f8eb;
  color: #22a159;
}

.result-icon.error {
  background: #ffe5e5;
  color: #d64c4c;
}

.result-icon.info {
  background: #e6f2ff;
  color: #247bd4;
}

.result h3 {
  margin: 0;
}

.result > p {
  color: #77899c;
  font-size: 13px;
}

.loading-track {
  width: 80%;
  height: 7px;
  margin: 20px auto;
  overflow: hidden;
  background: #edf2f6;
  border-radius: 20px;
}

.loading-track div {
  width: 40%;
  height: 100%;
  background: #2684e2;
  animation:
    loading
    1s infinite;
}

@keyframes loading {
  from {
    transform:
      translateX(-100%);
  }

  to {
    transform:
      translateX(250%);
  }
}

.result-grid {
  margin: 20px 0;
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 9px;
}

.result-grid > div {
  padding: 13px;
  background: #f7fafc;
  border-radius: 10px;
  text-align: left;
}

.result-grid span,
.result-grid strong {
  display: block;
}

.result-grid span {
  color: #8494a6;
  font-size: 10px;
}

.observation {
  margin-bottom: 16px;
  padding: 13px;
  background: #edf7ff;
  color: #55718c;
  border-radius: 10px;
  font-size: 12px;
}

.primary,
.secondary {
  min-height: 47px;
  border-radius: 11px;
  font-weight: 700;
  cursor: pointer;
}

.primary {
  border: 0;
  background: #237ddd;
  color: white;
}

.secondary {
  border: 1px solid #d7e1ea;
  background: white;
  color: #52687f;
}

.full {
  width: 100%;
}

.error-actions {
  display: grid;
  grid-template-columns:
    1fr 1fr;
  gap: 10px;
}

@media (max-width: 1050px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .today-grid {
    grid-template-columns:
      1fr 1fr;
  }

  .recent {
    grid-column:
      1 / -1;
  }
}

@media (max-width: 760px) {
  .sidebar {
    display: none;
  }

  .content {
    padding: 20px;
  }

  .today-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .result-grid,
  .error-actions {
    grid-template-columns: 1fr;
  }

  .qr-reader,
  .qr-reader :deep(video) {
    min-height: 300px;
  }
}
</style>
