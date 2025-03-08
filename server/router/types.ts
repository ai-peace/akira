import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'
import { GetUserPrivateRoute } from './user-privates/show'
import { CreateUserPrivateRoute } from './user-privates/create'
import { UpdateUserPrivateRoute } from './user-privates/update'
import { GetUserPrivateChatCollectionRoute } from './user-privates/chats'
import { InitializeUserPromptUsageRoute } from './user-prompt-usages/initialize'
import { UpsertUserPromptUsageRoute } from './user-prompt-usages/upsert'

export type ApiRoutes =
  | CreateChatRoute
  | GetChatRoute
  | CreateChatPromptGroupRoute
  | GetUserPrivateRoute
  | CreateUserPrivateRoute
  | UpdateUserPrivateRoute
  | GetUserPrivateChatCollectionRoute
  | InitializeUserPromptUsageRoute
  | UpsertUserPromptUsageRoute
