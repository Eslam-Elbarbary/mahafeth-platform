/*
 * Runs before first paint (port of the inline <head> script in the legacy pages):
 * stored theme, locale persistence, manual scroll restoration, page-transition cover,
 * reset-to-top when there is no hash, and intro gating: on the home page, once per session
 * and never with reduced motion, `html[data-intro="1"]` + `no-scroll` let <IntroOverlay> play.
 */
const bootScript = `(function(){
var d=document.documentElement;
try{var t=localStorage.getItem('mhf-theme');if(t==='light'||t==='dark')d.setAttribute('data-theme',t);}catch(e){}
try{localStorage.setItem('mhf-lang',d.lang);document.cookie='mhf-lang='+d.lang+';path=/;max-age=31536000;samesite=lax';}catch(e){}
if('scrollRestoration' in history){history.scrollRestoration='manual';}
try{if(sessionStorage.getItem('mhf-pt')==='1'){d.classList.add('pt-cover');sessionStorage.removeItem('mhf-pt');d.setAttribute('data-entered','1');}}catch(e){}
if(!location.hash){try{window.scrollTo(0,0);}catch(e){}}
if(/^\\/(ar|en)\\/?$/.test(location.pathname)){
var rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
var seen=false;try{seen=sessionStorage.getItem('mhf-seen')==='1';}catch(e){}
if(!seen&&!rm&&!d.hasAttribute('data-entered')){d.classList.add('no-scroll');d.setAttribute('data-intro','1');}
}
})();`;

export function BootScript() {
  return <script dangerouslySetInnerHTML={{ __html: bootScript }} />;
}
