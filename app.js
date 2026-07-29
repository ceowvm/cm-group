'use strict';

const APP_VERSION='3.0.0';
const API_BASE='./api';
const BOT_URL='https://t.me/cmgroup_pro_bot';
const POLICY_URL='https://cmgroup.pro/policy';
const LOCAL_KEY='cm-state-v3';
const LEGACY_LOCAL_KEY='cm-state';
const ALLOWED_MONTHS=[3,4,5,6,9,12];
const ALLOWED_SCREENS=new Set(['welcome','quiz','analysis','result','name','gifts','phone','dashboard','calculator','materials','course','products','productDetail']);
const PROTECTED_ACTIONS=new Set(['get-book','open-course','open-lesson','product-consultation','full-access']);
const DEBUG_MODE=new URLSearchParams(location.search).get('debug')==='1';

const tg=window.Telegram?.WebApp||null;
if(tg){
  tg.ready();
  tg.expand();
  try{
    tg.setHeaderColor('#0f064a');
    tg.setBackgroundColor('#08051f');
    if(tg.isVersionAtLeast?.('7.10'))tg.setBottomBarColor('#08051f');
  }catch(error){console.warn('Telegram theme setup failed',error)}
}

const telegramInitData=tg?.initData||'';
const telegramUser=tg?.initDataUnsafe?.user||null; // Только для предварительного отображения. Сервер проверяет initData.
const TELEGRAM_FIRST_NAME=String(telegramUser?.first_name||'').trim();

const BOOK_URL='https://files.salebot.pro/uploads/file_item/50746670/file/657680/%D0%94%D0%BD%D0%B5%D0%B2%D0%BD%D0%B8%D0%BA_%D1%83%D1%81%D0%BF%D0%B5%D1%88%D0%BD%D0%BE%D0%B3%D0%BE_%D1%82%D1%80%D0%B5%D0%B9%D0%B4%D0%B5%D1%80%D0%B0.pdf';
const SIGNALS_VIDEO='https://files.salebot.pro/uploads/file_item/48111350/file/657680/CM_Signals_-_готовое_решение_для_экономии_вашего_времени_и_сил-original.mp4';
const LAB_VIDEO='https://files.salebot.pro/uploads/file_item/48111473/file/657680/CM_LAB_-_автоматизированная_торговая_студия__2_.mp4';
const LESSON_1='https://kinescope.io/fcTQwi5Rtrgk9GBkjL9K7v';
const LESSON_2='https://files.salebot.pro/uploads/file_item/51782026/file/657680/%D0%A0%D0%B8%D1%81%D0%BA-%D0%BC%D0%B5%D0%BD%D0%B5%D0%B4%D0%B6%D0%BC%D0%B5%D0%BD%D1%82_%D0%9F%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%BE_%D1%82%D1%80%D0%B5%D1%85_%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D1%83%D1%80%D1%81_%D0%A7%D0%B0%D1%81%D1%82%D1%8C_%D1%81%D0%B5%D0%BC%D1%8C__get-speed.com_.mp4';

const BASIC_COURSE=[
  {title:'Урок 1. Финансовые рынки и рынок фиксированного дохода',url:'https://files.salebot.pro/uploads/file_item/49908883/file/657680/%D0%A4%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D1%8B%D0%B5_%D1%80%D1%8B%D0%BD%D0%BA%D0%B8._%D0%A0%D1%8B%D0%BD%D0%BE%D0%BA_%D1%84%D0%B8%D0%BA%D1%81%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D0%BE%D0%B3%D0%BE_%D0%B4%D0%BE%D1%85%D0%BE%D0%B4%D0%B0._%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D1%83%D1%80%D1%81_%D1%87%D0%B0%D1%81%D1%82%D1%8C_%D0%BF%D0%B5%D1%80%D0%B2%D0%B0%D1%8F.mp4'},
  {title:'Урок 2. Товарно-сырьевой и фондовый рынок',url:'https://files.salebot.pro/uploads/file_item/49908995/file/657680/%D0%A2%D0%BE%D0%B2%D0%B0%D1%80%D0%BD%D0%BE-%D1%81%D1%8B%D1%80%D1%8C%D0%B5%D0%B2%D0%BE%D0%B9_%D0%B8_%D1%84%D0%BE%D0%BD%D0%B4%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D1%83%D1%80%D1%81_%D0%B4%D0%BB%D1%8F_%D1%82%D0%BE%D1%80%D0%B3%D1%83%D1%8E%D1%89%D0%B8%D1%85_%D1%82%D1%80%D0%B5%D0%B9%D0%B4%D0%B5%D1%80%D0%BE%D0%B2___%D1%87%D0%B0%D1%81%D1%82%D1%8C_2.mp4'},
  {title:'Урок 3. Валютный рынок',url:'https://files.salebot.pro/uploads/file_item/51781400/file/657680/%D0%92%D0%B0%D0%BB%D1%8E%D1%82%D0%BD%D1%8B%D0%B9_%D1%80%D1%8B%D0%BD%D0%BE%D0%BA_%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D1%83%D1%80%D1%81_%D1%87%D0%B0%D1%81%D1%82%D1%8C_%D1%82%D1%80%D0%B5%D1%82%D1%8C%D1%8F__get-speed.com_.mp4'},
  {title:'Урок 4. Фундаментальный анализ',url:'https://files.salebot.pro/uploads/file_item/51781924/file/657680/%D0%A4%D1%83%D0%BD%D0%B4%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9_%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7_%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D1%83%D1%80%D1%81_%D1%87%D0%B0%D1%81%D1%82%D1%8C_%D1%87%D0%B5%D1%82%D0%B2%D0%B5%D1%80%D1%82%D0%B0%D1%8F__get-speed.com_.mp4'},
  {title:'Урок 5. Технический анализ',url:'https://files.salebot.pro/uploads/file_item/51781984/file/657680/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9_%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7_%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D1%83%D1%80%D1%81_%D1%87%D0%B0%D1%81%D1%82%D1%8C_%D0%BF%D1%8F%D1%82%D0%B0%D1%8F__get-speed.com_.mp4'}
];

const questions=[
  {key:'experience',title:'Как давно вы в инвестициях или трейдинге?',options:[['beginner','Пока только изучаю'],['chaotic','Недавно, торгую хаотично'],['unstable','Есть опыт, но результат нестабильный'],['losses','Давно, были серьёзные потери или слитые депозиты']]},
  {key:'interest',title:'Что вам сейчас интереснее?',options:[['trading','Самостоятельно торговать'],['investing','Инвестировать на долгий срок'],['signals','Получать готовые сделки и рекомендации'],['automation','Автоматизировать торговлю']]},
  {key:'capital_range',title:'С каким капиталом вы готовы работать?',options:[['100_300','100 000 – 300 000 ₽'],['300_1000','300 000 – 1 000 000 ₽'],['1000_3000','1 000 000 – 3 000 000 ₽'],['gt3000','Более 3 000 000 ₽']]},
  {key:'main_barrier',title:'Где чаще всего возникает барьер?',options:[['emotions','Принимаю решения на эмоциях'],['fear','Боюсь входить в сделки'],['understanding','Не понимаю, что происходит на рынке'],['strategy','Нет понятной стратегии'],['discipline','Есть стратегия, но нет дисциплины']]},
  {key:'goal',title:'Какой результат для вас главный?',options:[['extra_income','Получать дополнительный доход'],['main_income','Создать основной источник дохода'],['capital_growth','Сохранить и приумножить капитал'],['less_emotions','Снизить влияние эмоций и ошибок'],['automate','Автоматизировать торговый процесс'],['inflation','Защитить деньги от инфляции']]}
];

const allowedAnswers=Object.fromEntries(questions.map(question=>[question.key,new Set(question.options.map(([value])=>value))]));
const defaults={
  version:APP_VERSION,updatedAt:null,screen:'welcome',step:0,answers:{},name:'',nameConfirmed:false,phone:'',consent:false,
  quizCompleted:false,phoneSubmitted:false,calculatorCompleted:false,recommendedProduct:null,profile:null,
  selectedProduct:'signals',pendingAction:null,pendingPayload:null,calc:{capital:5000,months:6}
};

const app=document.getElementById('app');
const bottomNav=document.getElementById('bottomNav');
const menuButton=document.getElementById('menuButton');
const syncStatus=document.getElementById('syncStatus');
const toastElement=document.getElementById('toast');

let state=sanitizeState(readLocalState());
let syncMode=telegramInitData?'connecting':'local';
let syncTimer=null;
let syncRequest=null;
let toastTimer=null;

function readLocalState(){
  for(const key of [LOCAL_KEY,LEGACY_LOCAL_KEY]){
    try{
      const value=localStorage.getItem(key);
      if(value)return JSON.parse(value);
    }catch(error){console.warn('Local state cannot be read',error)}
  }
  return {};
}

function sanitizeState(raw={}){
  const clean={...defaults};
  clean.version=APP_VERSION;
  clean.updatedAt=typeof raw.updatedAt==='string'?raw.updatedAt:null;
  clean.screen=ALLOWED_SCREENS.has(raw.screen)?raw.screen:'welcome';
  clean.step=Math.max(0,Math.min(questions.length-1,Number.isInteger(raw.step)?raw.step:0));
  clean.answers={};
  if(raw.answers&&typeof raw.answers==='object'){
    for(const [key,values] of Object.entries(allowedAnswers)){
      if(values.has(raw.answers[key]))clean.answers[key]=raw.answers[key];
    }
  }
  clean.name=typeof raw.name==='string'?raw.name.trim().slice(0,80):'';
  clean.nameConfirmed=Boolean(raw.nameConfirmed&&clean.name);
  clean.phone=typeof raw.phone==='string'?raw.phone.trim().slice(0,40):'';
  clean.consent=Boolean(raw.consent);
  clean.quizCompleted=Boolean(raw.quizCompleted);
  clean.phoneSubmitted=Boolean(raw.phoneSubmitted&&clean.phone&&clean.consent);
  clean.calculatorCompleted=Boolean(raw.calculatorCompleted);
  clean.recommendedProduct=['signals','cmlab','education'].includes(raw.recommendedProduct)?raw.recommendedProduct:null;
  clean.selectedProduct=['signals','cmlab','education'].includes(raw.selectedProduct)?raw.selectedProduct:'signals';
  clean.profile=raw.profile&&typeof raw.profile==='object'?{
    title:String(raw.profile.title||'').slice(0,160),
    subtitle:String(raw.profile.subtitle||'').slice(0,400)
  }:null;
  clean.pendingAction=PROTECTED_ACTIONS.has(raw.pendingAction)?raw.pendingAction:null;
  clean.pendingPayload=raw.pendingPayload&&typeof raw.pendingPayload==='object'?raw.pendingPayload:null;
  const capital=Number(raw.calc?.capital);
  const months=Number(raw.calc?.months);
  clean.calc={
    capital:Number.isFinite(capital)?Math.max(3000,Math.min(20000,Math.round(capital/500)*500)):5000,
    months:ALLOWED_MONTHS.includes(months)?months:6
  };
  if(clean.screen==='analysis')clean.screen=clean.quizCompleted?'result':'quiz';
  if(clean.screen==='course'&&!clean.phoneSubmitted)clean.screen=clean.nameConfirmed?'materials':'welcome';
  if(!clean.quizCompleted&&!['welcome','quiz'].includes(clean.screen))clean.screen='welcome';
  if(!clean.name&&TELEGRAM_FIRST_NAME)clean.name=TELEGRAM_FIRST_NAME.slice(0,80);
  return clean;
}

function snapshot(){
  const data=sanitizeState(state);
  data.updatedAt=state.updatedAt;
  return data;
}

function saveLocal(){
  try{
    localStorage.setItem(LOCAL_KEY,JSON.stringify(snapshot()));
    if(localStorage.getItem(LEGACY_LOCAL_KEY))localStorage.removeItem(LEGACY_LOCAL_KEY);
  }catch(error){console.warn('Local state cannot be saved',error)}
}

function touch({sync=true}={}){
  state.updatedAt=new Date().toISOString();
  saveLocal();
  if(sync)scheduleSync();
}

function setScreen(screen){
  state.screen=ALLOWED_SCREENS.has(screen)?screen:'welcome';
  touch();
  render();
  window.scrollTo({top:0,behavior:'auto'});
}

function setSyncMode(mode){
  syncMode=mode;
  if(!syncStatus)return;
  const labels={connecting:'Подключаем профиль…',syncing:'Сохраняем…',synced:'Сохранено',local:'Только на устройстве',error:'Ошибка синхронизации'};
  syncStatus.textContent=labels[mode]||'';
  syncStatus.className=`sync-status sync-status--${mode}`;
}

function toast(text,type='info'){
  clearTimeout(toastTimer);
  toastElement.textContent=text;
  toastElement.dataset.type=type;
  toastElement.classList.add('show');
  toastTimer=setTimeout(()=>toastElement.classList.remove('show'),2600);
}

function esc(value){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function money(number){return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(number)+' $'}
function haptic(type='selectionChanged'){try{tg?.HapticFeedback?.[type]?.()}catch(error){}}

async function apiRequest(path,{method='GET',body,keepalive=false}={}){
  if(!telegramInitData)throw new Error('Telegram authorization is unavailable');
  const response=await fetch(`${API_BASE}/${path}`,{
    method,
    headers:{'Content-Type':'application/json','X-Telegram-Init-Data':telegramInitData},
    body:body===undefined?undefined:JSON.stringify(body),
    credentials:'same-origin',
    cache:'no-store',
    keepalive
  });
  let payload={};
  try{payload=await response.json()}catch(error){}
  if(!response.ok)throw new Error(payload.error||`API ${response.status}`);
  return payload;
}

function scheduleSync(){
  if(!telegramInitData||syncMode==='connecting')return;
  clearTimeout(syncTimer);
  setSyncMode('syncing');
  syncTimer=setTimeout(()=>syncProfile(),500);
}

async function syncProfile({keepalive=false}={}){
  if(!telegramInitData)return false;
  clearTimeout(syncTimer);
  if(syncRequest&&!keepalive)return syncRequest;
  setSyncMode('syncing');
  const request=apiRequest('profile.php',{method:'POST',body:{state:snapshot(),client_version:APP_VERSION},keepalive})
    .then(result=>{setSyncMode('synced');return result})
    .catch(error=>{console.error('Profile sync failed',error);setSyncMode('error');return null})
    .finally(()=>{if(syncRequest===request)syncRequest=null});
  if(!keepalive)syncRequest=request;
  return request;
}

async function emitEvent(event,payload={}){
  if(!telegramInitData){console.info('Event (local mode)',event,payload);return false}
  try{
    await apiRequest('event.php',{method:'POST',body:{event,payload,client_version:APP_VERSION}});
    return true;
  }catch(error){
    console.error('Event delivery failed',event,error);
    setSyncMode('error');
    return false;
  }
}

async function loadRemoteProfile(){
  if(!telegramInitData){setSyncMode('local');return}
  setSyncMode('connecting');
  try{
    const result=await apiRequest('profile.php');
    const remote=result.profile?.state?sanitizeState(result.profile.state):null;
    const local=sanitizeState(state);
    if(remote){
      const remoteTime=Date.parse(remote.updatedAt||0)||0;
      const localTime=Date.parse(local.updatedAt||0)||0;
      state=remoteTime>=localTime?remote:local;
    }else{
      state=local;
    }
    if(!state.name&&result.telegram_user?.first_name)state.name=String(result.telegram_user.first_name).slice(0,80);
    saveLocal();
    setSyncMode('synced');
    if(!remote||state===local)await syncProfile();
  }catch(error){
    console.error('Remote profile load failed',error);
    setSyncMode('error');
    toast('Профиль временно работает только на этом устройстве','warning');
  }
}

function diagnose(){
  const answers=state.answers;
  let recommendedProduct='education';
  if(answers.interest==='automation'||answers.goal==='automate'||['emotions','discipline'].includes(answers.main_barrier))recommendedProduct='cmlab';
  else if(answers.interest==='signals'||['unstable','losses'].includes(answers.experience))recommendedProduct='signals';

  let profile={title:'Начинающий инвестор',subtitle:'Вам важно выстроить базу и понять риски до активных действий.'};
  if(['unstable','losses'].includes(answers.experience))profile={title:'Трейдер с опытом, но без системного подхода',subtitle:'Главный резерв роста — дисциплина, повторяемость решений и контроль рисков.'};
  else if(answers.interest==='automation')profile={title:'Инвестор, готовый к системной автоматизации',subtitle:'Вам подходит формат, который снижает влияние эмоций и ручных ошибок.'};
  else if(answers.interest==='signals')profile={title:'Практичный трейдер, ориентированный на готовые решения',subtitle:'Вам важны скорость, структура и понятные рекомендации.'};

  state.recommendedProduct=recommendedProduct;
  state.profile=profile;
  state.quizCompleted=true;
  touch();
}

function nav(){
  const visible=['dashboard','result','calculator','materials','products','productDetail','course'].includes(state.screen);
  bottomNav.classList.toggle('hidden',!visible);
  menuButton.classList.toggle('hidden',!visible);
  bottomNav.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.nav===state.screen));
}

