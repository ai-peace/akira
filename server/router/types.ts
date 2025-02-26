import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'
import { GetChatCollectionRoute } from './chats'
import { GetUserPrivateRoute } from './user-privates/show'
import { CreateUserPrivateRoute } from './user-privates/create'

export type ApiRoutes =
  | CreateChatRoute
  | GetChatRoute
  | CreateChatPromptGroupRoute
  | GetChatCollectionRoute
  | GetUserPrivateRoute
  | CreateUserPrivateRoute
