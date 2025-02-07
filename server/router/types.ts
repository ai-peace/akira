import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { SearchRareItemsRoute } from './rare-items/search'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'
import { GetChatCollectionRoute } from './chats'

export type ApiRoutes =
  | CreateChatRoute
  | GetChatRoute
  | SearchRareItemsRoute
  | CreateChatPromptGroupRoute
  | GetChatCollectionRoute
