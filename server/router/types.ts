import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { SearchRareItemsRoute } from './rare-items/search'

export type ApiRoutes = CreateChatRoute | GetChatRoute | SearchRareItemsRoute
