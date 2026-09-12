/* FAQ accordion — shared by /ayuda and the home page.
   Handles open/close, deep links (e.g. /ayuda#faq-comisiones) and ARIA wiring.
   Loaded before each page's inline script, which calls setFaqAnswerHeight() on language change. */

/* Height of the fixed nav, so an opened answer never scrolls under it. */
function faqScrollOffset(){const nav=document.querySelector('nav');return (nav?nav.offsetHeight:0)+16}

/* An open answer needs an explicit max-height to animate; closing resets to the CSS default. */
function setFaqAnswerHeight(item){const a=item.querySelector('.faq-answer');if(!a)return;a.style.maxHeight=item.classList.contains('open')?(a.scrollHeight+24)+'px':''}

function toggleFaq(btn){
  const item=btn.parentElement;
  const answer=item.querySelector('.faq-answer');
  const opening=!item.classList.contains('open');
  item.classList.toggle('open');
  btn.setAttribute('aria-expanded',opening?'true':'false');
  setFaqAnswerHeight(item);
  if(!opening)return;
  /* Keep the answer on screen: scroll down just enough, but never past the question itself. */
  const offset=faqScrollOffset();
  const r=item.getBoundingClientRect();
  const overflow=(r.bottom+answer.scrollHeight+24)-(window.innerHeight-80);
  const maxUp=r.top-offset;
  if(overflow>0&&maxUp>0){window.scrollBy({top:Math.min(overflow,maxUp),behavior:'smooth'})}
  else if(r.top<offset){window.scrollBy({top:r.top-offset,behavior:'smooth'})}
}

/* Opens the item named in the URL hash, so links like /ayuda#faq-comisiones land open. */
function openFaqFromHash(){
  const hash=location.hash.slice(1);if(!hash)return;
  const item=document.getElementById(hash);
  if(!item||!item.classList.contains('faq-item'))return;
  item.classList.add('open');
  const btn=item.querySelector('.faq-question');
  if(btn)btn.setAttribute('aria-expanded','true');
  setFaqAnswerHeight(item);
  setTimeout(()=>{const offset=faqScrollOffset();window.scrollTo({top:item.getBoundingClientRect().top+window.scrollY-offset,behavior:'smooth'})},400)
}

/* Links each question button to its answer for screen readers. */
function initFaqA11y(){
  document.querySelectorAll('.faq-item').forEach((item,i)=>{
    const btn=item.querySelector('.faq-question');
    const answer=item.querySelector('.faq-answer');
    if(!btn||!answer)return;
    if(!answer.id)answer.id=(item.id||'faq-'+i)+'-answer';
    btn.setAttribute('aria-controls',answer.id);
    btn.setAttribute('aria-expanded',item.classList.contains('open')?'true':'false');
  })
}

window.addEventListener('DOMContentLoaded',()=>{initFaqA11y();openFaqFromHash()});
window.addEventListener('hashchange',openFaqFromHash);
