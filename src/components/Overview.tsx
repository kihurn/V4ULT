import { useEffect, useState, useSyncExternalStore } from 'react'
import { ArrowUpRight, Check, RefreshCw } from 'lucide-react'
import { pb } from '../lib/pocketbase'
import { telemetry } from '../lib/telemetry'
import { DotText } from './DotText'
import type { Item } from '../features/library/records'

type Counts={tasks:number|null;notes:number|null;items:number|null;done:number|null;todo:number|null;doing:number|null}
const initial:Counts={tasks:null,notes:null,items:null,done:null,todo:null,doing:null}
function Label({children}:{children:React.ReactNode}){return <p className="widget-label"><i/>{children}</p>}
export function Overview({navigate}:{navigate:(tab:'tasks'|'notes'|'library')=>void}) {
 const [counts,setCounts]=useState<Counts>(initial),[events,setEvents]=useState<Item[]>([]),[errors,setErrors]=useState<string[]>([]),[busy,setBusy]=useState(true),[revision,setRevision]=useState(0)
 useSyncExternalStore(telemetry.subscribe,telemetry.getVersion)
 const [,tick]=useState(0)
 useEffect(()=>{const timer=setInterval(()=>tick(x=>x+1),5000);return()=>clearInterval(timer)},[])
 useEffect(()=>{
  let active=true;setBusy(true);setErrors([])
  const total=(name:string,filter='')=>pb.collection(name).getList(1,1,{filter,requestKey:null}).then(r=>r.totalItems)
  const requests=[total('tasks'),total('notes'),total('items'),total('tasks','status = "done"'),total('tasks','status = "todo"'),total('tasks','status = "doing"'),pb.collection('items').getList<Item>(1,3,{filter:pb.filter('kind = "event" && starts_at >= {:now}',{now:new Date().toISOString()}),sort:'starts_at',requestKey:null})]
  Promise.allSettled(requests).then(results=>{
   if(!active)return
   const keys=(Object.keys(initial) as (keyof Counts)[]),next={...initial},failed:string[]=[]
   keys.forEach((key,i)=>{const result=results[i];if(result.status==='fulfilled')next[key]=result.value as number;else failed.push(key)})
   const last=results[6];if(last.status==='fulfilled')setEvents((last.value as {items:Item[]}).items);else{setEvents([]);failed.push('events')}
   setCounts(next);setErrors(failed);setBusy(false)
  });return()=>{active=false}
 },[revision])
 const stats=telemetry.getSummary(), now=new Date(),completed=counts.done!==null&&counts.tasks!==null&&counts.tasks>0?counts.done/counts.tasks:0
 const display=(n:number|null)=>busy?'—':n===null?'—':String(n)
 return <section className="home-overview" aria-label="Overview">
  <div className="overview-toolbar"><span className="eyebrow">A PLACE FOR EVERYTHING</span><button className="text-button refresh-button" onClick={()=>setRevision(x=>x+1)} disabled={busy}><RefreshCw size={13} className={busy?'spin':''}/>Refresh</button></div>
  <div className="widget-grid" aria-busy={busy}>
   <button className="glass widget collection-widget" onClick={()=>navigate('tasks')}><Label>Tasks</Label><DotText className="widget-total" text={display(counts.tasks)}/><span className="widget-caption">on your radar</span><div className="task-progress"><div className="tick-ring" aria-hidden="true">{Array.from({length:32},(_,i)=><i key={i} className={i/32<completed?'lit':''} style={{transform:`rotate(${i*11.25}deg)`}}/>)}<Check size={22}/></div><div><strong>{display(counts.done)} complete</strong><p>One thing at a time.</p></div></div><ArrowUpRight className="widget-corner" size={16}/></button>
   <section className="glass widget calendar-widget"><div className="calendar-date"><Label>{now.toLocaleDateString(undefined,{weekday:'long'})}</Label><DotText text={String(now.getDate())}/><span>{now.toLocaleDateString(undefined,{month:'long'})}</span><span className="widget-caption">Your local time</span></div><div className="calendar-events"><div className="calendar-heading"><span className="eyebrow">COMING UP</span><button className="text-button" onClick={()=>navigate('library')} aria-label="Open events in Library"><ArrowUpRight size={17}/></button></div>{busy?<div className="widget-skeleton"/>:errors.includes('events')?<p className="widget-caption">Events unavailable. Check Library setup.</p>:!events.length?<p className="widget-caption">A little room to breathe.<br/>No upcoming events.</p>:events.map(item=><button className="calendar-event" key={item.id} onClick={()=>navigate('library')}><time>{new Date(item.starts_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}<span>{new Date(item.starts_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></time><div><strong>{item.title}</strong><span>{item.data?.fields?.find(f=>f.key.toLowerCase()==='location')?.value||'Saved in your Library'}</span></div></button>)}</div></section>
   <button className="glass widget notes-widget" onClick={()=>navigate('notes')}><Label>Notes</Label><DotText className="widget-total" text={display(counts.notes)}/><span className="widget-caption">thoughts, collected</span><div className="paper-lines" aria-hidden="true"><i/><i/><i/><i/></div><ArrowUpRight className="widget-corner" size={16}/></button>
   <button className="glass widget library-widget" onClick={()=>navigate('library')}><Label>Library</Label><DotText className="widget-total" text={display(counts.items)}/><span className="widget-caption">details worth keeping</span><div className="library-mini"><span>Personal details</span><span>Events & lists</span><span>Links & more</span></div><ArrowUpRight className="widget-corner" size={16}/></button>
   <section className="glass widget balance-widget"><Label>Task balance</Label><div className="balance-rows">{([['To do',counts.todo],['In progress',counts.doing],['Done',counts.done]] as const).map(([label,value])=><div key={label}><div><span>{label}</span><strong>{display(value)}</strong></div><span className="well-track"><i style={{width:`${counts.tasks&&value!==null?value/counts.tasks*100:0}%`}}/></span></div>)}</div><span className="widget-caption">Small steps add up.</span></section>
  </div>
  {!!errors.length&&<p className="overview-warning" role="status">Some collections are unavailable. Apply the included PocketBase migrations and refresh.</p>}
  <div className="telemetry-heading"><div><p className="eyebrow">CONNECTION PULSE</p><h2>Under the surface.</h2></div><span className="telemetry-badge">THIS BROWSER ONLY</span></div>
  <div className="metrics-grid">
   <section className="glass widget metric-widget"><Label>API response time</Label><p className="metric-number">{stats.average===null?'—':Math.round(stats.average)}<span>ms</span></p><div className="metric-bars" aria-hidden="true">{stats.durations.map((d,i)=><i key={i} style={{height:`${Math.max(5,d/Math.max(1,...stats.durations)*36)}px`}}/>)}</div><p className="widget-caption">Average · peak {stats.peak===null?'—':Math.round(stats.peak)} ms</p></section>
   <section className="glass widget metric-widget"><Label>Request activity</Label><p className="metric-number">{stats.recent}<span>/ min</span></p><div className="signal-line" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><p className="widget-caption">Completed requests in the last 60 seconds</p></section>
   <section className="glass widget metric-widget"><Label>Request error rate</Label><p className="metric-number">{stats.errorRate===null?'—':stats.errorRate.toFixed(1)}<span>%</span></p><div className="well-track"><i style={{width:`${stats.errorRate??0}%`}}/></div><p className="widget-caption">{stats.failed} failed / {stats.count} observed requests</p></section>
  </div><p className="telemetry-disclaimer">Observed SDK requests in this tab, up to the last 1,000. Latency includes network time to response headers. Errors include rejected requests and connection failures. These are not server-wide database statistics.</p>
 </section>
}
