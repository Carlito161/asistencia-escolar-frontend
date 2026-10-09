import api from './api'

const roleService = {
  async getRoles() {
    const response =
      await api.get('/roles')

    return (
      response.data
        ?.data
        ?.data ?? []
    )
  },

  async getPermissions() {
    const response =
      await api.get(
        '/permissions',
      )

    return (
      response.data
        ?.data
        ?.data ?? []
    )
  },

  async createRole(payload) {
    const response =
      await api.post(
        '/roles',
        payload,
      )

    return (
      response.data
        ?.data ?? null
    )
  },

  async updateRole(
    roleId,
    payload,
  ) {
    const response =
      await api.put(
        `/roles/${roleId}`,
        payload,
      )

    return (
      response.data
        ?.data ?? null
    )
  },

  async deleteRole(roleId) {
    const response =
      await api.delete(
        `/roles/${roleId}`,
      )

    return response.data
  },
}

export default roleService