import { expect,it } from 'vitest'
import { safeUrl } from './records'
it('only opens complete HTTP(S) links',()=>{
 expect(safeUrl('https://example.com/path')).toBe('https://example.com/path')
 for(const value of ['javascript:alert(1)','data:text/html,hello','file:///etc/passwd','not a url'])expect(safeUrl(value)).toBeNull()
})
