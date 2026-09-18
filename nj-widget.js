/* ══════════════════════════════════════════════════════════════
   누제믹 챗봇 런처

   메인 페이지에 이 한 줄만 넣으면 오른쪽 아래에 모루믹이 나타납니다.

     <script src="nj-widget.js" defer
             data-store="main"      main | yeonbang  (주소의 ?store= 가 우선)
             data-mode="overlay"    overlay 배경없이 위에 | panel 흰 판 | page 페이지이동
             data-chat="chat.html"
             data-custom="custom.html"

   메인 페이지에 이 파일을 통째로 붙여 넣을 때는
   앞에 window.NJ_WIDGET = { store:'main', mode:'panel' } 로 설정합니다.

   챗봇은 눌렀을 때 처음 만들어집니다.
   메인 페이지 로딩에는 이 파일(몇 KB)만 얹힙니다.
   ══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__njWidget) return;
  window.__njWidget = true;

  var me  = document.currentScript
          || (function(){ var s=document.getElementsByTagName('script'); return s[s.length-1]; })();
  var cfg = window.NJ_WIDGET || {};
  function opt(k, d){
    if (cfg[k]) return cfg[k];
    var v = me && me.getAttribute && me.getAttribute('data-' + k.toLowerCase());
    return v || d;
  }
  var CHAT   = opt('chat',   'chat.html');
  var CUSTOM = opt('custom', 'custom.html');
  var MODE  = opt('mode',  'overlay');   // overlay 배경없이 위에 | panel 흰 판 | page 페이지이동
  var LANG  = opt('lang',  '');
  var LABEL = opt('label', '무엇이든 물어보세요');
  /* 상품 상세 페이지처럼 이미 자체 챗봇 버튼(FAB)이 있는 화면에서는
     data-button="0" 또는 NJ_WIDGET={button:'0'} 로 이 위젯의 버튼 생성을 꺼둡니다.
     이때도 window.njChat.open()/close() 와 패널 동작은 그대로 씁니다. */
  var SHOW_BTN = opt('button', '1') !== '0';
  /* 상품 페이지 FAB과 같은 사진 아이콘을 쓰려면 data-icon 또는 NJ_WIDGET.icon 에
     data: URL을 넣습니다. 없으면 기본 벡터 인형을 씁니다. */
  var ICON = opt('icon', '');

  /* 매장은 메인 페이지 주소에서 먼저 찾습니다 (QR 이 ?store= 를 달고 들어옵니다) */
  var urlStore = new URLSearchParams(location.search).get('store');
  var STORE = (urlStore === 'main' || urlStore === 'yeonbang')
            ? urlStore : opt('store', 'main');

  var PINK = '#F56598', INK = '#141414';

  var css = ''
  + '.njw-btn{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;'
  +   'width:62px;height:62px;border-radius:50%;border:none;padding:0;cursor:pointer;'
  +   'background:#fff;box-shadow:0 4px 10px rgba(20,30,45,.10),0 12px 30px rgba(20,30,45,.16);'
  +   'display:flex;align-items:center;justify-content:center;'
  +   'transition:transform .18s cubic-bezier(.2,.9,.3,1.3);'
  +   'animation:njwFloat 3.6s ease-in-out infinite}'
  + '.njw-btn:hover{transform:translateY(-3px)}'
  + '.njw-btn:active{transform:scale(.9)}'
  + '.njw-btn:focus-visible{outline:3px solid '+PINK+';outline-offset:3px}'
  + '.njw-btn svg{width:44px;height:44px;display:block;pointer-events:none}'
  + '@keyframes njwFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
  + '.njw-dot{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;'
  +   'background:'+PINK+';border:2.5px solid #fff}'

  + '.njw-tip{position:fixed;right:88px;bottom:calc(34px + env(safe-area-inset-bottom));z-index:2147482999;'
  +   'background:#fff;color:'+INK+';font-size:13px;line-height:1.4;font-weight:500;'
  +   'padding:9px 14px;border-radius:999px;white-space:nowrap;'
  +   'box-shadow:0 3px 8px rgba(20,30,45,.10),0 10px 24px rgba(20,30,45,.13);'
  +   'opacity:0;transform:translateX(8px);transition:opacity .3s,transform .3s;pointer-events:none}'
  + '.njw-tip.on{opacity:1;transform:none}'

  + '.njw-dim{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483100;'
  +   'background:rgba(20,20,20,.34);opacity:0;visibility:hidden;'
  +   'transition:opacity .3s,visibility .3s}'
  + '.njw-dim.on{opacity:1;visibility:visible}'
  + '.njw-dim.soft{background:rgba(20,20,20,.2)}'

  /* 챗봇 패널 — 오른쪽 아래. 화면을 다 덮지 않습니다. */
  + '.njw-panel{position:fixed;z-index:2147483200;overflow:hidden;'
  +   'right:20px;bottom:20px;width:400px;height:min(660px,calc(100dvh - 40px));'
  +   'border-radius:24px;'
  +   'transform:translateY(14px) scale(.975);opacity:0;'
  +   'transition:transform .32s cubic-bezier(.2,.9,.3,1.05),opacity .24s}'
  + '.njw-panel.on{transform:none;opacity:1}'
  + '.njw-panel iframe{width:100%;height:100%;border:0;display:block;background:transparent}'
  /* 어두운 유리 — 뒤 페이지를 패널 자리에서만 흐리게 합니다 */
  + '.njw-panel.glass{background:rgba(20,20,24,.55);'
  +   '-webkit-backdrop-filter:blur(24px) saturate(.7) brightness(.7);'
  +   'backdrop-filter:blur(24px) saturate(.7) brightness(.7);'
  +   'box-shadow:0 10px 24px rgba(0,0,0,.28),0 30px 70px rgba(0,0,0,.34)}'
  /* 흰 판 */
  + '.njw-panel.panel{background:#F6F5F2;'
  +   'box-shadow:0 8px 20px rgba(20,30,45,.14),0 26px 60px rgba(20,30,45,.24)}'
  + '@media(max-width:560px){.njw-panel{right:0;left:0;bottom:0;width:auto;'
  +   'height:86dvh;border-radius:22px 22px 0 0}}'

  + '@media(prefers-reduced-motion:reduce){.njw-btn{animation:none}'
  +   '.njw-panel,.njw-tip,.njw-dim{transition:none}}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* 런처 인형 — 사진 대신 가벼운 벡터를 씁니다 */
  function doll(){
    var pts=[], n=13, r=19, cx=24, cy=25;
    for(var i=0;i<n*2;i++){
      var a=i*Math.PI/n, rr=(i%2===0)?r:r*0.79;
      pts.push((cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1));
    }
    return '<svg viewBox="0 0 48 48" aria-hidden="true">'
      + '<circle cx="24" cy="7.5" r="5.2" fill="none" stroke="#2FA79F" stroke-width="2.4"/>'
      + '<polygon fill="#F0E4CE" points="'+pts.join(' ')+'"/>'
      + '<ellipse cx="19" cy="23.5" rx="2.5" ry="2.9" fill="#141414"/>'
      + '<ellipse cx="29" cy="23.5" rx="2.5" ry="2.9" fill="#141414"/>'
      + '<circle cx="19.9" cy="22.4" r="1" fill="#fff"/><circle cx="29.9" cy="22.4" r="1" fill="#fff"/>'
      + '<ellipse cx="14.5" cy="29" rx="3.1" ry="2" fill="#FF7EA8" opacity=".5"/>'
      + '<ellipse cx="33.5" cy="29" rx="3.1" ry="2" fill="#FF7EA8" opacity=".5"/>'
      + '<path d="M21.4 29.4 Q24 32 26.6 29.4" fill="none" stroke="#6B4A33"'
      +   ' stroke-width="1.5" stroke-linecap="round" opacity=".8"/></svg>';
  }

  var btn = null, tip = null;
  if (SHOW_BTN){
    btn = document.createElement('button');
    btn.className = 'njw-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', LABEL);
    var face = ICON
      ? '<img src="'+ICON+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">'
      : doll();
    btn.innerHTML = face + '<span class="njw-dot"></span>';
    document.body.appendChild(btn);

    tip = document.createElement('div');
    tip.className = 'njw-tip';
    tip.textContent = LABEL;
    document.body.appendChild(tip);
    setTimeout(function(){ tip.classList.add('on'); }, 1200);
    setTimeout(function(){ tip.classList.remove('on'); }, 6000);
  }

  function chatURL(){
    var u = CHAT + (CHAT.indexOf('?') < 0 ? '?' : '&') + 'store=' + encodeURIComponent(STORE);
    if (LANG) u += '&lang=' + encodeURIComponent(LANG);
    u += '&ui=' + (MODE === 'panel' ? 'panel' : 'overlay');
    u += '&custom=' + encodeURIComponent(CUSTOM);
    return u;
  }

  var panel = null, dim = null, open = false;

  function openChat(){
    if (MODE === 'page'){ location.href = chatURL(); return; }
    if (open) return;
    open = true;
    if (tip) tip.classList.remove('on');
    if (btn) btn.style.display = 'none';

    if (!panel){
      dim = document.createElement('div');
      dim.className = 'njw-dim' + (MODE === 'panel' ? '' : ' soft');
      dim.addEventListener('click', closeChat);
      document.body.appendChild(dim);

      panel = document.createElement('div');
      panel.className = 'njw-panel ' + (MODE === 'panel' ? 'panel' : 'glass');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', '누제믹 안내');
      var f = document.createElement('iframe');
      f.src = chatURL();
      f.title = '누제믹 안내';
      f.setAttribute('allow', 'clipboard-write');
      panel.appendChild(f);
      document.body.appendChild(panel);
    }
    requestAnimationFrame(function(){
      dim.classList.add('on');
      panel.classList.add('on');
    });
  }

  function closeChat(){
    if (!open) return;
    open = false;
    panel.classList.remove('on');
    dim.classList.remove('on');
    if (btn) btn.style.display = '';
  }

  if (btn) btn.addEventListener('click', openChat);

  /* 챗봇 안에서 오는 신호 */
  window.addEventListener('message', function(e){
    if (!e.data) return;
    if (e.data.type === 'nj:close') closeChat();
    /* "커스텀 만들러 가기" — 챗봇을 닫고 커스텀 화면으로 이동합니다 */
    if (e.data.type === 'nj:custom'){
      closeChat();
      location.href = e.data.url || CUSTOM;
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeChat();
  });

  window.njChat = { open: openChat, close: closeChat };
})();
