const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();try{tg.setHeaderColor('#0f064a');tg.setBackgroundColor('#f6f4ff')}catch(e){}}
const questions=[
{key:'experience',title:'Как давно вы в инвестициях или трейдинге?',options:[['beginner','Пока только изучаю'],['chaotic','Недавно, торгую хаотично'],['unstable','Есть опыт, но результат нестабильный'],['losses','Давно, были серьёзные потери или слитые депозиты']]},
{key:'interest',title:'Что вам сейчас интереснее?',options:[['trading','Самостоятельно торговать'],['investing','Инвестировать на долгий срок'],['signals','Получать готовые сделки и рекомендации'],['automation','Автоматизировать торговлю']]},
{key:'capital_range',title:'С каким капиталом вы готовы работать?',options:[['lt100','До 100 000 ₽'],['100_300','100 000–300 000 ₽'],['300_1000','300 000–1 000 000 ₽'],['1000_3000','1 000 000–3 000 000 ₽'],['gt3000','Более 3 000 000 ₽']]},
{key:'main_barrier',title:'Где чаще всего возникает барьер?',options:[['emotions','Принимаю решения на эмоциях'],['fear','Боюсь входить в сделки'],['understanding','Не понимаю, что происходит на рынке'],['strategy','Нет понятной стратегии'],['discipline','Есть стратегия, но нет дисциплины']]},
{key:'goal',title:'Какой результат для вас главный?',options:[['extra_income','Получать дополнительный доход'],['main_income','Создать основной источник дохода'],['capital_growth','Сохранить и приумножить капитал'],['less_emotions','Снизить влияние эмоций и ошибок'],['automate','Автоматизировать торговый процесс'],['inflation','Защитить деньги от инфляции']]}
];
const defaults={screen:'welcome',step:0,answers:{},name:'',phone:'',consent:false,quizCompleted:false,phoneSubmitted:false,calculatorCompleted:false,recommendedProduct:null,profile:null,selectedProduct:'signals',profile:null,calc:{capital:5000,months:6}};let state={...defaults,...JSON.parse(localStorage.getItem('cm-state')||'{}')};const app=document.getElementById('app'),bottomNav=document.getElementById('bottomNav'),menuButton=document.getElementById('menuButton');
const save=()=>localStorage.setItem('cm-state',JSON.stringify(state));const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' $';const toast=t=>{let e=document.getElementById('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2000)};const setScreen=s=>{state.screen=s;save();render();scrollTo(0,0)};const esc=s=>(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function send(event,extra={}){const p={event,quiz_completed:state.quizCompleted?'yes':'no',name:state.name,phone:state.phone,...state.answers,recommended_product:state.recommendedProduct,calculator_completed:state.calculatorCompleted?'yes':'no',consent_personal_data:state.consent?'yes':'no',miniapp_completed_at:new Date().toISOString(),...extra};if(tg?.sendData)tg.sendData(JSON.stringify(p));else{console.log(p);toast('Данные подготовлены для SaleBot')}}
function diagnose(){let a=state.answers,p='education';if(a.interest==='automation'||a.goal==='automate'||['emotions','discipline'].includes(a.main_barrier))p='cmlab';else if(a.interest==='signals'||['unstable','losses'].includes(a.experience))p='signals';let profile={title:'Начинающий инвестор',subtitle:'Вам важно выстроить базу и понять риски до активных действий.',score:62};if(['unstable','losses'].includes(a.experience))profile={title:'Трейдер с опытом, но без системного подхода',subtitle:'Главный резерв роста — дисциплина, повторяемость решений и контроль рисков.',score:78};else if(a.interest==='automation')profile={title:'Инвестор, готовый к системной автоматизации',subtitle:'Вам подходит формат, который снижает влияние эмоций и ручных ошибок.',score:84};else if(a.interest==='signals')profile={title:'Практичный трейдер, ориентированный на готовые решения',subtitle:'Вам важны скорость, структура и понятные рекомендации.',score:81};state.recommendedProduct=p;state.profile=profile;state.quizCompleted=true;save()}
function nav(){let show=['dashboard','result','calculator','materials','products','productDetail'].includes(state.screen);bottomNav.classList.toggle('hidden',!show);menuButton.classList.toggle('hidden',!show);bottomNav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.screen))}
function welcome(){return `<section class="screen stack"><div class="hero"><div class="eyebrow">Персональный кабинет инвестора</div><h1>Узнайте, что мешает вам получать результат на финансовых рынках</h1><p class="lead">Ответьте на 5 вопросов. Мы определим ваш уровень, покажем точку роста и откроем персональный набор материалов.</p><button class="btn btn-primary mt-16" data-action="start">Начать диагностику</button><p class="center mt-12">Займёт около 2 минут</p></div><div class="grid two">${['Персональная диагностика','2 видеоурока','Книга','Тестовый доступ','Финансовый калькулятор','2 консультации'].map((x,i)=>`<div class="card benefit"><div class="benefit-icon">${['◎','▶','▤','◆','↗','✦'][i]}</div><strong>${x}</strong></div>`).join('')}</div></section>`}
function quiz(){let q=questions[state.step],pct=Math.round((state.step+1)/5*100);return `<section class="screen"><div class="card"><div class="progress-head"><span>Вопрос ${state.step+1} из 5</span><span>${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="eyebrow mt-16" style="color:var(--purple)">До рекомендации осталось менее минуты</div><h2>${q.title}</h2><div class="options">${q.options.map(([v,l])=>`<button class="option ${state.answers[q.key]===v?'selected':''}" data-answer="${v}"><span class="radio"></span><span>${l}</span></button>`).join('')}</div><div class="grid two mt-16"><button class="btn btn-ghost" data-action="prev">Назад</button><button class="btn btn-primary" data-action="next">${state.step===4?'Получить результат':'Далее'}</button></div></div></section>`}
function analysis(){return `<section class="screen"><div class="card center"><span class="profile-badge">Анализ ответов</span><h2 class="mt-16">Формируем персональную рекомендацию</h2><div class="loader-list">${['Анализируем опыт','Определяем уровень риска','Ищем ключевой барьер','Подбираем подходящий путь','Формируем рекомендации'].map((x,i)=>`<div class="loader-item" data-loader="${i}"><span class="loader-dot">•</span><span>${x}</span></div>`).join('')}</div></div></section>`}
function recommendation(){let m={signals:['CM Signals','Готовые сделки и рекомендации для пользователей, которые уже понимают базовые принципы торговли.'],cmlab:['CM Lab','Системный и автоматизированный подход для снижения влияния эмоций и ручных ошибок.'],education:['Обучение','Базовые уроки по рынкам, рискам и принятию решений.']},[t,d]=m[state.recommendedProduct]||m.education;return `<div class="card product-card recommended"><h3>${t}</h3><p class="muted">${d}</p><button class="btn btn-secondary" data-nav="products">Подробнее</button></div>`}
function result(){let p=state.profile||{title:'Ваш профиль готов',subtitle:'Рекомендация сформирована.',score:75};return `<section class="screen stack"><div class="card"><span class="profile-badge">Ваш результат</span><div class="grid two mt-16"><div><h2>${p.title}</h2><p class="muted">${p.subtitle}</p></div><div class="center"><div class="score">${p.score}</div><div class="muted">индекс потенциала</div></div></div><div class="card soft"><strong>Главная точка роста</strong><p class="muted mt-12">Главный барьер — отсутствие системы, которая помогает повторять правильные действия и контролировать риски.</p></div><button class="btn btn-primary mt-16" data-action="continue-name">${state.name?'Открыть подборку':'Сохранить мою подборку'}</button></div>${recommendation()}</section>`}
function nameScreen(){return `<section class="screen"><div class="card"><span class="profile-badge">Персонализация</span><h2 class="mt-16">Ваш результат готов</h2><p class="muted">Как к вам обращаться, чтобы сохранить персональную подборку?</p><div class="field"><label>Имя</label><input id="name" value="${esc(state.name)}" placeholder="Например, Александр"></div><button class="btn btn-primary mt-16" data-action="save-name">Сохранить результат</button></div></section>`}
function gifts(){let rows=[['Видеоурок 1','Основы финансовых рынков',1],['Видеоурок 2','Как принимать решения без хаоса',1],['Книга','Дневник успешного трейдера',1],['Тестовый доступ','К продуктам CM Group',0],['Финансовый калькулятор','Два сценария роста капитала',0],['2 консультации','С экспертом CM Group',0]];return `<section class="screen"><div class="card"><span class="profile-badge">Стартовая подборка</span><h2 class="mt-16">${state.name?esc(state.name)+', ':''}ваши материалы готовы</h2>${rows.map(([a,b,o])=>`<div class="unlock"><div><strong>${a}</strong><div class="muted">${b}</div></div><strong class="${o?'ok':'lock'}">${o?'Открыто':'Закрыто'}</strong></div>`).join('')}<button class="btn btn-primary mt-16" data-nav="phone">Открыть полный доступ</button><button class="btn btn-ghost mt-12" data-action="skip-phone">Продолжить без консультации</button></div></section>`}
function phone(){return `<section class="screen"><div class="card"><span class="profile-badge">Полный доступ</span><h2 class="mt-16">Откройте материалы и сохраните расчёт</h2><p class="muted">Укажите телефон — отправим доступ и сможем помочь, если появятся вопросы.</p><div class="field"><label>Телефон</label><input id="phone" type="tel" value="${esc(state.phone)}" placeholder="+7 999 000-00-00"></div><label class="checkline mt-16"><input id="consent" type="checkbox" ${state.consent?'checked':''}><span>Согласен на обработку персональных данных и получение информационных сообщений.</span></label><button class="btn btn-primary mt-16" data-action="submit-phone">Получить полный доступ</button><button class="btn btn-ghost mt-12" data-action="skip-phone">Продолжить без консультации</button></div></section>`}
function dashboard(){let c=[state.quizCompleted,state.calculatorCompleted,state.phoneSubmitted].filter(Boolean).length;return `<section class="screen stack"><div class="hero"><div class="eyebrow">Личный кабинет</div><h1>${state.name?'Здравствуйте, '+esc(state.name):'Ваш персональный кабинет'}</h1><p class="lead">Диагностика сохранена. Продолжайте знакомство с возможностями CM Group.</p><div class="kpi-row"><div class="kpi"><strong>${state.profile?.score||'—'}</strong><span>потенциал</span></div><div class="kpi"><strong>${c}/3</strong><span>этапа</span></div><div class="kpi"><strong>${state.phoneSubmitted?'100%':'67%'}</strong><span>доступ</span></div></div></div><div class="grid two"><button class="card" data-nav="result"><strong>Мой результат</strong></button><button class="card" data-nav="calculator"><strong>Калькулятор</strong></button><button class="card" data-nav="materials"><strong>Материалы</strong></button><button class="card" data-nav="products"><strong>Продукты</strong></button></div><button class="btn btn-primary" data-action="return-bot">Вернуться в Telegram-бот</button><button class="btn btn-ghost" data-action="reset">Сбросить демо</button></section>`}
function calculator(){let c=+state.calc.capital,m=+state.calc.months,s=c*Math.pow(1.17,m),l=c*Math.pow(1.12,m),max=Math.max(s,l);let poly=r=>Array.from({length:m+1},(_,i)=>{let v=c*Math.pow(1+r,i),x=12+i/m*296,y=160-v/max*130;return `${x},${y}`}).join(' ');return `<section class="screen stack"><div class="card"><span class="profile-badge">Финансовый калькулятор</span><h2 class="mt-16">Рассчитайте два сценария</h2><div class="field"><label>Стартовый капитал</label><input id="capital" type="number" min="3000" max="20000" step="500" value="${c}"></div><div class="field mt-16"><label>Срок, месяцев</label><select id="months">${[3,4,5,6,7,8,9,10,11,12].map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><button class="btn btn-primary mt-16" data-action="calculate">Произвести расчёт</button></div><div class="card"><div class="legend"><span>CM Signals — 17%/мес.</span><span>CM Lab — 12%/мес.</span></div><div class="chart"><svg viewBox="0 0 320 180"><g class="chart-grid"><line x1="10" y1="30" x2="310" y2="30"/><line x1="10" y1="90" x2="310" y2="90"/><line x1="10" y1="150" x2="310" y2="150"/></g><polyline class="chart-line-a" points="${poly(.17)}"/><polyline class="chart-line-b" points="${poly(.12)}"/></svg></div><div class="grid two"><div class="stat"><span class="muted">CM Signals</span><strong>${money(s)}</strong></div><div class="stat"><span class="muted">CM Lab</span><strong>${money(l)}</strong></div></div><p class="disclaimer mt-16">Расчёт носит информационный характер и не является гарантией доходности или индивидуальной инвестиционной рекомендацией.</p></div></section>`}
function materials(){let lock=!state.phoneSubmitted;return `<section class="screen stack"><div class="card"><span class="profile-badge">Материалы</span><h2 class="mt-16">Ваша обучающая подборка</h2></div>${[['Видеоурок 1','Основы финансовых рынков',0],['Видеоурок 2','Как принимать решения без хаоса',0],['Книга','Дневник успешного трейдера',0],['Тестовый доступ','Доступ к продуктам CM Group',lock],['2 консультации','Персональная работа с экспертом',lock]].map(([t,d,k])=>`<div class="card"><h3>${t}</h3><p class="muted">${d}</p><button class="btn ${k?'btn-ghost':'btn-secondary'}" data-action="${k?'need-phone':'demo-material'}">${k?'Открыть доступ':'Открыть материал'}</button></div>`).join('')}</section>`}
function products(){
let a=[
['signals','CM Signals','Банковские торговые сигналы, обучение и сопровождение эксперта.'],
['cmlab','CM Lab','Автоматические торговые студии, работающие по системному алгоритму.'],
['education','QUICK START','Базовый курс по финансовым рынкам, рискам и торговым инструментам.']
];
a.sort((x,y)=>x[0]===state.recommendedProduct?-1:y[0]===state.recommendedProduct?1:0);
return `<section class="screen stack">
<div class="card"><span class="profile-badge">Продукты CM Group</span><h2 class="mt-16">Выберите подходящий формат</h2><p class="muted">Рекомендуемый продукт расположен первым. Откройте карточку, чтобы посмотреть описание, видео и варианты подключения.</p></div>
${a.map(([id,t,d])=>`<div class="card product-card ${id===state.recommendedProduct?'recommended':''}">
<div class="product-accent ${id}"></div>
<h3>${t}</h3><p class="muted">${d}</p>
<button class="btn btn-secondary" data-action="open-product" data-product="${id}">Подробнее</button>
</div>`).join('')}</section>`}

function productDetail(){
const id=state.selectedProduct||'signals';
const data={
signals:{
title:'CM Signals',
label:'Банковские сигналы',
color:'signals',
intro:'Формат для тех, кто хочет получать готовые рекомендации по сделкам и уделять торговле около 15 минут в неделю.',
video:'https://files.salebot.pro/uploads/file_item/48111350/file/657680/CM_Signals_-_готовое_решение_для_экономии_вашего_времени_и_сил-original.mp4',
how:['Получаете SMS с рекомендацией о совершении сделки','Копируете торговые позиции в мобильной платформе','Контролируете результат вместе с сопровождением эксперта'],
benefits:['Банковские торговые сигналы','Сопровождение от эксперта','Курс QUICK START в подарок','Доступ в закрытый клуб трейдеров'],
variants:[
['CM Signals','Базовые банковские сигналы и рекомендации'],
['CM News','CM Signals плюс SMS-рекомендации перед ключевыми новостными событиями'],
['CM Stocks','Сигналы по акциям крупных компаний и фондовым индексам']
]
},
cmlab:{
title:'CM Lab',
label:'Автоматические торговые студии',
color:'cmlab',
intro:'Системный формат для пользователей, которые хотят автоматизировать торговлю и снизить влияние эмоций и ручных ошибок.',
video:'https://files.salebot.pro/uploads/file_item/48111473/file/657680/CM_LAB_-_автоматизированная_торговая_студия__2_.mp4',
how:['Подключается торговый счёт','Выбирается конфигурация CM Lab под размер капитала и задачи','Система анализирует рынок и автоматически выставляет сделки'],
benefits:['Автоматизированная логика','Работа 24 часа в сутки 5 дней в неделю','Несколько конфигураций под разные инструменты','Возможность подобрать решение под размер депозита'],
variants:[
['CM Lab Start','Базовая конфигурация для небольших депозитов'],
['CM Lab Advanced','Расширенная фильтрация и несколько автономных модулей'],
['CM Lab Pro','Мультиинструментальная система с расширенной диверсификацией'],
['CM Lab Metals','Конфигурация на драгоценных металлах'],
['CM Lab Stocks','Студия на фондовых индексах'],
['Golden / Energy LAB','Специализированные конфигурации на золоте и энергетических инструментах']
]
},
education:{
title:'QUICK START',
label:'Обучение',
color:'education',
intro:'Курс для быстрого освоения базовых принципов торговли на фондовых, валютных и сырьевых рынках.',
video:'https://kinescope.io/tGFd2YBtc7khcECWLTmy9A',
how:['Изучаете основы финансовых рынков и торговые терминалы','Осваиваете технический анализ и риск-менеджмент','Закрепляете материал на практике и домашних заданиях'],
benefits:['10 уроков и 3 модуля','Технический анализ','Риск-менеджмент','Практика, консультации и наставничество'],
variants:[['QUICK START','Базовая программа обучения'],['Персональный разбор','Подбор следующего шага под вашу цель и уровень опыта']]
}
}[id];
return `<section class="screen stack">
<button class="back-link" data-nav="products">← Все продукты</button>
<div class="card product-hero ${data.color}">
<span class="profile-badge">${data.label}</span>
<h2 class="mt-16">${data.title}</h2>
<p class="muted">${data.intro}</p>
</div>
<div class="card">
<h3>Видео о продукте</h3>
<div class="video-frame mt-16">
<video controls playsinline preload="metadata" src="${data.video}"></video>
</div>
<p class="disclaimer mt-12">Видео загружается из материалов действующей воронки SaleBot.</p>
</div>
<div class="card">
<h3>Как это работает</h3>
<div class="steps-list">${data.how.map((x,i)=>`<div class="step-row"><span>${i+1}</span><p>${x}</p></div>`).join('')}</div>
</div>
<div class="card">
<h3>Что входит</h3>
<div class="feature-list">${data.benefits.map(x=>`<div class="feature-item"><span>✓</span><p>${x}</p></div>`).join('')}</div>
</div>
<div class="card">
<h3>Варианты продукта</h3>
${data.variants.map(([t,d])=>`<div class="variant-row"><div><strong>${t}</strong><p class="muted">${d}</p></div><button class="mini-btn" data-action="select-variant" data-variant="${esc(t)}">Выбрать</button></div>`).join('')}
</div>
<div class="card soft">
<h3>Следующий шаг</h3>
<p class="muted">Оставьте заявку, чтобы получить актуальные условия, подобрать конфигурацию и задать вопросы специалисту.</p>
<button class="btn btn-primary" data-action="product-consultation" data-product="${id}">Получить консультацию</button>
<button class="btn btn-ghost mt-12" data-action="product-to-bot" data-product="${id}">Продолжить в Telegram-боте</button>
</div>
<p class="disclaimer center">Торговля финансовыми инструментами связана с риском потери капитала. Информация о продукте не является гарантией доходности или индивидуальной инвестиционной рекомендацией.</p>
</section>`}
function render(){nav();let f={welcome,quiz,analysis,result,name:nameScreen,gifts,phone,dashboard,calculator,materials,products,productDetail}[state.screen]||welcome;app.innerHTML=f();bind()}
function bind(){document.querySelectorAll('[data-nav]').forEach(e=>e.onclick=()=>setScreen(e.dataset.nav==='home'?'welcome':e.dataset.nav));document.querySelectorAll('[data-answer]').forEach(e=>e.onclick=()=>{state.answers[questions[state.step].key]=e.dataset.answer;save();const group=e.closest('.options');if(group){group.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));e.classList.add('selected')} });document.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>{let a=e.dataset.action;if(a==='start'){state.step=0;setScreen('quiz')}if(a==='prev'&&state.step>0){state.step--;save();render()}if(a==='next'){if(!state.answers[questions[state.step].key])return toast('Выберите вариант');if(state.step<4){state.step++;save();render()}else{diagnose();setScreen('analysis');setTimeout(runAnalysis,100)}}if(a==='continue-name')setScreen(state.name?'gifts':'name');if(a==='save-name'){let v=document.getElementById('name').value.trim();if(v.length<2)return toast('Введите имя');state.name=v;save();send('name_saved');setScreen('gifts')}if(a==='skip-phone'){send('phone_skipped');setScreen('dashboard')}if(a==='submit-phone'){let p=document.getElementById('phone').value.trim(),c=document.getElementById('consent').checked;if(p.replace(/\D/g,'').length<10)return toast('Введите корректный телефон');if(!c)return toast('Нужно согласие');state.phone=p;state.consent=true;state.phoneSubmitted=true;save();send('lead_completed');setScreen('dashboard')}if(a==='calculate'){state.calc={capital:+document.getElementById('capital').value,months:+document.getElementById('months').value};state.calculatorCompleted=true;save();send('calculator_completed',{calculator:state.calc});render();toast('Расчёт обновлён')}if(a==='need-phone')setScreen('phone');if(a==='demo-material')toast('В демо материал отмечен как открытый');if(a==='open-product'){state.selectedProduct=e.dataset.product;save();setScreen('productDetail')}
if(a==='select-variant'){send('product_variant_selected',{product:state.selectedProduct,variant:e.dataset.variant});toast('Вариант сохранён')}
if(a==='product-consultation'){send('product_consultation_requested',{product:e.dataset.product});if(state.phoneSubmitted){toast('Заявка передана специалисту')}else{setScreen('phone')}}
if(a==='product-to-bot'){send('product_to_bot',{product:e.dataset.product});if(tg?.close)tg.close();else toast('В Telegram откроется продолжение сценария в боте')}if(a==='return-bot'){send('return_to_bot');if(tg?.close)tg.close();else toast('В Telegram окно закроется и вернёт пользователя в бота')}if(a==='reset'&&confirm('Сбросить демо?')){localStorage.removeItem('cm-state');state={...defaults,answers:{},calc:{capital:5000,months:6}};render()}})}
function runAnalysis(){let a=[...document.querySelectorAll('[data-loader]')];a.forEach((e,i)=>setTimeout(()=>{e.classList.add('done');e.querySelector('.loader-dot').textContent='✓';if(i===a.length-1)setTimeout(()=>setScreen('result'),500)},350+i*400))}
bottomNav.onclick=e=>{let b=e.target.closest('[data-nav]');if(b)setScreen(b.dataset.nav)};menuButton.onclick=()=>setScreen('dashboard');render();
