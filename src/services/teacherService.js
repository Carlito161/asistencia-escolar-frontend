import api from './api'
import { collectPages } from './pagination'

const teacherService = {

  async getGrades(
    params = {},
  ) {
    const data = await collectPages(async (pageParams) =>
      (await api.get('/grados', { params: pageParams })).data, params)
    return { data }
  },

  async getSections(
    params = {},
  ) {
    const data = await collectPages(async (pageParams) =>
      (await api.get('/secciones', { params: pageParams })).data, params)
    return { data }
  },

  async getSection(
    sectionId,
  ) {
    const response =
      await api.get(
        `/secciones/${sectionId}`,
      )

    return (
      response.data?.data ??
      response.data
    )
  },

  async getStudentsBySection(
    sectionId,
  ) {
    const data = await collectPages(async (params) =>
      (await api.get('/estudiantes', { params })).data,
      { seccion_id: sectionId, estado: true })
    return { data }
  },
}

export default teacherService
