import PocketBase from 'pocketbase'
import { observedFetch, telemetry } from './telemetry'
export const pb = new PocketBase('/')
export const AUTH_COLLECTION = 'users'
// Covers SDK requests only; never records URLs, payloads, credentials, or tokens.
pb.beforeSend = (url, options) => ({ url, options: { ...options, fetch: observedFetch } })
pb.authStore.onChange(()=>telemetry.reset())
