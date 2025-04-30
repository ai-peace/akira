// ESM互換のPrismaClient
import pkg from '@prisma/client'
const { PrismaClient } = pkg

export class PrismaService extends PrismaClient {
  private static instance: PrismaService

  private constructor() {
    super({
      log: [], // すべてのログを完全に無効化
      errorFormat: 'minimal',
    })
  }

  public static getInstance(): PrismaService {
    if (!this.instance) {
      this.instance = new PrismaService()
    }
    return this.instance
  }

  async connect() {
    await this.$connect()
  }

  async disconnect() {
    await this.$disconnect()
  }
}

export const prisma = PrismaService.getInstance()
