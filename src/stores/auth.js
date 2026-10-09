import {
  defineStore,
} from 'pinia'

import authService
  from '@/services/authService'
import { useAttendanceStore } from './Attendance'

import {
  AUTH_STORAGE_KEY,
} from '@/services/api'

const resolveHomeRoute = (
  role,
) => {
  switch (role) {
    case 'Administrador':
      return '/admin'

    case 'Docente':
      return '/docente'

    case 'Alumno':
      return '/estudiante'

    default:
      return '/login'
  }
}

export const useAuthStore =
  defineStore(
    'auth',
    {
      state: () => ({
        accessToken:
          null,

        refreshToken:
          null,

        role:
          null,

        expiresIn:
          null,

        email:
          null,
      }),

      getters: {
        isAuthenticated(
          state,
        ) {
          return Boolean(
            state.accessToken,
          )
        },

        isAdmin(
          state,
        ) {
          return (
            state.role ===
            'Administrador'
          )
        },

        isTeacher(
          state,
        ) {
          return (
            state.role ===
            'Docente'
          )
        },

        isStudent(
          state,
        ) {
          return (
            state.role ===
            'Alumno'
          )
        },

        homeRoute(
          state,
        ) {
          return resolveHomeRoute(
            state.role,
          )
        },
      },

      actions: {

        async login(
          credentials,
        ) {
          const response =
            await authService.login(
              credentials.email,
              credentials.password,
            )

          // Contrato de login: data.token contiene access_token, refresh_token y role.
          const token =
            response
              ?.data
              ?.token

          if (
            !token
              ?.access_token
          ) {
            throw new Error(
              'No fue posible iniciar sesión. La respuesta del sistema no es válida.',
            )
          }

          if (resolveHomeRoute(token.role) === '/login') {
            throw new Error(
              'No fue posible identificar el perfil del usuario.',
            )
          }

          this.accessToken =
            token.access_token

          this.refreshToken =
            token.refresh_token

          this.role =
            token.role

          this.expiresIn =
            token.expires_in

          this.email =
            credentials.email

          this.saveSession()

          return {
            role:
              this.role,

            homeRoute:
              resolveHomeRoute(
                this.role,
              ),
          }
        },

        saveSession() {
          const session = {
            accessToken:
              this.accessToken,

            refreshToken:
              this.refreshToken,

            role:
              this.role,

            expiresIn:
              this.expiresIn,

            email:
              this.email,
          }

          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(
              session,
            ),
          )
        },

        loadSession() {
          try {
            const stored =
              localStorage.getItem(
                AUTH_STORAGE_KEY,
              )

            if (!stored) {
              return
            }

            const session =
              JSON.parse(stored)

            this.accessToken =
              session.accessToken ||
              null

            this.refreshToken =
              session.refreshToken ||
              null

            this.role =
              session.role ||
              null

            this.expiresIn =
              session.expiresIn ||
              null

            this.email =
              session.email ||
              null
          } catch (error) {
            console.error(
              'Error cargando sesión:',
              error,
            )

            this.clearSession()
          }
        },

        async logout() {
          try {
            if (
              this.accessToken
            ) {
              await authService
                .logout()
            }
          } catch (error) {

            console.error(
              'Error cerrando sesión:',
              error,
            )
          } finally {
            this.clearSession()
          }
        },

        clearSession() {
          useAttendanceStore().clear()
          this.accessToken =
            null

          this.refreshToken =
            null

          this.role =
            null

          this.expiresIn =
            null

          this.email =
            null

          localStorage.removeItem(
            AUTH_STORAGE_KEY,
          )
        },
      },
    },
  )

export {
  resolveHomeRoute,
}
