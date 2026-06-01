import { Transform } from 'class-transformer'

/**
 * Transforms incoming string dates (e.g. "2024-02-15") to JavaScript Date objects.
 * Use on any DateTime field in DTOs so Prisma receives the correct type.
 */
export function TransformDate() {
  return Transform(({ value }) => {
    if (!value) return null
    if (value instanceof Date) return value
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  })
}