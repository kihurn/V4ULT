import { describe,it,expect } from 'vitest'
import { serializeDate,dueLabel } from './records'
describe('calendar dates',()=>{
 it('stores a calendar date without interpreting local time',()=>{expect(serializeDate('2026-11-14')).toBe('2026-11-14 00:00:00.000Z');expect(serializeDate('')).toBe('')})
 it('keeps date display stable across UTC offsets',()=>{for(const timezone of ['Pacific/Honolulu','Asia/Kuala_Lumpur','Pacific/Kiritimati']){process.env.TZ=timezone;expect(dueLabel('2026-11-14 00:00:00.000Z')).toContain('14')}expect(dueLabel('')).toBe('No due date')})
})
