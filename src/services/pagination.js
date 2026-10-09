export async function collectPages(fetchPage, params = {}) {
  const records = []
  let page = 1
  let lastPage = 1
  do {
    const response = await fetchPage({ ...params, page, per_page: 100 })
    if (!Array.isArray(response?.data)) throw new Error('La API no devolvió una lista válida.')
    records.push(...response.data)
    lastPage = Number(response.meta?.last_page ?? 1)
    if (!Number.isInteger(lastPage) || lastPage < page) throw new Error('Paginación inválida en la API.')
    page += 1
  } while (page <= lastPage)
  return records
}
