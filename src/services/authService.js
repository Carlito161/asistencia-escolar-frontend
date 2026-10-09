import api from './api'

const authService = {

  async login(email, password) {
    const response =
      await api.post(
        '/auth/login',
        {
          email,
          password,
        },
      )

    return response.data
  },

  async refresh(refreshToken) {
    const response =
      await api.post(
        '/auth/refresh',
        {
          refresh_token:
            refreshToken,
        },
      )

    return response.data
  },

  async logout() {
    const response =
      await api.post(
        '/auth/logout',
      )

    return response.data
  },
}

export default authService