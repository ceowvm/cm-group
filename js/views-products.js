const PRODUCT_DATA={
  signals:{title:'CM Signals',label:'Банковские сигналы',color:'signals',intro:'Формат для тех, кто хочет получать готовые рекомендации по сделкам и уделять торговле около 15 минут в неделю.',video:SIGNALS_VIDEO,how:['Получаете SMS с рекомендацией о совершении сделки','Копируете торговые позиции в мобильной платформе','Контролируете результат вместе с сопровождением эксперта'],benefits:['Банковские торговые сигналы','Сопровождение от эксперта','Курс QUICK START в подарок','Доступ в закрытый клуб трейдеров'],variants:[['CM Signals','Базовые банковские сигналы и рекомендации'],['CM News','CM Signals плюс SMS-рекомендации перед ключевыми новостными событиями'],['CM Stocks','Сигналы по акциям крупных компаний и фондовым индексам']]},
  cmlab:{title:'CM Lab',label:'Автоматические торговые студии',color:'cmlab',intro:'Системный формат для пользователей, которые хотят автоматизировать торговлю и снизить влияние эмоций и ручных ошибок.',video:LAB_VIDEO,how:['Подключается торговый счёт','Выбирается конфигурация CM Lab под размер капитала и задачи','Система анализирует рынок и автоматически выставляет сделки'],benefits:['Автоматизированная логика','Работа 24 часа в сутки 5 дней в неделю','Несколько конфигураций под разные инструменты','Возможность подобрать решение под размер депозита'],variants:[['CM Lab Start','Базовая конфигурация для небольших депозитов'],['CM Lab Advanced','Расширенная фильтрация и несколько автономных модулей'],['CM Lab Pro','Мультиинструментальная система с расширенной диверсификацией'],['CM Lab Metals','Конфигурация на драгоценных металлах'],['CM Lab Stocks','Студия на фондовых индексах'],['Golden / Energy LAB','Специализированные конфигурации на золоте и энергетических инструментах']]},
  education:{title:'QUICK START',label:'Обучение',color:'education',intro:'Курс для быстрого освоения базовых принципов торговли на фондовых, валютных и сырьевых рынках.',video:'https://kinescope.io/tGFd2YBtc7khcECWLTmy9A',how:['Изучаете основы финансовых рынков и торговые терминалы','Осваиваете технический анализ и риск-менеджмент','Закрепляете материал на практике и домашних заданиях'],benefits:['10 уроков и 3 модуля','Технический анализ','Риск-менеджмент','Практика, консультации и наставничество'],variants:[['QUICK START','Базовая программа обучения'],['Персональный разбор','Подбор следующего шага под вашу цель и уровень опыта']]}
};

function productDetail(){
  const id=PRODUCT_DATA[state.selectedProduct]?state.selectedProduct:'signals';
  const data=PRODUCT_DATA[id];
  return `<section class="screen stack"><button class="back-link" type="button" data-nav="products">← Все продукты</button><div class="card product-hero ${data.color}"><span class="profile-badge">${data.label}</span><h2 class="mt-16">${data.title}</h2><p class="muted">${data.intro}</p></div><div class="card"><h3>Видео о продукте</h3>${data.video.includes('kinescope.io/')?`<button class="btn btn-secondary mt-16" type="button" data-action="open-link" data-url="${esc(data.video)}">Смотреть видео</button>`:`<div class="video-frame mt-16"><video controls playsinline preload="metadata" src="${esc(data.video)}"></video></div>`}</div><div class="card"><h3>Как это работает</h3><div class="steps-list">${data.how.map((text,index)=>`<div class="step-row"><span>${index+1}</span><p>${text}</p></div>`).join('')}</div></div><div class="card"><h3>Что входит</h3><div class="feature-list">${data.benefits.map(text=>`<div class="feature-item"><span>✓</span><p>${text}</p></div>`).join('')}</div></div><div class="card"><h3>Варианты продукта</h3>${data.variants.map(([title,description])=>`<div class="variant-row"><div><strong>${title}</strong><p class="muted">${description}</p></div></div>`).join('')}</div><div class="card soft"><h3>Следующий шаг</h3><p class="muted">Оставьте заявку, чтобы получить актуальные условия, подобрать конфигурацию и задать вопросы специалисту.</p><button class="btn btn-primary" type="button" data-action="product-consultation" data-product="${id}">Получить консультацию</button><button class="btn btn-ghost mt-12" type="button" data-action="product-to-bot" data-product="${id}">Продолжить в Telegram-боте</button></div><p class="disclaimer center">Торговля финансовыми инструментами связана с риском потери капитала. Информация о продукте не является гарантией доходности или индивидуальной инвестиционной рекомендацией.</p></section>`;
}

function requirePhone(action,payload={}){
  if(state.phoneSubmitted){performProtectedAction(action,payload);return true}
  state.pendingAction=action;
  state.pendingPayload=payload;
  touch();
  setScreen('phone');
  return false;
}

async function performProtectedAction(action,payload={}){
  if(action==='get-book'){
    void emitEvent('book_opened');
    openExternal(BOOK_URL);
  }else if(action==='open-course'){
    await emitEvent('basic_course_opened');
    setScreen('course');
  }else if(action==='open-lesson'){
    void emitEvent('lesson_opened',{lesson_url:payload.url||''});
    if(payload.isLink)openExternal(payload.url);else setScreen('materials');
  }else if(action==='product-consultation'){
    const delivered=await emitEvent('product_consultation_requested',{
      product:payload.product||state.recommendedProduct||state.selectedProduct||'general',
      source:payload.source||'application'
    });
    if(delivered){
      haptic('notificationOccurred');
      toast('Заявка отправлена. Менеджер свяжется с вами в ближайшее время.','success');
    }else{
      toast('Не удалось отправить заявку. Откройте приложение из Telegram и попробуйте ещё раз.','warning');
    }
  }else if(action==='full-access'){
    await emitEvent('full_access_opened');
    setScreen('materials');
  }
}

function openExternal(url){
  if(!/^https:\/\//i.test(String(url)))return;
  if(tg?.openLink)tg.openLink(url);
  else window.open(url,'_blank','noopener,noreferrer');
}

async function goToBot(startParam=''){
  void syncProfile();
  void emitEvent('return_to_bot',{start_param:startParam});
  const url=startParam?`${BOT_URL}?start=${encodeURIComponent(startParam)}`:BOT_URL;
  if(tg?.openTelegramLink){
    tg.openTelegramLink(url);
    setTimeout(()=>tg.close(),350);
  }else{
    location.href=url;
  }
}