import { documentRepository } from '@/repository/document.repository'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

type SyncState = {
  lastSynced: number
  isSyncing: boolean
  hasLocalChanges: boolean // ローカルに送信していない変更があるか
  isOnline: boolean
}

export type CachedChange = {
  content: string
  timestamp: number
  version: number
}

type UseDocumentSyncProps = {
  documentUniqueKey: string
  content: string
  documentSync: (content: string) => Promise<any>
  onLocalSave?: () => void
  onSyncStart?: () => void
  onSyncComplete?: () => void
  onSyncError?: (error: Error) => void
}

export const useDocumentSync = ({
  documentUniqueKey,
  content,
  documentSync,
  onLocalSave,
  onSyncStart,
  onSyncComplete,
  onSyncError,
}: UseDocumentSyncProps) => {
  const [syncState, setSyncState] = useState<SyncState>({
    lastSynced: Date.now(),
    isSyncing: false,
    hasLocalChanges: false,
    isOnline: true,
  })

  // オフライン検知
  useEffect(() => {
    const handleOnline = () => setSyncState((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSyncState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ローカルストレージへの保存をdebounce
  const saveToLocalStorage = useDebouncedCallback(
    async (newContent: string) => {
      try {
        await documentRepository.upsert(
          {
            json: {
              mdxContent: newContent,
            },
            param: {
              uniqueKey: documentUniqueKey,
            },
          },
          { mode: 'offline-only' },
        )
        setSyncState((prev) => ({ ...prev, hasLocalChanges: true }))
        onLocalSave?.()
      } catch (error) {
        console.error('Failed to save to local storage:', error)
      }
    },
    1000, // 1秒のディレイ
    {
      maxWait: 3000, // 最大3秒まで待機
      leading: false, // 最初の呼び出しを遅延
      trailing: true, // 最後の呼び出しを必ず実行
    },
  )

  // サーバーとの同期をdebounce
  const syncWithServer = useDebouncedCallback(
    async () => {
      if (!syncState.hasLocalChanges || syncState.isSyncing || !syncState.isOnline) {
        console.log('syncWithServer refused', syncState)
        return
      }

      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }))
        onSyncStart?.()

        const offlineDoc = await documentRepository.get(documentUniqueKey, { mode: 'offline-only' })
        if (!offlineDoc?.mdxContent) return

        await documentSync(offlineDoc.mdxContent)

        setSyncState((prev) => ({
          ...prev,
          lastSynced: Date.now(),
          hasLocalChanges: false,
          isSyncing: false,
        }))
        onSyncComplete?.()
      } catch (error) {
        setSyncState((prev) => ({ ...prev, isSyncing: false }))
        onSyncError?.(error as Error)
      }
    },
    2000, // 2秒のディレイ
    {
      maxWait: 5000, // 最大5秒まで待機
    },
  )

  useEffect(() => {
    saveToLocalStorage(content)
  }, [content, saveToLocalStorage])

  // 定期的な同期
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncWithServer()
    }, 60000) // 1分間隔

    return () => {
      clearInterval(syncInterval)
      // コンポーネントのアンマウント時にペンディング中の処理をキャンセル
      saveToLocalStorage.cancel()
      syncWithServer.cancel()
    }
  }, [syncWithServer])

  return {
    saveToLocalStorage,
    syncWithServer,
    syncState,
  }
}
