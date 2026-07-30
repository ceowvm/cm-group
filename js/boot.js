(function(){
  'use strict';
  window.setTimeout(function(){
    var app=document.getElementById('app');
    if(!app)return;
    var loading=app.querySelector('.loading-card');
    if(!loading&&app.children.length>0)return;
    app.innerHTML='<section class="screen"><div class="card center"><h2>Не удалось загрузить кабинет</h2><p class="muted">Закройте мини-приложение и откройте его повторно из Telegram-бота. Если экран не загрузится, проверьте интернет-соединение.</p><button class="btn btn-primary mt-16" type="button" onclick="location.reload()">Загрузить ещё раз</button></div></section>';
  },10000);
})();
