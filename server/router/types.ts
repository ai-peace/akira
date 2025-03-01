import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'
import { GetChatCollectionRoute } from './chats'
import { GetUserPrivateRoute } from './user-privates/show'
import { CreateUserPrivateRoute } from './user-privates/create'
import { UpdateUserPrivateRoute } from './user-privates/update'

export type ApiRoutes =
  | CreateChatRoute
  | GetChatRoute
  | CreateChatPromptGroupRoute
  | GetChatCollectionRoute
  | GetUserPrivateRoute
  | CreateUserPrivateRoute
  | UpdateUserPrivateRoute
