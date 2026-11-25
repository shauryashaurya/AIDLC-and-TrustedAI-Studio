export interface RemoteSample {id:string;name:string;path:string;repo:string;htmlUrl:string;description:string;ref:string;kind:'folder'|'file';}
const API='https://api.github.com';
const repos=[
  {repo:'aws-samples/sample-ai-for-software-engineering-on-aws',dir:'samples',label:'AWS engineering domain samples'},
  {repo:'awslabs/aidlc-workflows',dir:'docs/guide',label:'AWS workflow worked examples'}
];
async function gh(url:string, signal?:AbortSignal):Promise<any> {
  const r=await fetch(url,{headers:{Accept:'application/vnd.github+json'},signal});
  if(!r.ok) throw new Error(`GitHub API ${r.status}: ${r.status===403?'Rate limit or access restriction. Try again later.':r.statusText}`);
  return r.json();
}
/** Never invoked on startup. User-initiated, uncached, live GitHub metadata. */
export async function fetchRemoteSamples():Promise<RemoteSample[]> {
  const output:RemoteSample[]=[];
  const errors:string[]=[];
  for(const source of repos){
    try {
      const info=await gh(`${API}/repos/${source.repo}/contents/${source.dir}?ref=main&t=${Date.now()}`);
      if(!Array.isArray(info)) continue;
      for(const item of info){
        if(source.repo.startsWith('awslabs') && !/example/i.test(item.name)) continue;
        if(source.repo.startsWith('aws-samples')&&item.type!=='dir') continue;
        output.push({id:`${source.repo}:${item.path}`,name:item.name.replace(/[-_]/g,' '),path:item.path,repo:source.repo,
          htmlUrl:item.html_url,description:source.label,ref:'main',kind:item.type==='dir'?'folder':'file'});
      }
    }catch(err){errors.push(`${source.repo}: ${err instanceof Error?err.message:String(err)}`);}
  }
  if(!output.length) throw new Error(errors.join(' | ')||'No published sample folders were returned.');
  return output;
}
export async function loadRemoteSample(sample:RemoteSample):Promise<{body:string,url:string;sha:string}> {
  let path=sample.path;
  if(sample.kind==='folder'){
    const list=await gh(`${API}/repos/${sample.repo}/contents/${sample.path}?ref=${sample.ref}&t=${Date.now()}`);
    const match=Array.isArray(list)?list.find(i=>i.type==='file'&&/^readme(?:\.md|\.markdown)?$/i.test(i.name)):null;
    if(!match) throw new Error('This AWS sample does not publish a top-level README. Open the source repository to inspect it.');
    path=match.path;
  }
  const info=await gh(`${API}/repos/${sample.repo}/contents/${path}?ref=${sample.ref}&t=${Date.now()}`);
  if(info.encoding!=='base64'||typeof info.content!=='string') throw new Error('GitHub did not return readable Markdown.');
  // UTF-8 safe base64 decoder; atob is browser-standard.
  const binary=atob(info.content.replace(/\s+/g,''));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return {body:new TextDecoder().decode(bytes),url:info.html_url||sample.htmlUrl,sha:info.sha||''};
}
