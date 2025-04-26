export function mapToOpenAPISchema(obj: any): any {
  if (Array.isArray(obj)) {
    return {
      type: 'array',
      items: mapToOpenAPISchema(obj[0] ?? {}),
    }
  }

  if (typeof obj === 'object' && obj !== null) {
    const properties: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      properties[key] = mapToOpenAPISchema(value)
    }
    return { type: 'object', properties }
  }

  if (typeof obj === 'string') {
    return { type: 'string' }
  }

  if (typeof obj === 'number') {
    return { type: 'number' }
  }

  if (typeof obj === 'boolean') {
    return { type: 'boolean' }
  }

  if (obj instanceof Date) {
    return { type: 'string', format: 'date-time' }
  }

  return { type: 'string' }
}
