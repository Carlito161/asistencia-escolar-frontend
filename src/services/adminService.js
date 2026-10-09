import api from './api'

const getLocalDate =
  () => {
    const now =
      new Date()

    const year =
      now.getFullYear()

    const month =
      String(
        now.getMonth() + 1,
      ).padStart(
        2,
        '0',
      )

    const day =
      String(
        now.getDate(),
      ).padStart(
        2,
        '0',
      )

    return (
      `${year}-${month}-${day}`
    )
  }

const getTotal =
  (response) => {
    return (
      response
        ?.data
        ?.meta
        ?.total ||
      0
    )
  }

const adminService = {

  async getDashboard() {
    const today =
      getLocalDate()

    const [
      studentsResponse,
      gradesResponse,
      sectionsResponse,
      todayResponse,
      presentResponse,
      lateResponse,
      absentResponse,
    ] =
      await Promise.all([

        api.get(
          '/estudiantes',
          {
            params: {
              estado: true,
              per_page: 1,
            },
          },
        ),

        api.get(
          '/grados',
          {
            params: {
              estado: true,
            },
          },
        ),

        api.get(
          '/secciones',
          {
            params: {
              estado: true,
            },
          },
        ),

        api.get(
          '/asistencias/reporte',
          {
            params: {
              fecha_desde:
                today,

              fecha_hasta:
                today,

              per_page: 8,
            },
          },
        ),

        api.get(
          '/asistencias/reporte',
          {
            params: {
              fecha_desde:
                today,

              fecha_hasta:
                today,

              estado:
                'PRESENTE',

              per_page: 1,
            },
          },
        ),

        api.get(
          '/asistencias/reporte',
          {
            params: {
              fecha_desde:
                today,

              fecha_hasta:
                today,

              estado:
                'TARDIA',

              per_page: 1,
            },
          },
        ),

        api.get(
          '/asistencias/reporte',
          {
            params: {
              fecha_desde:
                today,

              fecha_hasta:
                today,

              estado:
                'AUSENTE',

              per_page: 1,
            },
          },
        ),
      ])

    return {
      date:
        today,

      students:
        getTotal(
          studentsResponse,
        ),

      grades:
        getTotal(
          gradesResponse,
        ),

      sections:
        getTotal(
          sectionsResponse,
        ),

      attendanceToday:
        getTotal(
          todayResponse,
        ),

      present:
        getTotal(
          presentResponse,
        ),

      late:
        getTotal(
          lateResponse,
        ),

      absent:
        getTotal(
          absentResponse,
        ),

      recent:
        todayResponse
          ?.data
          ?.data ||
        [],
    }
  },
}

export default adminService