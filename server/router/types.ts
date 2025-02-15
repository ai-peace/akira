import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'
import { GetChatCollectionRoute } from './chats'

export type ApiRoutes =
  | CreateChatRoute
  | GetChatRoute
  | CreateChatPromptGroupRoute
  | GetChatCollectionRoute
