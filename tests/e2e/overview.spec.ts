import { test,expect } from '@playwright/test'
test('widget dashboard displays real counts and browser telemetry, with responsive dot headings',async({page})=>{
 const token=`e30.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.sig`
 let observedRequests=0
 const user={id:'user123',collectionId:'users',collectionName:'users',email:'test@example.com'}
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url())
  if(url.pathname.includes('auth-'))return route.fulfill({json:{token,record:user}})
  observedRequests++
  const filter=url.searchParams.get('filter')||''
  const count=url.pathname.includes('tasks')?(filter.includes('done')?2:filter.includes('todo')?3:filter.includes('doing')?1:6):url.pathname.includes('notes')?4:3
  return route.fulfill({json:{page:1,totalItems:count,totalPages:1,items:[]}})
 })
 await page.goto('/');await page.getByLabel('Email address').fill('test@example.com');await page.getByLabel('Password',{exact:true}).fill('password');await page.getByRole('button',{name:'Enter your space'}).click()
 await expect(page.getByRole('region',{name:'Overview'})).toBeVisible()
 await expect(page.locator('.widget-grid')).toHaveAttribute('aria-busy','false')
 await expect(page.locator('.collection-widget .widget-total')).toHaveText('6')
 await expect(page.locator('.notes-widget .widget-total')).toHaveText('4')
 await expect(page.locator('.metric-widget').nth(2)).toContainText('0.0')
 await expect(page.locator('.metric-widget').nth(1).locator('.metric-number')).toHaveText(`${observedRequests}/ min`)
 for(const [width,height] of [[375,667],[844,390],[768,1024],[1440,1000]]){
  await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 }
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.widget').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none')
 await page.screenshot({path:'/tmp/v4ult-ferro-dashboard.png',fullPage:true})
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/v4ult-ferro-mobile.png',fullPage:true})
})
