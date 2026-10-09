import { defineStore } from 'pinia'

export const ATTENDANCE_SESSION_STORAGE_KEY =
  'attendance_qr_session_v1'

const readStorage = () => {
  try {
    const value =
      localStorage.getItem(
        ATTENDANCE_SESSION_STORAGE_KEY,
      )

    if (!value) {
      return null
    }

    return JSON.parse(value)
  } catch (error) {
    console.error(
      'Error leyendo la sesión de asistencia:',
      error,
    )

    return null
  }
}

export const useAttendanceSessionStore =
  defineStore(
    'attendanceSession',
    {
      state: () => ({
        session: null,

        records: [],
      }),

      getters: {
        hasActiveSession(state) {
          return Boolean(
            state.session?.active,
          )
        },

        activeSession(state) {
          if (
            !state.session?.active
          ) {
            return null
          }

          return state.session
        },

        attendanceCount(state) {
          return state.records.length
        },

        presentCount(state) {
          return state.records.filter(
            (record) =>
              record.status ===
              'Presente',
          ).length
        },

        lateCount(state) {
          return state.records.filter(
            (record) =>
              record.status ===
              'Tardanza',
          ).length
        },
      },

      actions: {

        persist() {
          try {
            localStorage.setItem(
              ATTENDANCE_SESSION_STORAGE_KEY,
              JSON.stringify({
                session:
                  this.session,

                records:
                  this.records,
              }),
            )
          } catch (error) {
            console.error(
              'Error guardando la sesión:',
              error,
            )
          }
        },

        loadFromStorage() {
          const stored =
            readStorage()

          if (!stored) {
            return
          }

          this.session =
            stored.session || null

          this.records =
            Array.isArray(
              stored.records,
            )
              ? stored.records
              : []
        },

        createSession(
          classData,
        ) {
          const now =
            new Date()

          const sessionId =
            `${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()}`

          this.session = {
            id: sessionId,

            classId:
              classData.id,

            subject:
              classData.subject,

            grade:
              classData.grade,

            level:
              classData.level,

            room:
              classData.room,

            schedule:
              classData.time,

            createdAt:
              now.getTime(),

            startTime:
              now.toLocaleTimeString(
                'es-SV',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              ),

            active: true,
          }

          this.records = []

          this.persist()

          return this.session
        },

        regenerateSession(
          classData,
        ) {
          const now =
            new Date()

          const newSessionId =
            `${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()}`

          this.session = {
            id: newSessionId,

            classId:
              classData.id,

            subject:
              classData.subject,

            grade:
              classData.grade,

            level:
              classData.level,

            room:
              classData.room,

            schedule:
              classData.time,

            createdAt:
              now.getTime(),

            startTime:
              this.session
                ?.startTime ||
              now.toLocaleTimeString(
                'es-SV',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              ),

            active: true,
          }

          this.persist()

          return this.session
        },

        finishSession() {
          if (!this.session) {
            return
          }

          this.session.active =
            false

          this.persist()
        },

        getQrContent() {
          if (
            !this.session ||
            !this.session.active
          ) {
            return null
          }

          return [
            'ASISTENCIA',

            this.session.id,

            this.session.classId,

            this.session.grade,

            this.session.subject,

            this.session.createdAt,
          ].join('|')
        },

        validateSession(
          qrData,
        ) {

          this.loadFromStorage()

          if (!this.session) {
            return {
              success: false,
              reason:
                'NO_SESSION',
            }
          }

          if (
            !this.session.active
          ) {
            return {
              success: false,
              reason:
                'SESSION_CLOSED',
            }
          }

          if (
            qrData.sessionId !==
            this.session.id
          ) {
            return {
              success: false,
              reason:
                'OLD_SESSION',
            }
          }

          if (
            String(
              qrData.classId,
            ) !==
            String(
              this.session.classId,
            )
          ) {
            return {
              success: false,
              reason:
                'WRONG_SESSION',
            }
          }

          return {
            success: true,
          }
        },

        registerStudent(
          student,
          status = 'Presente',
        ) {

          this.loadFromStorage()

          if (
            !this.session ||
            !this.session.active
          ) {
            return {
              success: false,

              reason:
                'SESSION_CLOSED',

              message:
                'La sesión de asistencia ya no está activa.',
            }
          }

          const existingRecord =
            this.records.find(
              (record) =>
                record.studentId ===
                  student.id &&
                record.sessionClassId ===
                  this.session
                    .classId,
            )

          if (
            existingRecord
          ) {
            return {
              success: false,

              reason:
                'ALREADY_REGISTERED',

              message:
                'Ya registraste tu asistencia en esta clase.',

              record:
                existingRecord,
            }
          }

          const now =
            new Date()

          const record = {
            id:
              `${Date.now()}-${student.id}`,

            studentId:
              student.id,

            student:
              student.name,

            grade:
              student.grade,

            time:
              now.toLocaleTimeString(
                'es-SV',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              ),

            status,

            sessionId:
              this.session.id,

            sessionClassId:
              this.session.classId,

            subject:
              this.session.subject,
          }

          this.records.unshift(
            record,
          )

          this.persist()

          return {
            success: true,
            record,
          }
        },
      },
    },
  )