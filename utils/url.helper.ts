export const getChatUrl = (uniqueKey: string) => {
  return `/chats/${uniqueKey}`
}

export const getPromptGroupUrl = (uniqueKey: string) => {
  return `/pg/${uniqueKey}`
}

export const getUsersLimitExceedUrl = () => {
  return '/errors/users-limit-exceed'
}

export const rootUrl = () => {
  return '/'
}

export const errorUrl = () => {
  return '/error'
}
