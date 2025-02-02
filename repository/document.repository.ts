import { hcClient } from '@/api-client/hc.api-client'
import { DocumentEntity } from '@/domains/entities/document.entity'
import type { InferRequestType } from 'hono/client'
import { getIndexedDB } from '@/lib/indexed-db'

// 型定義
const client = hcClient()
export type CreateDocumentInput = InferRequestType<typeof client.documents.$post>
export type UpdateDocumentInput = InferRequestType<
  (typeof client.documents)[':uniqueKey']['$patch']
>
export type GenerateTableOfContentInput = InferRequestType<
  (typeof client.documents)[':uniqueKey']['generate-table-of-content']['$put']
>

export type FetchStrategy = {
  mode: 'online-first' | 'offline-first' | 'version-compare' | 'online-only' | 'offline-only'
  forceRefresh?: boolean
}

export type SaveStrategy = {
  mode: 'online-only' | 'offline-only' | 'both'
}

const convertToEntity = (data: any): DocumentEntity => ({
  ...data,
  updatedAt: new Date(data.updatedAt),
  createdAt: new Date(data.createdAt),
  llmStatusChangeAt: data.llmStatusChangeAt ? new Date(data.llmStatusChangeAt) : undefined,
})

const onlineRepository = {
  get: async (uniqueKey: string): Promise<DocumentEntity | null> => {
    try {
      const client = hcClient()
      const res = await client.documents[':uniqueKey'].$get({ param: { uniqueKey } })
      const json = await res.json()
      return 'data' in json ? convertToEntity(json.data) : null
    } catch (error) {
      console.error('Error fetching document:', error)
      throw error
    }
  },

  create: async (input: CreateDocumentInput): Promise<DocumentEntity> => {
    try {
      const client = hcClient()
      const res = await client.documents.$post({ json: input.json })
      const json = await res.json()
      if (!('data' in json)) throw new Error('Failed to create document')
      return convertToEntity(json.data)
    } catch (error) {
      console.error('Error creating document:', error)
      throw error
    }
  },

  update: async (input: UpdateDocumentInput): Promise<DocumentEntity> => {
    try {
      const client = hcClient()
      const res = await client.documents[':uniqueKey']['$patch']({
        param: { uniqueKey: input.param.uniqueKey },
        json: input.json,
      })
      const json = await res.json()
      if (!('data' in json)) throw new Error('Failed to update document')
      return convertToEntity(json.data)
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  },

  generateTableOfContent: async (input: GenerateTableOfContentInput): Promise<DocumentEntity> => {
    try {
      const client = hcClient()
      const res = await client.documents[':uniqueKey']['generate-table-of-content']['$put']({
        param: { uniqueKey: input.param.uniqueKey },
        json: input.json,
      })
      const json = await res.json()
      if (!('data' in json)) throw new Error('Failed to generate table of content')
      return convertToEntity(json.data)
    } catch (error) {
      console.error('Error generating table of content:', error)
      throw error
    }
  },

  sync: async (uniqueKey: string, content: string): Promise<DocumentEntity> => {
    try {
      const client = hcClient()
      const res = await client.documents[':uniqueKey']['sync'].$patch({
        param: { uniqueKey },
        json: { content },
      })
      const json = await res.json()
      if (!('data' in json)) throw new Error('Failed to sync document')
      return convertToEntity(json.data)
    } catch (error) {
      console.error('Error syncing document:', error)
      throw error
    }
  },
}

const offlineRepository = {
  get: async (uniqueKey: string): Promise<DocumentEntity | null> => {
    const db = await getIndexedDB()
    const data = await db.get('documents', uniqueKey)
    return data
  },

  save: async (uniqueKey: string, document: DocumentEntity): Promise<void> => {
    const db = await getIndexedDB()
    const documentToSave = {
      ...document,
      uniqueKey,
    }

    await db.put('documents', documentToSave)
  },

  delete: async (uniqueKey: string): Promise<void> => {
    const db = await getIndexedDB()
    await db.delete('documents', uniqueKey)
  },
}

// メインリポジトリ
export const documentRepository = {
  get: async (
    uniqueKey: string,
    strategy: FetchStrategy = { mode: 'version-compare' },
  ): Promise<DocumentEntity | null> => {
    switch (strategy.mode) {
      case 'online-first':
        try {
          const onlineDoc = await onlineRepository.get(uniqueKey)
          if (onlineDoc) {
            await offlineRepository.save(uniqueKey, onlineDoc)
            return onlineDoc
          }
          return await offlineRepository.get(uniqueKey)
        } catch (error) {
          return await offlineRepository.get(uniqueKey)
        }

      case 'offline-first':
        try {
          const offlineDoc = await offlineRepository.get(uniqueKey)
          if (offlineDoc) return offlineDoc

          const onlineDoc = await onlineRepository.get(uniqueKey)
          if (onlineDoc) {
            await offlineRepository.save(uniqueKey, onlineDoc)
          }
          return onlineDoc
        } catch {
          return null
        }

      case 'version-compare':
        try {
          console.log('case: version-compare', uniqueKey)
          const [offlineDoc, onlineDoc] = await Promise.all([
            offlineRepository.get(uniqueKey),
            onlineRepository.get(uniqueKey).catch(() => null),
          ])

          if (!offlineDoc && !onlineDoc) return null
          if (!offlineDoc) return onlineDoc
          if (!onlineDoc) return offlineDoc

          const isOnlineNewer = new Date(onlineDoc.updatedAt) > new Date(offlineDoc.updatedAt)
          const latestDoc = isOnlineNewer ? onlineDoc : offlineDoc

          if (isOnlineNewer) {
            await offlineRepository.save(uniqueKey, onlineDoc)
          }

          return latestDoc
        } catch {
          return await offlineRepository.get(uniqueKey)
        }

      case 'online-only':
        return await onlineRepository.get(uniqueKey)

      case 'offline-only':
        return await offlineRepository.get(uniqueKey)
    }
  },

  create: async (
    input: CreateDocumentInput,
    strategy: SaveStrategy = { mode: 'online-only' },
  ): Promise<DocumentEntity> => {
    switch (strategy.mode) {
      case 'online-only':
        return await onlineRepository.create(input)

      case 'offline-only':
        const offlineDoc: DocumentEntity = {
          ...input.json,
          uniqueKey: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          llmStatus: 'SUCCESS',
          llmStatusChangeAt: new Date(),
          setting: input.json.setting
            ? {
                uniqueKey: crypto.randomUUID(),
                prompt: input.json.setting.prompt,
                additionals: input.json.setting.additionals,
              }
            : undefined,
        }
        await offlineRepository.save(offlineDoc.uniqueKey, offlineDoc)
        return offlineDoc

      case 'both':
        const doc = await onlineRepository.create(input)
        await offlineRepository.save(doc.uniqueKey, doc)
        return doc
    }
  },

  update: async (
    input: UpdateDocumentInput,
    strategy: SaveStrategy = { mode: 'online-only' },
  ): Promise<DocumentEntity> => {
    switch (strategy.mode) {
      case 'online-only':
        return await onlineRepository.update(input)

      case 'offline-only':
        const currentDoc = await offlineRepository.get(input.param.uniqueKey)
        if (!currentDoc) throw new Error('Document not found in offline storage')

        const updatedDoc: DocumentEntity = {
          ...currentDoc,
          ...input.json,
          updatedAt: new Date(),
          setting: input.json.setting
            ? {
                uniqueKey: currentDoc.setting?.uniqueKey || crypto.randomUUID(),
                prompt: input.json.setting.prompt,
                additionals: input.json.setting.additionals,
              }
            : currentDoc.setting,
        }
        await offlineRepository.save(updatedDoc.uniqueKey, updatedDoc)
        return updatedDoc

      case 'both':
        const doc = await onlineRepository.update(input)
        await offlineRepository.save(doc.uniqueKey, doc)
        return doc
    }
  },

  upsert: async (
    input: CreateDocumentInput | UpdateDocumentInput,
    strategy: SaveStrategy = { mode: 'both' },
  ): Promise<DocumentEntity> => {
    const isUpdate = 'param' in input

    switch (strategy.mode) {
      case 'online-only':
        return isUpdate
          ? await onlineRepository.update(input as UpdateDocumentInput)
          : await onlineRepository.create(input as CreateDocumentInput)

      case 'offline-only':
        if (isUpdate) {
          const uniqueKey = (input as UpdateDocumentInput).param.uniqueKey
          const currentDoc = await offlineRepository.get(uniqueKey)

          const updatedDoc: DocumentEntity = currentDoc
            ? {
                ...currentDoc,
                ...input.json,
                updatedAt: new Date(),
                setting: input.json.setting
                  ? {
                      uniqueKey: currentDoc.setting?.uniqueKey || crypto.randomUUID(),
                      prompt: input.json.setting.prompt,
                      additionals: input.json.setting.additionals,
                    }
                  : currentDoc.setting,
              }
            : {
                ...input.json,
                uniqueKey,
                createdAt: new Date(),
                updatedAt: new Date(),
                llmStatus: 'SUCCESS',
                llmStatusChangeAt: new Date(),
                setting: input.json.setting
                  ? {
                      uniqueKey: crypto.randomUUID(),
                      prompt: input.json.setting.prompt,
                      additionals: input.json.setting.additionals,
                    }
                  : undefined,
              }

          await offlineRepository.save(updatedDoc.uniqueKey, updatedDoc)
          return updatedDoc
        } else {
          const newDoc: DocumentEntity = {
            ...input.json,
            uniqueKey: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            llmStatus: 'SUCCESS',
            llmStatusChangeAt: new Date(),
            setting: input.json.setting
              ? {
                  uniqueKey: crypto.randomUUID(),
                  prompt: input.json.setting.prompt,
                  additionals: input.json.setting.additionals,
                }
              : undefined,
          }
          await offlineRepository.save(newDoc.uniqueKey, newDoc)
          return newDoc
        }

      case 'both':
        try {
          const doc = isUpdate
            ? await onlineRepository.update(input as UpdateDocumentInput)
            : await onlineRepository.create(input as CreateDocumentInput)
          await offlineRepository.save(doc.uniqueKey, doc)
          return doc
        } catch (error) {
          // オンライン保存に失敗した場合、オフラインに保存
          console.warn('Failed to save online, falling back to offline storage:', error)
          return await documentRepository.upsert(input, { mode: 'offline-only' })
        }
    }
  },

  generateTableOfContent: async (input: GenerateTableOfContentInput): Promise<DocumentEntity> => {
    const doc = await onlineRepository.generateTableOfContent(input)
    await offlineRepository.save(doc.uniqueKey, doc)
    return doc
  },

  sync: async (uniqueKey: string, content: string): Promise<DocumentEntity> => {
    const doc = await onlineRepository.sync(uniqueKey, content)
    await offlineRepository.save(doc.uniqueKey, doc)
    return doc
  },
}
