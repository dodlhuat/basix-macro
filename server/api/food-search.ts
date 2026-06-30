export default defineEventHandler(async (event) => {
  const { q } = getQuery(event) as { q?: string }

  if (!q?.trim()) {
    return { hits: [] }
  }

  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=10&fields=code,product_name,brands,serving_quantity,serving_size,nutriments`

  const data = await $fetch<{ hits: unknown[] }>(url).catch(() => ({ hits: [] }))

  return { hits: data.hits ?? [] }
})
