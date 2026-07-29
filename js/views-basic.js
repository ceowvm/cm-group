function loading(){return `<section class="screen"><div class="card center loading-card"><div class="loading-spinner" aria-hidden="true"></div><h2>Загружаем ваш кабинет</h2><p class="muted">Проверяем сохранённый профиль и доступ к материалам.</p></div></section>`}

function welcome(){
  const benefits=[['▶','Видеоуроки по инвестициям и трейдингу'],['▤','Книга «Дневник Успешного Трейдера»'],['◆','Тестовый доступ к продуктам CM Group'],['↗','Финансовый калькулятор'],['✦','2 консультации с экспертом']];
  return `<section class="screen stack"><div class="hero"><div class="eyebrow">Персональный кабинет инвестора</div><h1>Узнайте, что мешает вам получать результат на финансовых рынках</h1><p class="lead">Ответьте на 5 вопросов. Мы определим ваш уровень, покажем точку роста и откроем персональный набор материалов.</p><button class="btn btn-primary mt-16" type="button" data-action="start">Начать диагностику</button><p class="center mt-12">Займёт около 2 минут</p></div><div class="card soft welcome-materials-title"><h3>После прохождения диагностики вам будут доступны следующие материалы</h3></div><div class="grid two welcome-benefits">${benefits.map(([icon,text],index)=>`<div class="card benefit ${index===benefits.length-1?'benefit-wide':''}"><div class="benefit-icon">${icon}</div><strong>${text}</strong></div>`).join('')}</div></section>`;
}

function quiz(){
  const question=questions[state.step];
  const percentage=Math.round((state.step+1)/questions.length*100);
  return `<section class="screen"><div class="card"><div class="progress-head"><span>Вопрос ${state.step+1} из ${questions.length}</span><span>${percentage}%</span></div><div class="progress"><span style="width:${percentage}%"></span></div><div class="eyebrow mt-16">До рекомендации осталось менее минуты</div><h2>${question.title}</h2><div class="options">${question.options.map(([value,label])=>`<button class="option ${state.answers[question.key]===value?'selected':''}" type="button" data-answer="${value}"><span class="radio" aria-hidden="true"></span><span>${label}</span></button>`).join('')}</div><div class="grid two mt-16"><button class="btn btn-ghost" type="button" data-action="prev" ${state.step===0?'disabled':''}>Назад</button><button class="btn btn-primary" type="button" data-action="next">${state.step===questions.length-1?'Получить результат':'Далее'}</button></div></div></section>`;
}

function analysis(){return `<section class="screen"><div class="card center"><span class="profile-badge">Анализ ответов</span><h2 class="mt-16">Формируем персональную рекомендацию</h2><div class="loader-list">${['Анализируем опыт','Определяем уровень риска','Ищем ключевой барьер','Подбираем подходящий путь','Формируем рекомендации'].map((text,index)=>`<div class="loader-item" data-loader="${index}"><span class="loader-dot">•</span><span>${text}</span></div>`).join('')}</div></div></section>`}

function recommendation(){
  const products={signals:['CM Signals','Готовые сделки и рекомендации для пользователей, которые уже понимают базовые принципы торговли.'],cmlab:['CM Lab','Системный и автоматизированный подход для снижения влияния эмоций и ручных ошибок.'],education:['QUICK START','Базовые уроки по рынкам, рискам и принятию решений.']};
  const [title,description]=products[state.recommendedProduct]||products.education;
  return `<div class="card product-card recommended"><h3>${title}</h3><p class="muted">${description}</p><button class="btn btn-secondary" type="button" data-action="open-product" data-product="${state.recommendedProduct||'education'}">Подробнее</button></div>`;
}

function result(){
  const profile=state.profile||{title:'Ваш профиль готов',subtitle:'Рекомендация сформирована.'};
  return `<section class="screen stack"><div class="card"><span class="profile-badge">Ваш результат</span><div class="mt-16"><h2>${esc(profile.title)}</h2><p class="muted">${esc(profile.subtitle)}</p></div><div class="card soft mt-16"><strong>Описание профиля</strong><p class="muted mt-12">Ваши ответы показывают, что сейчас для вас важнее всего перейти от отдельных решений к понятной системе: заранее определять правила входа, контролировать риск и оценивать результат по повторяемому процессу, а не по одной сделке.</p></div><div class="card soft"><strong>Главная точка роста</strong><p class="muted mt-12">Сформировать последовательный подход, который помогает снижать влияние эмоций, повторять правильные действия и контролировать риски.</p></div><button class="btn btn-primary mt-16" type="button" data-action="continue-name">${state.nameConfirmed?'Открыть подборку':'Сохранить мою подборку'}</button></div>${recommendation()}</section>`;
}

function nameScreen(){return `<section class="screen"><div class="card"><span class="profile-badge">Персонализация</span><h2 class="mt-16">Ваш результат готов</h2><p class="muted">Как к вам обращаться, чтобы сохранить персональную подборку?</p><div class="field"><label for="name">Имя</label><input id="name" value="${esc(state.name)}" maxlength="80" autocomplete="given-name" placeholder="Например, Александр"></div><button class="btn btn-primary mt-16" type="button" data-action="save-name">Сохранить результат</button></div></section>`}

function gifts(){return `<section class="screen stack"><div class="card"><span class="profile-badge">Стартовая подборка</span><h2 class="mt-16">${state.name?esc(state.name)+', ':''}ваши материалы готовы</h2><p class="muted">Книга, базовый курс и дополнительные видеоуроки уже собраны в одном месте. Для открытия материалов достаточно один раз оставить номер телефона.</p></div>${materialsContent(true)}</section>`}

function phone(){
  const isGate=Boolean(state.pendingAction);
  return `<section class="screen"><div class="card"><span class="profile-badge">Полный доступ</span><h2 class="mt-16">${isGate?'Откройте выбранный материал':'Откройте материалы и сохраните расчёт'}</h2><p class="muted">Укажите телефон один раз — после этого все материалы и функции будут открываться без повторного запроса.</p><div class="field"><label for="phone">Телефон</label><input id="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" value="${esc(state.phone)}" placeholder="+7 999 000-00-00"></div><label class="checkline mt-16"><input id="consent" type="checkbox" ${state.consent?'checked':''}><span>Согласен на <button class="legal-link" type="button" data-action="privacy-policy">обработку персональных данных</button> и получение информационных сообщений.</span></label><button class="btn btn-primary mt-16" type="button" data-action="submit-phone">Получить полный доступ</button><button class="btn btn-ghost mt-12" type="button" data-action="cancel-phone">Назад</button></div></section>`;
}

function dashboard(){
  const completed=[state.quizCompleted,state.calculatorCompleted,state.phoneSubmitted].filter(Boolean).length;
  const storageText=syncMode==='synced'?'Профиль синхронизирован с вашим Telegram-аккаунтом.':'Прогресс сохранён на этом устройстве; серверная синхронизация временно недоступна.';
  return `<section class="screen stack"><div class="hero"><div class="eyebrow">Личный кабинет</div><h1>${state.name?'Здравствуйте, '+esc(state.name):'Ваш персональный кабинет'}</h1><p class="lead">${storageText}</p><div class="kpi-row"><div class="kpi"><strong>${state.profile?.title?'Готов':'—'}</strong><span>профиль</span></div><div class="kpi"><strong>${completed}/3</strong><span>этапа</span></div><div class="kpi"><strong>${state.phoneSubmitted?'100%':'67%'}</strong><span>доступ</span></div></div></div><div class="grid two dashboard-grid"><button class="card" type="button" data-nav="result"><strong>Мой результат</strong></button><button class="card" type="button" data-nav="calculator"><strong>Калькулятор</strong></button><button class="card" type="button" data-nav="materials"><strong>Материалы</strong></button><button class="card" type="button" data-nav="products"><strong>Продукты</strong></button></div><button class="btn btn-primary" type="button" data-action="return-bot">Вернуться в Telegram-бот</button>${DEBUG_MODE?'<button class="btn btn-ghost" type="button" data-action="reset">Сбросить тестовый профиль</button>':''}</section>`;
}

function calculator(){
  const capital=state.calc.capital;
  const months=state.calc.months;
  const signals=capital*Math.pow(1.17,months);
  const lab=capital*Math.pow(1.12,months);
  const max=Math.max(signals,lab,1);
  const plot={left:52,right:340,top:16,bottom:176};
  const x=index=>plot.left+index/months*(plot.right-plot.left);
  const y=value=>plot.bottom-value/max*(plot.bottom-plot.top);
  const polyline=rate=>Array.from({length:months+1},(_,index)=>`${x(index)},${y(capital*Math.pow(1+rate,index))}`).join(' ');
  const yTicks=Array.from({length:5},(_,index)=>{const value=max*index/4;return `<g class="chart-axis-tick"><line x1="${plot.left}" y1="${y(value)}" x2="${plot.right}" y2="${y(value)}"/><text x="${plot.left-7}" y="${y(value)+3}" text-anchor="end">${Math.round(value).toLocaleString('ru-RU')}</text></g>`}).join('');
  const monthStep=Math.max(1,Math.ceil(months/6));
  const monthTicks=Array.from({length:months+1},(_,index)=>index).filter(index=>index===0||index===months||index%monthStep===0).map(index=>`<g class="chart-axis-tick"><line x1="${x(index)}" y1="${plot.bottom}" x2="${x(index)}" y2="${plot.bottom+4}"/><text x="${x(index)}" y="${plot.bottom+17}" text-anchor="middle">${index}</text></g>`).join('');
  return `<section class="screen stack"><div class="card"><span class="profile-badge">Финансовый калькулятор</span><h2 class="mt-16">Рассчитайте ваш доход</h2><div class="field"><label for="capital">Стартовый капитал ($)</label><input id="capital" type="number" min="3000" max="20000" step="500" value="${capital}"></div><div class="field mt-16"><label for="months">Срок инвестиций (месяцев)</label><select id="months">${ALLOWED_MONTHS.map(value=>`<option value="${value}" ${value===months?'selected':''}>${value}</option>`).join('')}</select></div><button class="btn btn-primary mt-16" type="button" data-action="calculate">Рассчитать</button></div><div class="card"><h3>Размер вашего дохода при использовании продуктов CM Group</h3><div class="chart mt-16"><svg viewBox="0 0 360 220" preserveAspectRatio="none" role="img" aria-label="График расчёта дохода"><g class="chart-grid">${yTicks}</g><line class="chart-axis" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}"/><line class="chart-axis" x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}"/>${monthTicks}<text class="chart-axis-label" x="196" y="214" text-anchor="middle">Месяцы</text><text class="chart-axis-label" x="12" y="96" text-anchor="middle" transform="rotate(-90 12 96)">Доход ($)</text><polyline class="chart-line-a" points="${polyline(.17)}"/><polyline class="chart-line-b" points="${polyline(.12)}"/></svg></div><div class="grid two"><div class="stat"><span class="signals-label">CM Signals</span><strong>${money(signals)}</strong></div><div class="stat"><span class="lab-label">CM Lab</span><strong>${money(lab)}</strong></div></div><p class="disclaimer mt-16">Расчёт носит информационный характер и не является гарантией доходности или индивидуальной инвестиционной рекомендацией.</p></div></section>`;
}

