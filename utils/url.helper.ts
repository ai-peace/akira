export const getChatUrl = (uniqueKey: string) => {
  return `/chats/${uniqueKey}`
}

export const getPromptGroupUrl = (uniqueKey: string) => {
  return `/pg/${uniqueKey}`
}

export const rootUrl = () => {
  return '/'
}

export const errorUrl = () => {
  return '/error'
}
