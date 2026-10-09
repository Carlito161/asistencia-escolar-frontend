import test from 'node:test'
import assert from 'node:assert/strict'
import { csvCell, statusLabel, localDate } from '../src/utils/attendance.js'
import { collectPages } from '../src/services/pagination.js'

test('Estados explícitos del backend, sin interpretar observaciones', () => {
  assert.equal(statusLabel('PRESENTE'), 'Presente')
  assert.equal(statusLabel('TARDIA'), 'Tardanza')
  assert.equal(statusLabel('AUSENTE'), 'Ausente')
  assert.equal(statusLabel('otro'), 'Desconocido')
})

test('CSV escapa comillas y neutraliza fórmulas', () => {
  assert.equal(csvCell('Juan "A"'), '"Juan ""A"""')
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '  =1', '\ttexto']) {
    assert.ok(csvCell(value).startsWith('"\''))
  }
  assert.equal(csvCell(null), '""')
})

test('Fecha escolar tiene formato ISO', () => {
  assert.match(localDate(), /^\d{4}-\d{2}-\d{2}$/)
})

test('Paginación reúne todas las páginas y conserva filtros', async () => {
  const calls = []
  const result = await collectPages(async (params) => {
    calls.push(params)
    return { data: [params.page], meta: { last_page: 3 } }
  }, { seccion_id: 7 })
  assert.deepEqual(result, [1, 2, 3])
  assert.equal(calls[2].seccion_id, 7)
  assert.equal(calls[2].per_page, 100)
})

test('Respuesta inválida y errores de red no producen listas parciales', async () => {
  await assert.rejects(collectPages(async () => ({ data: null })))
  await assert.rejects(collectPages(async () => { throw new Error('red') }))
})
