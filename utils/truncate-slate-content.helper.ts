import { CustomElement } from '@/types/custom-element'

/**
 * Slateのコンテンツを指定された長さに切り詰める
 * @param nodes Slateのノード配列
 * @param maxLength 最大文字数（デフォルト: 100）
 * @returns 切り詰められたSlateノード
 */
export const truncateSlateContent = (nodes: any[], maxLength: number = 100): CustomElement[] => {
  // 全てのテキストを集める関数
  const getAllText = (node: any): string => {
    if ('text' in node) {
      return node.text
    }
    if ('children' in node) {
      return node.children.map(getAllText).join(' ')
    }
    return ''
  }

  // 全体のテキストを取得して処理
  const fullText = nodes.map(getAllText).join(' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  // 切り詰めたテキスト
  const truncatedText =
    fullText.length > maxLength ? fullText.slice(0, maxLength) + '...' : fullText

  // 単純な段落ノードとして返す
  return [
    {
      type: 'paragraph',
      children: [{ text: truncatedText }],
    },
  ] as CustomElement[]
}
