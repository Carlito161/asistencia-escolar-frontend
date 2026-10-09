import api from './api'

const getAllPages = async (
  endpoint,
  params = {},
) => {
  let page = 1
  let lastPage = 1
  const records = []

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

    const body =
      response.data

    records.push(
      ...(body?.data || []),
    )

    lastPage =
      body?.meta?.last_page ||
      1

    page += 1
  } while (
    page <= lastPage
  )

  return records
}

const studentService = {

  async getStudents(
    params = {},
  ) {
    const response =
      await api.get(
        '/estudiantes',
        {
          params,
        },
      )

    return response.data
  },

  async getStudent(
    studentId,
  ) {
    const response =
      await api.get(
        `/estudiantes/${studentId}`,
      )

    return (
      response.data?.data ??
      response.data
    )
  },

  async createStudent(
    payload,
  ) {
    const response =
      await api.post(
        '/estudiantes',
        payload,
      )

    return response.data
  },

  async updateStudent(
    studentId,
    payload,
  ) {
    const response =
      await api.put(
        `/estudiantes/${studentId}`,
        payload,
      )

    return response.data
  },

  async deactivateStudent(
    studentId,
  ) {
    const response =
      await api.delete(
        `/estudiantes/${studentId}`,
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
}

export default studentService