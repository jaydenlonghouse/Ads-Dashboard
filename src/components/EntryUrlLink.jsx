function hrefFor(url) {
  const s = String(url ?? '').trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function labelFor(url) {
  const href = hrefFor(url)
  if (!href) return null
  try {
    const u = new URL(href)
    const path = u.pathname === '/' ? '' : u.pathname
    return `${u.host}${path}`
  } catch {
    return String(url).trim()
  }
}

export default function EntryUrlLink({ url }) {
  const href = hrefFor(url)
  if (!href) return <span className="text-ink-400">—</span>

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-[16rem] truncate text-brand-800 underline-offset-2 hover:underline"
      title={href}
    >
      {labelFor(url)}
    </a>
  )
}
