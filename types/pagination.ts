export type PaginationParams = {
  page: number
  limit: number
  orderBy: string
  order: 'asc' | 'desc'
}

export type PaginationMeta = {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: PaginationMeta
}
