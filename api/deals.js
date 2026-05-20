import { verifyAuth } from './_lib/verifyAuth.js'
import { fetchAllDeals } from './_lib/airtable.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAuth(req)
    const deals = await fetchAllDeals()
    return res.status(200).json(deals)
  } catch (err) {
    const status = err.status ?? 500
    return res.status(status).json({ error: err.message ?? 'Request failed' })
  }
}
