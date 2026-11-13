import { pb } from '../../lib/pocketbase'
export const kinds = { information: 'Personal information', event: 'Event', checklist: 'Checklist', link: 'Link', other: 'Other' } as const
export type Kind = keyof typeof kinds
export interface Item {
  id: string; owner: string; title: string; kind: Kind; content: string; tags: string
  starts_at: string; data: { fields?: {key:string;value:string}[]; checklist?: {text:string;done:boolean}[]; url?: string }
  created: string; updated: string
}
export function listItems(page: number, query: string, kind: string) {
  const filters: string[] = []
  if(query.trim()) filters.push(pb.filter('(title ~ {:q} || content ~ {:q} || tags ~ {:q})', {q:query.trim()}))
  if(kind) filters.push(pb.filter('kind = {:kind}', {kind}))
  return pb.collection('items').getList<Item>(page, 50, { sort:'-updated', filter:filters.join(' && '), requestKey:null })
}
export function safeUrl(url: string) {
  try { const parsed=new URL(url);return ['http:','https:'].includes(parsed.protocol)?parsed.href:null } catch {return null}
}
