import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
export function Dialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) {
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const previous=document.activeElement as HTMLElement; ref.current?.showModal();return()=>{previous?.focus()}},[])
 return <dialog ref={ref} onCancel={onClose} className="glass modal"><div className="section-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</dialog>
}
