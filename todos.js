export function toCsv(todos) {
  const header = ['id', 'title', 'description', 'state', 'createdAt', 'updatedAt']

  const escapeField = (value) => {
    const str = value == null ? '' : String(value)
    return `"${str.replace(/"/g, '""')}"`
  }

  const rows = todos.map((item) => [
    escapeField(item.id),
    escapeField(item.title),
    escapeField(item.description ?? ''),
    escapeField(item.state),
    escapeField(item.createdAt),
    escapeField(item.updatedAt)
  ])

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n')
}