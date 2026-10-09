export const statusLabel = (status) =>
  ({ PRESENTE: 'Presente', TARDIA: 'Tardanza', AUSENTE: 'Ausente' })[status] || 'Desconocido'

export const localDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

export const csvCell = (value) => {
  let text = String(value ?? '')
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}
