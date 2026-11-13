import { pb } from './pocketbase'
export type Status = 'todo' | 'doing' | 'done'
export interface Task { id: string; title: string; status: Status; due_date: string; created: string }
export interface Note { id: string; title: string; content: string; tags: string; created: string }
export const statuses: Status[] = ['todo', 'doing', 'done']
export const statusLabel = { todo: 'To do', doing: 'In progress', done: 'Done' }
export function serializeDate(value: string) { return value ? `${value} 00:00:00.000Z` : '' }
export function plainText(value: string) { return new DOMParser().parseFromString(value, 'text/html').body.textContent || '' }
export function dueLabel(value: string) {
 if (!value) return 'No due date'
 const day = value.slice(0, 10), now = new Date(), today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
 if(day === today) return 'Today'
 const [y,m,d] = day.split('-').map(Number)
 return `${day < today ? 'Overdue · ' : ''}${new Date(y,m-1,d).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`
}
export const listTasks = (page: number, status?: Status) => pb.collection('tasks').getList<Task>(page, 50, { sort: '-created', filter: status ? pb.filter('status = {:status}', {status}) : '', requestKey: null })
export const listNotes = (page: number) => pb.collection('notes').getList<Note>(page, 50, { sort: '-created', requestKey: null })
export function errorMessage(error: unknown) { return error instanceof Error ? (error.message.includes('Missing collection context') ? 'A required collection is missing. Apply the included PocketBase migrations, then retry.' : error.message) : 'Something went wrong. Please try again.' }
