import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { SearchRareItemsRoute } from './rare-items/search'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'

export type ApiRoutes =
  | CreateChatRoute
  | GetChatRoute
  | SearchRareItemsRoute
  | CreateChatPromptGroupRoute
