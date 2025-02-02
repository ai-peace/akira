import { Descendant } from 'slate'

export type CustomElement =
  | { type: 'paragraph'; children: Descendant[]; metadata?: { uniqueKey: string } }
  | { type: 'heading_one'; children: Descendant[] }
  | { type: 'heading_two'; children: Descendant[] }
  | { type: 'heading_three'; children: Descendant[] }
  | { type: 'heading_four'; children: Descendant[] }
  | { type: 'heading_five'; children: Descendant[] }
  | { type: 'heading_six'; children: Descendant[] }
  | { type: 'ul_list'; children: CustomElement[] }
  | { type: 'list_item' | 'li'; children: Descendant[] }
  | { type: 'block_quote'; children: Descendant[] }
  | SkeletonElement

export type SkeletonElement =
  | {
      type: 'heading_one_skeleton'
      metadata?: { uniqueKey: string }
      isVoid: true
    }
  | {
      type: 'heading_two_skeleton'
      metadata?: { uniqueKey: string }
      isVoid: true
    }
  | {
      type: 'heading_three_skeleton'
      metadata?: { uniqueKey: string }
      isVoid: true
    }
  | {
      type: 'heading_four_skeleton'
      metadata?: { uniqueKey: string }
      isVoid: true
    }
  | {
      type: 'paragraph_skeleton'
      metadata?: { uniqueKey: string }
      isVoid: true
    }
