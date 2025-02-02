import { CreateDocumentRoute } from './documents/create'
import { GetDocumentRoute } from './documents/show'
import { SearchRareItemsRoute } from './rare-items/search'

export type ApiRoutes = CreateDocumentRoute | GetDocumentRoute | SearchRareItemsRoute
