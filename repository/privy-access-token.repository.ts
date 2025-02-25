const get = async (): Promise<string | null> => {
  const str = await localStorage.getItem('privy:token')
  return str ? str.replace(/"/g, '') : null
}

const remove = async () => {
  try {
    await localStorage.removeItem('privy:token')
    window.dispatchEvent(new Event('storage'))
  } catch (e) {
    throw e
  }
}

export const PrivyAccessTokenRepository = {
  get,
  remove,
}
