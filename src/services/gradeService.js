import api from './api'

const gradeService = {

  async getGrades(
    params = {},
  ) {
    const response =
      await api.get(
        '/grados',
        {
          params,
        },
      )

    return response.data
  },

  async getGrade(
    gradeId,
  ) {
    const response =
      await api.get(
        `/grados/${gradeId}`,
      )

    return (
      response.data
        ?.data ??
      response.data
    )
  },

  async createGrade(
    payload,
  ) {
    const response =
      await api.post(
        '/grados',
        payload,
      )

    return response.data
  },

  async updateGrade(
    gradeId,
    payload,
  ) {
    const response =
      await api.put(
        `/grados/${gradeId}`,
        payload,
      )

    return response.data
  },

  async deactivateGrade(
    gradeId,
  ) {
    const response =
      await api.delete(
        `/grados/${gradeId}`,
      )

    return response.data
  },
}

export default gradeService