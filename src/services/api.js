import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, ''),
  timeout: 15000,

  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export const AUTH_STORAGE_KEY =
  'asistencia_qr_auth_v1'

export const getStoredSession = () => {
  try {
    const stored =
      localStorage.getItem(
        AUTH_STORAGE_KEY,
      )

    if (!stored) {
      return null
    }

    return JSON.parse(stored)
  } catch (error) {
    console.error(
      'No fue posible leer la sesión:',
      error,
    )

    return null
  }
}

api.interceptors.request.use(
  (config) => {
    const session =
      getStoredSession()

    if (session?.accessToken) {
      config._authToken = session.accessToken
      config.headers.Authorization =
        `Bearer ${session.accessToken}`
    }

    return config
  },

  (error) => {
    return Promise.reject(error)
  },
)

// Ignora un 401 de una petición antigua si el usuario ya cambió de sesión.
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status >= 500) {
      error.response.data = { message: 'Ocurrió un error interno en el servidor. Inténtalo nuevamente o informa al equipo backend.' }
    }
    error.userMessage = error.response?.data?.message || (error.response
      ? 'El servidor no pudo completar la solicitud.'
      : 'No fue posible conectar con el sistema. Verifica tu conexión e inténtalo nuevamente.')
    if (error.response?.status === 401 && error.config?.url !== '/auth/login'
      && error.config?._authToken === getStoredSession()?.accessToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      window.dispatchEvent(new Event('auth:expired'))
    }

    return Promise.reject(error)
  },
)

export default api
