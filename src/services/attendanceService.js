import api from './api.js'
import { collectPages } from './pagination.js'

const attendanceService = {
  async getAllReport(params = {}) {
    return { data: await collectPages((pageParams) => this.getReport(pageParams), params) }
  },

  async generateQr(
    sectionId,
  ) {
    const response =
      await api.get(
        `/asistencias/generar-qr/${sectionId}`,
      )

    return response.data
  },

  async registerAttendance(
    qrToken,
  ) {
    const response =
      await api.post(
        '/asistencias/registrar',
        {
          qr_token:
            qrToken,
        },
      )

    return response.data
  },

  async getMyHistory(
    params = {},
  ) {
    const response =
      await api.get(
        '/asistencias/historial',
        {
          params,
        },
      )

    return response.data
  },

  async getReport(
    params = {},
  ) {
    const response =
      await api.get(
        '/asistencias/reporte',
        {
          params,
        },
      )

    return response.data
  },
}

export default attendanceService
