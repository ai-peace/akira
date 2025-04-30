import { CreateChatRoute } from './chats/create'
import { GetChatRoute } from './chats/show'
import { CreateChatPromptGroupRoute } from './chats/prompt-groups/create'
import { GetUserPrivateRoute } from './user-privates/show'
import { CreateUserPrivateRoute } from './user-privates/create'
import { UpdateUserPrivateRoute } from './user-privates/update'
import { GetUserPrivateChatCollectionRoute } from './user-privates/chats'
import { InitializeUserPromptUsageRoute } from './user-prompt-usages/initialize'
import { UpsertUserPromptUsageRoute } from './user-prompt-usages/upsert'
import { GetPromptGroupRoute } from './prompt-groups/show'
import { CreateWaitListRoute } from './wait-lists/create'
import { CreateVoiceChatRoute } from './voice-chats/create'
import { CreateVoiceChatPromptGroupRoute } from './voice-chats/prompt-groups/create'

export type ApiRoutes =
  | CreateChatRoute
  | CreateVoiceChatRoute
  | GetChatRoute
  | CreateChatPromptGroupRoute
  | GetUserPrivateRoute
  | CreateUserPrivateRoute
  | UpdateUserPrivateRoute
  | GetUserPrivateChatCollectionRoute
  | InitializeUserPromptUsageRoute
  | UpsertUserPromptUsageRoute
  | GetPromptGroupRoute
  | CreateWaitListRoute
  | CreateVoiceChatPromptGroupRoute
