import { PrismaClient } from '@prisma/client'

export class PrismaService extends PrismaClient {
  private static instance: PrismaService

  private constructor() {
    super()
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
