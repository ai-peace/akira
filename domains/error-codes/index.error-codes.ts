// クライアントサイドで利用するサーバーエラー型
export class HcApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'HcApiError'
  }
}
