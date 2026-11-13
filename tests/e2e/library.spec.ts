import { test, expect } from '@playwright/test'

test('Library creates structured records, edits checklists, searches and deletes',async({page})=>{
 const records:any[]=[];let lastFilter=''
 const token=`e30.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.sig`
 const user={id:'user123',collectionId:'users',collectionName:'users',email:'test@example.com'}
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url())
  if(url.pathname.includes('auth-'))return route.fulfill({json:{token,record:user}})
  if(!url.pathname.includes('/items/'))return route.fulfill({json:{page:1,totalItems:0,totalPages:0,items:[]}})
  if(req.method()==='POST'){const body=req.postDataJSON();const record={...body,id:'item'+records.length,created:new Date().toISOString(),updated:new Date().toISOString()};records.unshift(record);return route.fulfill({json:record})}
  if(req.method()==='PATCH'){const record=records.find(x=>url.pathname.endsWith(x.id));Object.assign(record,req.postDataJSON());return route.fulfill({json:record})}
  if(req.method()==='DELETE'){records.splice(records.findIndex(x=>url.pathname.endsWith(x.id)),1);return route.fulfill({status:204})}
  lastFilter=url.searchParams.get('filter')||''
  return route.fulfill({json:{page:1,totalItems:records.length,totalPages:1,items:records}})
 })
 await page.goto('/');await page.getByLabel('Email address').fill('test@example.com');await page.getByLabel('Password',{exact:true}).fill('password');await page.getByRole('button',{name:'Enter your space'}).click()
 await page.getByRole('button',{name:'Library',exact:true}).click();await page.getByRole('button',{name:'Add item',exact:true}).click()
 await page.getByLabel('Title',{exact:true}).fill('My travel preferences');await page.getByLabel('Details',{exact:true}).fill('Prefer a window seat.');await page.getByRole('button',{name:'Add detail',exact:true}).click();await page.getByLabel('Field name 1').fill('home_city');await page.getByLabel('Field value 1').fill('Kuala Lumpur');await page.getByRole('button',{name:'Save item'}).click()
 await expect(page.getByRole('heading',{name:'My travel preferences'})).toBeVisible();expect(records[0].owner).toBe('user123');expect(records[0].data.fields[0].value).toBe('Kuala Lumpur')
 await page.getByRole('button',{name:'Add item',exact:true}).click();await page.getByLabel('Title',{exact:true}).fill('Packing list');await page.getByRole('combobox',{name:'Item type',exact:true}).selectOption('checklist');await page.getByRole('button',{name:'Add checklist item',exact:true}).click();await page.getByLabel('Checklist item 1',{exact:true}).fill('Charger');await page.getByRole('button',{name:'Save item'}).click()
 await page.getByRole('button',{name:/Checklist.*Packing list/}).click();await page.getByLabel('Complete item 1',{exact:true}).check();await page.getByRole('button',{name:'Save item'}).click();await expect(page.getByText('1 / 1 complete')).toBeVisible()
 await page.getByRole('button',{name:'Add item',exact:true}).click();await page.getByLabel('Title',{exact:true}).fill('Dentist');await page.getByRole('combobox',{name:'Item type',exact:true}).selectOption('event');await page.getByLabel('Event date and time').fill('2027-01-15T14:30');await page.getByRole('button',{name:'Save item'}).click();await expect(page.getByRole('heading',{name:'Dentist',exact:true})).toBeVisible();expect(records[0].starts_at).toContain('2027-01-15')
 await page.getByLabel('Search library').fill('window');await expect.poll(()=>lastFilter).toContain('window')
 await page.getByLabel('Search library').fill('');await page.getByRole('button',{name:/Event.*Dentist/}).click();await page.getByRole('button',{name:'Delete item',exact:true}).click();await page.getByRole('button',{name:'Keep item'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Delete item',exact:true}).click();await page.getByRole('button',{name:'Delete permanently'}).click();await expect(page.getByRole('heading',{name:'Dentist',exact:true})).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await expect(page.getByText('Gathering your library…')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Packing list'})).toBeVisible();await page.screenshot({path:'/tmp/v4ult-library-green.png',fullPage:true})
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.widget')).toHaveCount(0)
})

test('removing editor rows preserves surviving inputs and saves only schema fields', async ({page}) => {
 const token=`e30.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.sig`
 let saved:any
 await page.route('**/api/**', route => {
  const request=route.request()
  if(request.url().includes('auth-'))return route.fulfill({json:{token,record:{id:'user123',collectionId:'users',collectionName:'users'}}})
  if(request.method()==='POST'){
   saved=request.postDataJSON()
   return route.fulfill({json:{...saved,id:'item1'}})
  }
  return route.fulfill({json:{page:1,totalPages:0,totalItems:0,items:[]}})
 })
 await page.goto('/')
 await page.getByLabel('Email address').fill('test@example.com')
 await page.getByLabel('Password',{exact:true}).fill('password')
 await page.getByRole('button',{name:'Enter your space'}).click()
 await page.getByRole('navigation').getByRole('button',{name:'Library',exact:true}).click()
 await page.getByRole('button',{name:'Add item',exact:true}).click()
 await page.getByLabel('Title',{exact:true}).fill('Stable rows')
 await page.getByRole('combobox',{name:'Item type',exact:true}).selectOption('checklist')
 for(const label of ['Add detail','Add checklist item']){
  await page.getByRole('button',{name:label,exact:true}).click()
  await page.getByRole('button',{name:label,exact:true}).click()
 }
 await page.getByLabel('Field name 2',{exact:true}).fill('location')
 await page.getByLabel('Field value 2',{exact:true}).fill('Kuala Lumpur')
 await page.getByLabel('Checklist item 2',{exact:true}).fill('Keep this')
 await page.getByLabel('Complete item 2',{exact:true}).check()
 const field=await page.getByLabel('Field value 2',{exact:true}).elementHandle()
 const checklist=await page.getByLabel('Checklist item 2',{exact:true}).elementHandle()
 await page.getByRole('button',{name:'Remove field 1',exact:true}).click()
 await page.getByRole('button',{name:'Remove checklist item 1',exact:true}).click()
 await expect(page.getByLabel('Field value 1',{exact:true})).toHaveValue('Kuala Lumpur')
 await expect(page.getByLabel('Checklist item 1',{exact:true})).toHaveValue('Keep this')
 expect(await field!.evaluate(el=>el===document.querySelector('[aria-label="Field value 1"]'))).toBe(true)
 expect(await checklist!.evaluate(el=>el===document.querySelector('[aria-label="Checklist item 1"]'))).toBe(true)
 await page.getByRole('button',{name:'Save item',exact:true}).click()
 await expect(page.getByRole('dialog')).toHaveCount(0)
 expect(saved.data.fields).toEqual([{key:'location',value:'Kuala Lumpur'}])
 expect(saved.data.checklist).toEqual([{text:'Keep this',done:true}])
})
