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
import { CreateDepositRoute } from './deposits/create'
import { MintNftRoute } from './nfts/mint'
import { NftStatusRoute } from './nfts/status'
import { ListNftsRoute } from './nfts/list'

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
  | GetPromptGroupRoute
  | CreateWaitListRoute
  | CreateDepositRoute
  | MintNftRoute
  | NftStatusRoute
  | ListNftsRoute
