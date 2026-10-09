import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useAttendanceStore } from '../src/stores/Attendance.js'
import service from '../src/services/attendanceService.js'
import { localDate } from '../src/utils/attendance.js'

test('Store sin datos de prueba, carga real y limpieza entre sesiones', async () => {
  setActivePinia(createPinia())
  const store = useAttendanceStore()
  assert.equal(store.records.length, 0)
  assert.equal(store.percentage, 0)
  const original = service.getMyHistory
  try {
    service.getMyHistory = async () => ({
      data: [
        { id: 1, estado: 'AUSENTE', fecha_asistencia: localDate(), hora_entrada: '09:00:00' },
        { id: 2, estado: 'PRESENTE', fecha_asistencia: '2026-01-01', observaciones: 'Texto libre' },
        { id: 3, estado: 'TARDIA', fecha_asistencia: '2026-01-02', observaciones: 'Texto libre' },
      ], meta: { last_page: 1 },
    })
    await store.loadHistory()
    assert.equal(store.present, 1)
    assert.equal(store.late, 1)
    assert.equal(store.absent, 1)
    assert.equal(store.percentage, 67)
    assert.equal(store.todayStatus, 'Ausente')
    store.clear()
    assert.equal(store.records.length, 0)
    assert.equal(store.todayStatus, 'Sin registrar')
  } finally { service.getMyHistory = original }
})

test('Respuesta pendiente no repuebla datos después de logout', async () => {
  setActivePinia(createPinia())
  const store = useAttendanceStore()
  const original = service.getMyHistory
  let resolve
  try {
    service.getMyHistory = () => new Promise((done) => { resolve = done })
    const request = store.loadHistory()
    store.clear()
    resolve({ data: [{ id: 1, estado: 'PRESENTE' }], meta: { last_page: 1 } })
    await request
    assert.equal(store.records.length, 0)
    assert.equal(store.present, 0)
  } finally { service.getMyHistory = original }
})
