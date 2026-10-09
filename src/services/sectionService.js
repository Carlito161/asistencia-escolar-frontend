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
            ?.data || []
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

const sectionService = {

  async getSections(
    params = {},
  ) {
    const response =
      await api.get(
        '/secciones',
        {
          params,
        },
      )

    return response.data
  },

  async getSection(
    sectionId,
  ) {
    const response =
      await api.get(
        `/secciones/${sectionId}`,
      )

    return (
      response.data
        ?.data ??
      response.data
    )
  },

  async createSection(
    payload,
  ) {
    const response =
      await api.post(
        '/secciones',
        payload,
      )

    return response.data
  },

  async updateSection(
    sectionId,
    payload,
  ) {
    const response =
      await api.put(
        `/secciones/${sectionId}`,
        payload,
      )

    return response.data
  },

  async deactivateSection(
    sectionId,
  ) {
    const response =
      await api.delete(
        `/secciones/${sectionId}`,
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
}

export default sectionService