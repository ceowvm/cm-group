function lockedMediaCard(title,description,action,payload=''){
  return `<div class="card"><h3>${title}</h3><p class="muted">${description}</p><div class="locked-preview"><span class="locked-preview__icon">▶</span><span>Доступ откроется после номера телефона</span></div><button class="btn btn-secondary mt-16" type="button" data-action="${action}" ${payload}>Смотреть урок</button></div>`;
}

function mediaCard(title,description,url,isLink=false){
  if(!state.phoneSubmitted)return lockedMediaCard(title,description,'open-lesson',`data-url="${esc(url)}" data-link="${isLink?'yes':'no'}"`);
  return `<div class="card"><h3>${title}</h3><p class="muted">${description}</p>${isLink?`<button class="btn btn-secondary" type="button" data-action="open-link" data-url="${esc(url)}">Смотреть урок</button>`:`<div class="video-frame mt-16"><video controls playsinline preload="metadata" src="${esc(url)}"></video></div>`}</div>`;
}

function materialsContent(showAccessButtons=false){
  return `<div class="card"><h3>Ваши материалы</h3><div class="unlock"><div><strong>Книга «Дневник Успешного Трейдера»</strong></div><button class="mini-btn" type="button" data-action="get-book">Получить</button></div><div class="unlock"><div><strong>Базовый курс по трейдингу</strong><div class="course-meta">5 видеоуроков</div></div><button class="mini-btn" type="button" data-action="open-course">Посмотреть</button></div><div class="unlock"><div><strong>2 консультации с экспертом</strong><div class="muted">Персональный разбор и ответы на вопросы</div></div><button class="mini-btn" type="button" data-action="product-consultation" data-product="${state.recommendedProduct||'signals'}">Записаться</button></div></div><div class="card"><h3>Продукты CM Group</h3><p class="muted">Ниже можно подробнее познакомиться с CM Signals и CM Lab.</p><button class="btn btn-secondary" type="button" data-action="open-product" data-product="signals">Подробнее о CM Signals</button><button class="btn btn-secondary mt-12" type="button" data-action="open-product" data-product="cmlab">Подробнее о CM Lab</button>${showAccessButtons&&!state.phoneSubmitted?'<button class="btn btn-primary mt-16" type="button" data-action="full-access">Открыть полный доступ</button>':''}</div>`;
}

function materials(){return `<section class="screen stack"><div class="card"><span class="profile-badge">Материалы</span><h2 class="mt-16">Ваша обучающая подборка</h2><p class="muted">Книга, базовый курс и консультации доступны в одном разделе.</p>${state.phoneSubmitted?'<p class="access-note">✓ Полный доступ открыт</p>':''}</div>${materialsContent(false)}</section>`}

function course(){
  if(!state.phoneSubmitted){state.pendingAction='open-course';touch();return phone()}
  return `<section class="screen stack"><button class="back-link" type="button" data-nav="materials">← К материалам</button><div class="card course-intro"><span class="profile-badge">Базовый курс</span><h2 class="mt-16">Базовый курс по трейдингу</h2><p class="muted">Пять последовательных уроков из действующего сценария бота CM Group.</p></div>${BASIC_COURSE.map((lesson,index)=>`<div class="card course-lesson"><div class="lesson-number">${index+1}</div><h3>${lesson.title}</h3><div class="video-frame mt-16"><video controls playsinline preload="metadata" src="${esc(lesson.url)}"></video></div></div>`).join('')}</section>`;
}

function products(){
  const list=[['signals','CM Signals','Банковские торговые сигналы, обучение и сопровождение эксперта.'],['cmlab','CM Lab','Автоматические торговые студии, работающие по системному алгоритму.'],['education','QUICK START','Базовый курс по финансовым рынкам, рискам и торговым инструментам.']];
  list.sort((first,second)=>first[0]===state.recommendedProduct?-1:second[0]===state.recommendedProduct?1:0);
  return `<section class="screen stack"><div class="card"><span class="profile-badge">Продукты CM Group</span><h2 class="mt-16">Выберите подходящий формат</h2><p class="muted">Рекомендуемый продукт расположен первым. Откройте карточку, чтобы посмотреть описание и видео.</p></div>${list.map(([id,title,description])=>`<div class="card product-card ${id===state.recommendedProduct?'recommended':''}"><div class="product-accent ${id}"></div><h3>${title}</h3><p class="muted">${description}</p><button class="btn btn-secondary" type="button" data-action="open-product" data-product="${id}">Подробнее</button></div>`).join('')}</section>`;
}
