import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import {
  AUTH_STORAGE_KEY,
} from '@/services/api'

const getSession =
  () => {
    try {
      const stored =
        localStorage.getItem(
          AUTH_STORAGE_KEY,
        )

      if (!stored) {
        return null
      }

      return JSON.parse(
        stored,
      )
    } catch (
      error
    ) {
      console.error(
        'Error leyendo sesión:',
        error,
      )

      return null
    }
  }

const homeByRole =
  (
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

const router =
  createRouter({
    history:
      createWebHistory(import.meta.env.BASE_URL),

    routes: [
      {
        path: '/',
        redirect:
          '/login',
      },

      {
        path:
          '/login',

        name:
          'login',

        component:
          () =>
            import(
              '@/views/loginview.vue'
            ),

        meta: {
          guestOnly:
            true,
        },
      },

      {
        path:
          '/admin',

        name:
          'admin-dashboard',

        component:
          () =>
            import(
              '@/views/AdminDashboardView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Administrador',
        },
      },

      {
        path:
          '/admin/estudiantes',

        name:
          'admin-students',

        component:
          () =>
            import(
              '@/views/AdminStudentsView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Administrador',
        },
      },

      {
        path:
          '/admin/roles',

        name:
          'admin-roles',

        component:
          () =>
            import(
              '@/views/AdminRolesView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Administrador',
        },
      },

      {
        path:
          '/admin/grados',

        name:
          'admin-grades',

        component:
          () =>
            import(
              '@/views/AdminGradesView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Administrador',
        },
      },

      {
        path:
          '/admin/secciones',

        name:
          'admin-sections',

        component:
          () =>
            import(
              '@/views/AdminSectionsView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Administrador',
        },
      },

      {
        path:
          '/admin/reportes',

        name:
          'admin-reports',

        component:
          () =>
            import(
              '@/views/AdminReportsView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Administrador',
        },
      },

      {
        path:
          '/docente',

        name:
          'teacher-dashboard',

        component:
          () =>
            import(
              '@/views/TeacherDashboardView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Docente',
        },
      },

      {
        path:
          '/docente/asistencia',

        name:
          'teacher-attendance',

        component:
          () =>
            import(
              '@/views/TeacherAttendanceView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Docente',
        },
      },

      {
        path:
          '/docente/reportes',

        name:
          'teacher-reports',

        component:
          () =>
            import(
              '@/views/TeacherReportsView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Docente',
        },
      },

      {
        path:
          '/estudiante',

        name:
          'student-dashboard',

        component:
          () =>
            import(
              '@/views/StudentDashboardView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Alumno',
        },
      },

      {
        path:
          '/estudiante/asistencia',

        name:
          'student-attendance',

        component:
          () =>
            import(
              '@/views/StudentAttendanceView.vue'
            ),

        meta: {
          requiresAuth:
            true,

          role:
            'Alumno',
        },
      },

      {
        path:
          '/:pathMatch(.*)*',

        redirect:
          '/login',
      },
    ],
  })

router.beforeEach(
  (
    to,
  ) => {
    const session =
      getSession()

    const authenticated =
      Boolean(
        session
          ?.accessToken && homeByRole(session?.role) !== '/login',
      )

    const role =
      session?.role

    if (
      to.meta
        .requiresAuth &&
      !authenticated
    ) {
      return '/login'
    }

    if (
      to.meta
        .guestOnly &&
      authenticated
    ) {
      return homeByRole(
        role,
      )
    }

    if (
      to.meta.role &&
      to.meta.role !==
        role
    ) {
      return homeByRole(
        role,
      )
    }

    return true
  },
)

export default router
