import { defineStore } from 'pinia'
import attendanceService from '../services/attendanceService.js'
import { collectPages } from '../services/pagination.js'
import { localDate, statusLabel } from '../utils/attendance.js'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    percentage: 0, present: 0, late: 0, absent: 0,
    todayStatus: 'Sin registrar', todayTime: '--',
    backendRegistration: null, records: [], loading: false, error: '', revision: 0,
  }),
  getters: { recentRecords: (state) => state.records.slice(0, 3) },
  actions: {
    clear() {
      const revision = this.revision + 1
      this.$reset()
      this.revision = revision
    },
    async loadHistory() {
      const revision = ++this.revision
      this.loading = true
      this.error = ''
      try {
        const rows = await collectPages((params) => attendanceService.getMyHistory(params))
        if (revision !== this.revision) return
        this.present = rows.filter((row) => row.estado === 'PRESENTE').length
        this.late = rows.filter((row) => row.estado === 'TARDIA').length
        this.absent = rows.filter((row) => row.estado === 'AUSENTE').length
        const total = this.present + this.late + this.absent
        this.percentage = total ? Math.round((this.present + this.late) / total * 100) : 0
        this.records = rows.map((row) => ({
          id: row.id, date: row.fecha_asistencia?.split('-').reverse().join('/'),
          time: row.hora_entrada || '--', status: statusLabel(row.estado),
          observations: row.observaciones || '',
        }))
        const today = rows.find((row) => row.fecha_asistencia === localDate())
        this.todayStatus = today ? statusLabel(today.estado) : 'Sin registrar'
        this.todayTime = today?.hora_entrada || '--'
      } catch (error) {
        if (revision === this.revision) this.error = error.userMessage || error.message
      } finally {
        if (revision === this.revision) this.loading = false
      }
    },
    registerBackendAttendance(data) {
      this.backendRegistration = { ...data, status: statusLabel(data.estado) }
      return this.backendRegistration
    },
  },
})
