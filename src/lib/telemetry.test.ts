import { afterEach, expect, it, vi } from 'vitest'
import { observedFetch, recordSample, summarize, telemetry } from './telemetry'
afterEach(()=>{vi.unstubAllGlobals();telemetry.reset()})
it('reports average, peak, recent requests and failures from actual observations',()=>{
 const stats=summarize([{time:100,duration:100,failed:false},{time:60200,duration:500,failed:true}],60300)
 expect(stats.average).toBe(300);expect(stats.peak).toBe(500);expect(stats.recent).toBe(1);expect(stats.errorRate).toBe(50)
 expect(summarize([]).average).toBeNull();expect(summarize([]).errorRate).toBeNull()
})
it('preserves HTTP responses and counts rejected requests',async()=>{
 const response=new Response('{}',{status:400});vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response))
 expect(await observedFetch('/api/example')).toBe(response);expect(telemetry.getSummary().failed).toBe(1)
})
it('does not count cancellation as a database error',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Canceled','AbortError')))
 await expect(observedFetch('/api/example')).rejects.toThrow('Canceled');expect(telemetry.getSummary().count).toBe(0)
})
it('discards requests completed after the session reset',async()=>{
 let resolve!:(value:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>{resolve=r})))
 const pending=observedFetch('/api/example');telemetry.reset();resolve(new Response('{}'));await pending;expect(telemetry.getSummary().count).toBe(0)
})
it('keeps stable chart identities when the recent sample window advances',()=>{
 telemetry.reset()
 for(let i=0;i<20;i++)recordSample({time:i,duration:10,failed:false})
 const previous=telemetry.getSummary().bars
 recordSample({time:21,duration:10,failed:false})
 const current=telemetry.getSummary().bars
 expect(current).toHaveLength(20)
 expect(current.slice(0,19)).toEqual(previous.slice(1))
 expect(current[19].id).not.toBe(previous[19].id)
})
