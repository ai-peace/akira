// Fileクラスのポリフィルを追加（Node.js環境用）
if (typeof globalThis.File === 'undefined') {
  // Node.js環境でFileオブジェクトのポリフィルを提供
  const { File, Blob } = require('buffer')
  globalThis.File = File
  globalThis.Blob = Blob
}

import { mastra } from './mastra/index'

export { mastra }
