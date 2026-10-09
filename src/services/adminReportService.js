import api from './api'

const getAllPages =
  async (
    endpoint,
    params = {},
  ) => {
    const records = []

    let page = 1
    let lastPage = 1

    do {
      const response =
        await api.get(
          endpoint,
          {
            params: {
              ...params,
              page,
            },
          },
        )

      records.push(
        ...(
          response.data
            ?.data ||
          []
        ),
      )

      lastPage =
        response.data
          ?.meta
          ?.last_page ||
        1

      page += 1
    } while (
      page <= lastPage
    )

    return records
  }

const adminReportService = {

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

  async getActiveGrades() {
    return await getAllPages(
      '/grados',
      {
        estado: true,
      },
    )
  },

  async getActiveSections() {
    return await getAllPages(
      '/secciones',
      {
        estado: true,
      },
    )
  },

  async getAllReportRecords(
    params = {},
  ) {
    const records = []

    let page = 1
    let lastPage = 1

    do {
      const response =
        await api.get(
          '/asistencias/reporte',
          {
            params: {
              ...params,
              page,
              per_page: 100,
            },
          },
        )

      records.push(
        ...(
          response.data
            ?.data ||
          []
        ),
      )

      lastPage =
        response.data
          ?.meta
          ?.last_page ||
        1

      page += 1
    } while (
      page <= lastPage
    )

    return records
  },
}

export default adminReportService