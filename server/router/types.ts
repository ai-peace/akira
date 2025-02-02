import { CreateDocumentRoute } from './documents/create'
import { GenerateTableOfContentRoute } from './documents/generate-table-of-content'
import { GetDocumentRoute } from './documents/show'
import { SyncDocumentRoute } from './documents/sync'
import { UpdateDocumentRoute } from './documents/update'

export type ApiRoutes =
  | CreateDocumentRoute
  | UpdateDocumentRoute
  | GetDocumentRoute
  | GenerateTableOfContentRoute
  | SyncDocumentRoute
