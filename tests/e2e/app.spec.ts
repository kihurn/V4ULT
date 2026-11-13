import { test, expect } from '@playwright/test'
test('auth, task lifecycle, notes, failed writes and mobile layout', async ({page})=>{
 const token=`e30.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.signature`
 const user={id:'user123',collectionId:'users',collectionName:'users',email:'test@example.com',name:'Alex'}
 const tasks:any[]=[];const notes:any[]=[];let fail=false
 await page.route('**/api/**',async route=>{
 const req=route.request(),url=req.url();let body:any={};try{body=req.postDataJSON()}catch{}
 const auth={token,record:user}
 if(url.includes('auth-with-password')||url.includes('auth-refresh'))return route.fulfill({json:auth})
 const list=url.includes('/tasks/')?tasks:notes
 if(req.method()==='POST'){const record={...body,id:`record${list.length}`,created:'2026-11-13 12:00:00Z'};list.unshift(record);return route.fulfill({json:record})}
 if(req.method()==='PATCH'){if(fail)return route.fulfill({status:400,json:{message:'Update failed'}});Object.assign(list.find(x=>url.endsWith(x.id)),body);return route.fulfill({json:list[0]})}
 return route.fulfill({json:{page:1,perPage:50,totalItems:list.length,totalPages:1,items:list}})
 })
 await page.goto('/')
 await page.getByLabel('Email address').fill('test@example.com');await page.getByLabel('Password',{exact:true}).fill('password123')
 await page.getByRole('button',{name:'Enter your space'}).click()
 await page.getByRole('button',{name:'Tasks',exact:true}).click();await expect(page.getByRole('heading',{name:'Your tasks'})).toBeVisible()
 await page.getByRole('button',{name:'Add task'}).click();await page.getByLabel('Title',{exact:true}).fill('Plan the weekend');await page.getByLabel('Due date').fill('2026-11-14');await page.getByRole('button',{name:'Save task'}).click()
 await expect(page.getByRole('heading',{name:'Plan the weekend'})).toBeVisible()
 await page.getByLabel('Status for Plan the weekend').selectOption('doing');await expect(page.getByLabel('Status for Plan the weekend')).toHaveValue('doing')
 fail=true;await page.getByLabel('Status for Plan the weekend').selectOption('done');await expect(page.getByRole('alert')).toContainText('Update failed');await expect(page.getByLabel('Status for Plan the weekend')).toHaveValue('doing');fail=false
 await page.getByRole('button',{name:'Notes',exact:true}).click();await page.getByRole('button',{name:'New note'}).click();await page.getByLabel('Title',{exact:true}).fill('An idea');await page.getByLabel('Note',{exact:true}).fill('<img src=x onerror="window.hacked=1">A safe thought');await page.getByLabel('Tags').fill('ideas, personal');await page.getByRole('button',{name:'Save note'}).click()
 await page.getByRole('button',{name:/An idea/}).click();await expect(page.locator('dialog')).toContainText('A safe thought');expect(await page.evaluate(()=>Boolean((window as any).hacked))).toBe(false)
 await page.getByRole('button',{name:'Close dialog'}).click()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.screenshot({path:'/tmp/v4ult-mobile.png',fullPage:true})
 await page.reload();await page.getByRole('button',{name:'Tasks',exact:true}).click();await expect(page.getByRole('heading',{name:'Your tasks'})).toBeVisible()
 await page.getByRole('button',{name:'Sign out'}).click();await expect(page.getByRole('button',{name:'Enter your space'})).toBeVisible()
})
test('login remains usable at phone, landscape, tablet and desktop sizes',async({page})=>{
 await page.goto('/')
 for(const [width,height] of [[375,667],[390,844],[430,932],[844,390],[768,1024],[1440,900]]){
 await page.setViewportSize({width,height});await expect(page.getByLabel('Email address')).toBeVisible();await page.getByLabel('Email address').fill('person@example.com');await page.getByRole('button',{name:'Enter your space'}).scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});await page.screenshot({path:'/tmp/v4ult-login.png',fullPage:true})
})
