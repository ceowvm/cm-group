function render(){
  nav();
  const renderer={welcome,quiz,analysis,result,name:nameScreen,gifts,phone,dashboard,calculator,materials,course,products,productDetail}[state.screen]||welcome;
  app.innerHTML=renderer();
  bind();
}

function bind(){
  document.querySelectorAll('[data-nav]').forEach(element=>element.addEventListener('click',()=>setScreen(element.dataset.nav==='home'?'welcome':element.dataset.nav)));
  document.querySelectorAll('[data-answer]').forEach(element=>element.addEventListener('click',()=>{
    state.answers[questions[state.step].key]=element.dataset.answer;
    touch();
    const group=element.closest('.options');
    group?.querySelectorAll('.option').forEach(option=>option.classList.remove('selected'));
    element.classList.add('selected');
    haptic();
  }));
  document.querySelectorAll('[data-action]').forEach(element=>element.addEventListener('click',async()=>{
    const action=element.dataset.action;
    if(action==='start'){
      state.step=0;
      state.answers={};
      state.quizCompleted=false;
      state.profile=null;
      state.recommendedProduct=null;
      setScreen('quiz');
    }else if(action==='prev'&&state.step>0){
      state.step--;
      touch();
      render();
    }else if(action==='next'){
      if(!state.answers[questions[state.step].key])return toast('Выберите вариант','warning');
      if(state.step<questions.length-1){state.step++;touch();render()}
      else{diagnose();setScreen('analysis');setTimeout(runAnalysis,100)}
    }else if(action==='continue-name'){
      setScreen(state.nameConfirmed?'gifts':'name');
    }else if(action==='save-name'){
      const value=document.getElementById('name')?.value.trim()||'';
      if(value.length<2)return toast('Введите имя','warning');
      state.name=value.slice(0,80);
      state.nameConfirmed=true;
      touch();
      await Promise.allSettled([syncProfile(),emitEvent('name_saved')]);
      setScreen('gifts');
    }else if(action==='submit-phone'){
      const phone=document.getElementById('phone')?.value.trim()||'';
      const consent=Boolean(document.getElementById('consent')?.checked);
      const digits=phone.replace(/\D/g,'');
      if(digits.length<10||digits.length>15)return toast('Введите корректный телефон','warning');
      if(!consent)return toast('Нужно согласие на обработку данных','warning');
      const pending=state.pendingAction;
      const payload=state.pendingPayload||{};
      state.phone=phone.slice(0,40);
      state.consent=true;
      state.phoneSubmitted=true;
      state.pendingAction=null;
      state.pendingPayload=null;
      touch();
      await Promise.allSettled([syncProfile(),emitEvent('lead_completed')]);
      if(pending)await performProtectedAction(pending,payload);else setScreen('materials');
    }else if(action==='cancel-phone'){
      state.pendingAction=null;
      state.pendingPayload=null;
      touch();
      setScreen(state.nameConfirmed?'gifts':'result');
    }else if(action==='calculate'){
      const capital=Number(document.getElementById('capital')?.value);
      const months=Number(document.getElementById('months')?.value);
      if(!Number.isFinite(capital)||capital<3000||capital>20000)return toast('Введите капитал от 3 000 до 20 000 $','warning');
      if(!ALLOWED_MONTHS.includes(months))return toast('Выберите срок из списка','warning');
      state.calc={capital:Math.round(capital/500)*500,months};
      state.calculatorCompleted=true;
      touch();
      await emitEvent('calculator_completed',{calculator:state.calc});
      render();
      toast('Расчёт обновлён','success');
    }else if(action==='open-product'){
      state.selectedProduct=PRODUCT_DATA[element.dataset.product]?element.dataset.product:'signals';
      touch();
      setScreen('productDetail');
    }else if(action==='product-consultation'){
      requirePhone('product-consultation',{product:element.dataset.product});
    }else if(action==='product-to-bot'){
      await goToBot(`miniapp_${element.dataset.product||'product'}`);
    }else if(action==='return-bot'){
      await goToBot('miniapp_return');
    }else if(action==='get-book'){
      requirePhone('get-book');
    }else if(action==='open-course'){
      requirePhone('open-course');
    }else if(action==='open-lesson'){
      requirePhone('open-lesson',{url:element.dataset.url,isLink:element.dataset.link==='yes'});
    }else if(action==='full-access'){
      requirePhone('full-access');
    }else if(action==='open-link'){
      openExternal(element.dataset.url);
    }else if(action==='privacy-policy'){
      void emitEvent('privacy_policy_opened');
      openExternal(POLICY_URL);
    }else if(action==='reset'&&DEBUG_MODE){
      const confirmed=window.confirm('Удалить тестовый профиль и начать заново?');
      if(!confirmed)return;
      try{if(telegramInitData)await apiRequest('profile.php',{method:'DELETE'})}catch(error){console.error(error)}
      localStorage.removeItem(LOCAL_KEY);
      localStorage.removeItem(LEGACY_LOCAL_KEY);
      state=sanitizeState({name:TELEGRAM_FIRST_NAME});
      touch({sync:false});
      render();
    }
  }));
}

function runAnalysis(){
  const items=[...document.querySelectorAll('[data-loader]')];
  items.forEach((element,index)=>setTimeout(()=>{
    element.classList.add('done');
    const dot=element.querySelector('.loader-dot');
    if(dot)dot.textContent='✓';
    if(index===items.length-1)setTimeout(()=>setScreen('result'),650);
  },455+index*520));
}

bottomNav.addEventListener('click',event=>{
  const button=event.target.closest('[data-nav]');
  if(button)setScreen(button.dataset.nav);
});
menuButton.addEventListener('click',()=>setScreen('dashboard'));
window.addEventListener('online',()=>{if(telegramInitData){setSyncMode('syncing');syncProfile()}});
window.addEventListener('offline',()=>setSyncMode('error'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncProfile({keepalive:true})});

async function init(){
  app.innerHTML=loading();
  bottomNav.classList.add('hidden');
  menuButton.classList.add('hidden');
  await loadRemoteProfile();
  state=sanitizeState(state);
  saveLocal();
  render();
}

init();
