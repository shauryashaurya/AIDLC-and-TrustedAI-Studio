import type { UseCase } from './types';
import { cloneCase, validateImport } from './model';
const KEY='aidlc-trust-studio-cases-v1';
export function listSavedCases():UseCase[] {
  try {
    const arr=JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(arr)?arr.filter(validateImport).sort((a:UseCase,b:UseCase)=>b.updatedAt.localeCompare(a.updatedAt)):[];
  } catch{return [];}
}
export function saveCase(c:UseCase):void {
  const list=listSavedCases().filter(item=>item.id!==c.id);
  const saved=cloneCase(c);saved.updatedAt=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify([saved,...list]));
}
export function deleteSavedCase(id:string):void {localStorage.setItem(KEY,JSON.stringify(listSavedCases().filter(c=>c.id!==id)));}
export function downloadBlob(content:string|Uint8Array<ArrayBuffer>,filename:string,type='text/plain'):void {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export const filenameSlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'untitled-use-case';
