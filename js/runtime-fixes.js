'use strict';

// Telegram WebView on iOS can keep a network request pending indefinitely.
// A timeout prevents the Mini App from remaining on an empty/loading screen.
apiRequest=async function(path,{method='GET',body,keepalive=false}={}){
  if(!telegramInitData)throw new Error('Telegram authorization is unavailable');
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timeout=controller?setTimeout(()=>controller.abort(),8000):null;
  try{
    const response=await fetch(`${API_BASE}/${path}`,{
      method,
      headers:{'Content-Type':'application/json','X-Telegram-Init-Data':telegramInitData},
      body:body===undefined?undefined:JSON.stringify(body),
      credentials:'same-origin',
      cache:'no-store',
      keepalive,
      signal:controller?.signal
    });
    let payload={};
    try{payload=await response.json()}catch(error){}
    if(!response.ok)throw new Error(payload.error||`API ${response.status}`);
    return payload;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('Сервер не ответил вовремя');
    throw error;
  }finally{
    if(timeout)clearTimeout(timeout);
  }
};

window.addEventListener('error',event=>{
  console.error('Mini App runtime error',event.error||event.message);
});
window.addEventListener('unhandledrejection',event=>{
  console.error('Mini App rejected promise',event.reason);
});

setTimeout(()=>{
  const loading=document.querySelector('.loading-card');
  if(!loading)return;
  try{
    state=sanitizeState(state);
    saveLocal();
    setSyncMode(telegramInitData?'error':'local');
    render();
    toast('Кабинет открыт. Синхронизацию повторим автоматически.','warning');
  }catch(error){
    loading.innerHTML='<h2>Не удалось загрузить кабинет</h2><p class="muted">Закройте окно и откройте приложение ещё раз из Telegram-бота.</p>';
  }
},10000);
