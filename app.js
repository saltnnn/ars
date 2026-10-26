/* дело. — standalone GitHub Pages marketplace (browser-local demo).
 * No server, no accounts, no real payment. Do NOT treat client-side auth as security.
 * The administrator password is not stored in this repository in plaintext.
 */
'use strict';

const CATEGORIES = ['Все', 'Дизайн', 'Разработка', 'Маркетинг', 'Фото и видео', 'Тексты', 'Образование', 'Другое'];
const STORAGE = Object.freeze({ services: 'delo.services.v1', hidden: 'delo.hidden.v1', favorites: 'delo.favorites.v1', admin: 'delo.admin.session.v1' });
const AUTH = Object.freeze({
  // PBKDF2-SHA256 verifier (salt & verifier are public). This is UI-only protection.
  saltHex: '2141636cf43138512d007337642370588746',
  iterations: 210000,
  verifierHex: '0849917d164910608c4529cdeeec487d8d73e31f449813b404ed6705b48ff15b'
});

// These are EXAMPLES, not actual offers. Their contacts deliberately use example.com.
const DEMO_SERVICES = [
  { id:'demo-design', title:'Айдентика, которую заметят', author:'Алина · graphic designer', category:'Дизайн', price:45000, location:'Алматы / онлайн', description:'Разработаю визуальный стиль для твоего бренда: от идеи и мудборда до логотипа, палитры, типографики и понятного мини-гайда. Работаем поэтапно, чтобы результат отражал характер проекта.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/design.svg', createdAt:1792270000000, demo:true },
  { id:'demo-dev', title:'Лендинг с характером под ключ', author:'Марк · web developer', category:'Разработка', price:90000, location:'Астана / удалённо', description:'Сделаю быстрый адаптивный лендинг с продуманной структурой, красивыми анимациями и удобной формой заявки. Уделяю внимание деталям, мобильной версии и скорости загрузки.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/development.svg', createdAt:1792190000000, demo:true },
  { id:'demo-photo', title:'Предметная и lifestyle-съёмка', author:'Диана · photographer', category:'Фото и видео', price:35000, location:'Алматы', description:'Создам атмосферные фотографии для брендов, каталога и социальных сетей. Помогу с референсами, подбором композиции и обработкой.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/photo.svg', createdAt:1792110000000, demo:true },
  { id:'demo-marketing', title:'SMM-стратегия без воды', author:'Тимур · digital strategist', category:'Маркетинг', price:55000, location:'Онлайн', description:'Проанализирую аудиторию и конкурентов, соберу позиционирование, рубрики и контент-план. Вместе превратим хаотичные публикации в понятную систему.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/marketing.svg', createdAt:1792030000000, demo:true },
  { id:'demo-copy', title:'Тексты, в которых есть смысл', author:'София · copywriter', category:'Тексты', price:15000, location:'Весь мир / онлайн', description:'Напишу тексты для лендинга, рассылки, презентации или соцсетей. Найду голос бренда, уберу лишнее и сохраню самое важное.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/copy.svg', createdAt:1791950000000, demo:true },
  { id:'demo-education', title:'Английский без скучных правил', author:'Анастасия · tutor', category:'Образование', price:7000, location:'Онлайн', description:'Индивидуальные разговорные занятия с упором на живую речь. Подберу программу под твой уровень и цель: путешествия, работа или уверенное общение.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/education.svg', createdAt:1791870000000, demo:true },
  { id:'demo-video', title:'Монтаж Reels и коротких видео', author:'Данияр · video editor', category:'Фото и видео', price:12000, location:'Удалённо', description:'Смонтирую динамичные короткие видео с ритмом, титрами, музыкой и аккуратной цветокоррекцией. Помогу упаковать идею в формат, который хочется досмотреть.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/video.svg', createdAt:1791790000000, demo:true },
  { id:'demo-consulting', title:'Разбор идеи и план запуска', author:'Полина · product mentor', category:'Другое', price:null, location:'Онлайн', description:'Помогу разобраться в идее продукта, выделить ценность, определить первые шаги и собрать реалистичный план запуска. От стратегии к конкретным действиям.\n\nЭто демонстрационная карточка.', email:'demo@example.com', telegram:'', whatsapp:'', image:'assets/consulting.svg', createdAt:1791710000000, demo:true }
];

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const byId = id => document.getElementById(id);
function el(tag, className='', value) { const n=document.createElement(tag); if(className) n.className=className; if(value !== undefined) n.textContent=value; return n; }
function icon(name) { const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('class','icon'); s.setAttribute('aria-hidden','true'); const use=document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href',`#i-${name}`); s.append(use); return s; }
function buttonWithIcon(label, name, cls='') { const b=el('button',cls); b.type='button'; b.append(document.createTextNode(label),icon(name)); return b; }
function safeRead(key, fallback) { try { const value=JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
function safeWrite(key, value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
function safeSessionGet(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
function safeSessionSet(key,value) { try { sessionStorage.setItem(key,value); } catch {} }
function safeSessionRemove(key) { try { sessionStorage.removeItem(key); } catch {} }
function validImage(src) { return typeof src === 'string' && ( /^assets\/[a-z0-9-]+\.svg$/.test(src) || (/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(src) && src.length < 800000) ); }
function validEmail(value) { return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length < 121; }
function telegramHandle(value) { if (!value) return ''; const trimmed=value.trim().replace(/^https?:\/\/(?:www\.)?t\.me\//i,'').replace(/^@/,''); return /^[A-Za-z0-9_]{5,32}$/.test(trimmed) ? trimmed : null; }
function whatsAppNumber(value) { if (!value) return ''; let digits=value.replace(/[^0-9]/g,''); if (/^8\d{10}$/.test(digits)) digits='7'+digits.slice(1); return /^\d{11,15}$/.test(digits) ? digits : null; }
function sanitizeService(obj) {
  if(!obj || typeof obj !== 'object' || typeof obj.id !== 'string' || !/^custom-[a-zA-Z0-9-]{5,100}$/.test(obj.id)) return null;
  const title=String(obj.title??'').trim().slice(0,90), author=String(obj.author??'').trim().slice(0,55), description=String(obj.description??'').trim().slice(0,1500);
  const category=CATEGORIES.includes(obj.category) && obj.category!=='Все' ? obj.category : 'Другое';
  const telegram=telegramHandle(String(obj.telegram??'')), whatsapp=whatsAppNumber(String(obj.whatsapp??'')), email=String(obj.email??'').trim();
  const price=(obj.price===null || obj.price==='' || obj.price===undefined)? null : Number(obj.price);
  if(!title || !author || description.length<20 || !validImage(obj.image) || telegram===null || whatsapp===null || (email && !validEmail(email)) || (!telegram && !whatsapp && !email) || (price!==null && (!Number.isSafeInteger(price) || price<0 || price>999999999))) return null;
  return {id:obj.id,title,author,description,category,price,location:String(obj.location??'').trim().slice(0,65),telegram,whatsapp,email,image:obj.image,createdAt:Number.isFinite(Number(obj.createdAt))?Number(obj.createdAt):Date.now(),demo:false};
}
const saved=safeRead(STORAGE.services,[]);
const customServices=Array.isArray(saved)?saved.slice(0,200).map(sanitizeService).filter(Boolean):[];
const hiddenSet=new Set((Array.isArray(safeRead(STORAGE.hidden,[]))?safeRead(STORAGE.hidden,[]):[]).filter(id=>DEMO_SERVICES.some(s=>s.id===id)));
const favorites=new Set(Array.isArray(safeRead(STORAGE.favorites,[]))?safeRead(STORAGE.favorites,[]).filter(id=>typeof id==='string'):[]);
const state={customServices, hiddenSet, favorites, category:'Все', query:'', sort:'newest', onlyFavorites:false, pendingImage:'', adminAuthenticated:safeSessionGet(STORAGE.admin)==='1'};
let toastTimer;

function allServices() { return [...state.customServices,...DEMO_SERVICES.filter(s=>!state.hiddenSet.has(s.id))]; }
function formatPrice(price) { return price===null?'По договорённости':price===0?'Бесплатно':`от ${new Intl.NumberFormat('ru-RU').format(price)} ₸`; }
function declension(n) { const a=n%10,b=n%100; return a===1&&b!==11?'услуга':a>=2&&a<=4&&(b<12||b>14)?'услуги':'услуг'; }
function showToast(message, isError=false) { const t=el('div',`toast${isError?' error':''}`,message); byId('toastContainer').append(t); setTimeout(()=>t.remove(),3800); }
function persistServices() { return safeWrite(STORAGE.services,state.customServices); }
function persistHidden() { safeWrite(STORAGE.hidden,[...state.hiddenSet]); }
function persistFavorites() { safeWrite(STORAGE.favorites,[...state.favorites]); }
function updateFavoritesCounter() { const count=state.favorites.size; byId('favoriteCount').textContent=String(count); byId('favoriteCount').hidden=!count; }

function renderCategories() {
 const host=byId('categoryFilters'); host.replaceChildren();
 CATEGORIES.forEach(category=>{const b=el('button',`category-pill ${state.category===category?'active':''}`.trim(),category); b.type='button'; b.setAttribute('aria-pressed',String(state.category===category)); b.addEventListener('click',()=>{state.category=category;renderCategories();renderServices()});host.append(b)});
}
function filteredServices() {
 const query=state.query.toLocaleLowerCase('ru').trim();
 const filtered=allServices().filter(s=>(state.category==='Все'||s.category===state.category) && (!state.onlyFavorites||state.favorites.has(s.id)) && (!query||[s.title,s.author,s.category,s.description,s.location].some(v=>String(v).toLocaleLowerCase('ru').includes(query))));
 filtered.sort((a,b)=>{
  if(state.sort==='price-low')return (a.price??Number.MAX_SAFE_INTEGER)-(b.price??Number.MAX_SAFE_INTEGER);
  if(state.sort==='price-high')return (b.price??-1)-(a.price??-1);
  if(state.sort==='title')return a.title.localeCompare(b.title,'ru');
  return b.createdAt-a.createdAt;
 });return filtered;
}
function renderServices() {
 const services=filteredServices();const grid=byId('servicesGrid');grid.replaceChildren();
 services.forEach((s,index)=>{const card=el('article','service-card');card.style.animationDelay=`${Math.min(index,9)*30}ms`;
  const media=el('div','card-media');media.setAttribute('role','button');media.setAttribute('tabindex','0');media.setAttribute('aria-label',`Открыть услугу ${s.title}`);
  media.addEventListener('click',()=>openDetails(s.id));media.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetails(s.id)}});
  const photo=el('img');photo.src=s.image;photo.alt=`Обложка: ${s.title}`;photo.loading='lazy';photo.addEventListener('error',()=>{if(photo.getAttribute('src')!=='assets/design.svg')photo.src='assets/design.svg'});
  media.append(photo,el('span','card-category',s.category));
  const fav=el('button',`card-favorite ${state.favorites.has(s.id)?'is-favorite':''}`.trim());fav.type='button';fav.setAttribute('aria-label',state.favorites.has(s.id)?'Убрать из избранного':'Добавить в избранное');fav.setAttribute('aria-pressed',String(state.favorites.has(s.id)));fav.append(icon('heart'));fav.addEventListener('click',event=>{event.stopPropagation();toggleFavorite(s.id)});media.append(fav);
  if(s.demo)media.append(el('span','demo-ribbon','ПРИМЕР'));
  const body=el('div','card-body');const top=el('div','card-top');top.append(el('span','card-author',s.author),el('strong','card-price',formatPrice(s.price)));
  const title=el('h3','card-title',s.title);title.setAttribute('tabindex','0');title.setAttribute('role','button');title.addEventListener('click',()=>openDetails(s.id));title.addEventListener('keydown',e=>{if(e.key==='Enter'){openDetails(s.id)}});
  const location=el('div','card-meta');location.append(icon('map-pin'),document.createTextNode(s.location||'Онлайн / по договорённости'));
  body.append(top,title,location);card.append(media,body);grid.append(card);
 });
 byId('resultsCount').textContent=`${services.length} ${declension(services.length)}`;
 byId('emptyState').hidden=services.length!==0;byId('servicesGrid').hidden=services.length===0;
 byId('favoritesToggle').classList.toggle('active',state.onlyFavorites);byId('favoritesToggle').setAttribute('aria-pressed',String(state.onlyFavorites));updateFavoritesCounter();
}
function toggleFavorite(id) {if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);persistFavorites();renderServices();}
function openDialog(dialog) { if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');document.body.classList.add('dialog-open'); }
function closeDialog(dialog) {if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');document.body.classList.remove('dialog-open');}
function createContactButton(type,label,value,url) {
 const container=el('a','contact-link');container.href=url;container.target=type==='email'?'_self':'_blank';if(container.target==='_blank')container.rel='noopener noreferrer';container.append(document.createTextNode(label),icon('arrow-up-right'));return container;
}
function createCopyButton(label,value) { const b=buttonWithIcon(label,'copy','copy-contact');b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);showToast('Контакт скопирован')}catch{showToast('Не удалось скопировать. Выдели контакт вручную.',true)}});return b; }
function openDetails(id) {
 const service=allServices().find(s=>s.id===id);if(!service)return;
 const host=byId('detailContent');host.replaceChildren();const cover=el('div','detail-cover');const image=el('img');image.src=service.image;image.alt=`Обложка: ${service.title}`;cover.append(image);if(service.demo)cover.append(el('span','demo-ribbon','ДЕМОНСТРАЦИЯ'));
 const inner=el('div','detail-inner');const top=el('div','detail-top-meta');top.append(el('span','detail-category',service.category));const location=el('span','detail-location');location.append(icon('map-pin'),document.createTextNode(service.location||'Онлайн'));top.append(location);
 const title=el('h2','',service.title);title.id='detailTitle';const meta=el('div','detail-meta');meta.append(el('span','detail-author',`Исполнитель: ${service.author}`),el('strong','detail-price',formatPrice(service.price)));
 inner.append(top,title,meta,el('h3','detail-description-title','Об услуге'),el('p','detail-description',service.description));
 if(service.demo)inner.append(el('div','detail-demo-note','Это пример оформления. Контакт demo@example.com не принадлежит реальному исполнителю. Опубликуй своё объявление, чтобы проверить работу с настоящими контактами.'));
 const box=el('div','detail-contact-box');box.append(el('h3','','Понравилась услуга?'),el('p','','Свяжись с исполнителем и обсуди заказ напрямую. Оплата на сайте не проводится.'));
 const links=el('div','contact-actions');const copies=el('div','detail-copy');
 if(service.telegram){links.append(createContactButton('telegram','Написать в Telegram',service.telegram,`https://t.me/${service.telegram}`));copies.append(createCopyButton(`@${service.telegram}`,`@${service.telegram}`));}
 if(service.whatsapp){links.append(createContactButton('whatsapp','Написать в WhatsApp',service.whatsapp,`https://wa.me/${service.whatsapp}`));copies.append(createCopyButton(`+${service.whatsapp}`,`+${service.whatsapp}`));}
 if(service.email){links.append(createContactButton('email','Написать на e-mail',service.email,`mailto:${service.email}?subject=${encodeURIComponent('Заявка по услуге: '+service.title)}`));copies.append(createCopyButton(service.email,service.email));}
 box.append(links,copies);inner.append(box);host.append(cover,inner);openDialog(byId('detailDialog'));
}
function resetPublishForm(){byId('publishForm').reset();state.pendingImage='';byId('uploadPreview').hidden=true;byId('uploadPreview').removeAttribute('src');byId('dropzoneContent').hidden=false;byId('changeImage').hidden=true;byId('publishError').hidden=true;}
function setPublishError(message) {const error=byId('publishError');error.textContent=message;error.hidden=false;error.scrollIntoView({behavior:'smooth',block:'nearest'});}
function setImage(src){state.pendingImage=src;byId('uploadPreview').src=src;byId('uploadPreview').hidden=false;byId('dropzoneContent').hidden=true;byId('changeImage').hidden=false;byId('publishError').hidden=true;}
async function imageToCompressedDataUrl(file) {
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Нужен JPG, PNG или WebP.');
 if(file.size>8*1024*1024)throw Error('Изображение не должно быть больше 8 МБ.');
 let image;try{image=await createImageBitmap(file)}catch{throw Error('Не удалось открыть изображение. Попробуй другой файл.');}
 const scale=Math.min(1,1250/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close?.();
 let data='';for(const quality of [.83,.70,.56,.43]){data=canvas.toDataURL('image/jpeg',quality);if(data.length<650000)break;}
 if(data.length>=800000)throw Error('Фото слишком большое даже после сжатия. Выбери другое изображение.');return data;
}
async function handlePhoto(file) {if(!file)return;try{const data=await imageToCompressedDataUrl(file);setImage(data);showToast('Обложка добавлена')}catch(error){setPublishError(error.message)}}
function saveNewService(event) {
 event.preventDefault();const form=byId('publishForm');if(!form.reportValidity())return;
 if(!state.pendingImage){setPublishError('Добавь обложку услуги.');return;}
 const data=new FormData(form);const title=String(data.get('title')??'').trim();const description=String(data.get('description')??'').trim();const telegram=telegramHandle(String(data.get('telegram')??''));const whatsapp=whatsAppNumber(String(data.get('whatsapp')??''));const email=String(data.get('email')??'').trim();
 if(telegram===null){setPublishError('Укажи корректный Telegram: @username или t.me/username.');return;}
 if(whatsapp===null){setPublishError('Для WhatsApp укажи номер с кодом страны, например +7 700 000 00 00.');return;}
 if(!telegram&&!whatsapp&&!email){setPublishError('Нужен хотя бы один контакт: Telegram, WhatsApp или e-mail.');return;}
 if(email&&!validEmail(email)){setPublishError('Проверь адрес электронной почты.');return;}
 const rawPrice=String(data.get('price')??'').trim();const price=rawPrice===''?null:Number(rawPrice);
 const service=sanitizeService({id:`custom-${crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)}`,title,author:String(data.get('author')??''),category:String(data.get('category')??'Другое'),price,location:String(data.get('location')??''),description,telegram,whatsapp,email,image:state.pendingImage,createdAt:Date.now()});
 if(!service){setPublishError('Проверь заполненные поля и попробуй ещё раз.');return;}
 state.customServices.unshift(service);if(!persistServices()){state.customServices.shift();setPublishError('В браузере закончилось место. Попробуй уменьшить изображение или экспортировать и удалить старые объявления.');return;}
 resetPublishForm();closeDialog(byId('publishDialog'));state.query='';state.category='Все';state.onlyFavorites=false;state.sort='newest';byId('searchInput').value='';byId('sortSelect').value='newest';renderCategories();renderServices();document.getElementById('catalog').scrollIntoView({behavior:'smooth'});showToast('Услуга опубликована в этом браузере ✳');
}

function hexToBytes(hex) {const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);return out;}
async function checkAdminPassword(password) {
 if(!globalThis.crypto?.subtle)throw Error('Проверка доступна по HTTPS или через локальный сервер.');
 const encoder=new TextEncoder();const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const result=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:hexToBytes(AUTH.saltHex),iterations:AUTH.iterations,hash:'SHA-256'},key,256));const expected=hexToBytes(AUTH.verifierHex);
 let diff=0;for(let i=0;i<result.length;i++)diff|=result[i]^expected[i];return diff===0;
}
async function loginAdmin(event) {
 event.preventDefault();const input=byId('adminPassword');const error=byId('adminLoginError');const b=byId('adminLoginButton');b.disabled=true;b.textContent='Проверяем…';error.hidden=true;
 try{if(!await checkAdminPassword(input.value)){error.textContent='Неверный пароль.';error.hidden=false;return;}state.adminAuthenticated=true;safeSessionSet(STORAGE.admin,'1');input.value='';renderAdmin();showToast('Панель открыта');}
 catch(e){error.textContent=e.message||'Не удалось проверить пароль.';error.hidden=false}
 finally{b.disabled=false;b.replaceChildren(document.createTextNode('Войти '),icon('arrow-right'));}
}
function renderAdmin() {
 byId('adminLoginView').hidden=state.adminAuthenticated;byId('adminDashboard').hidden=!state.adminAuthenticated;if(!state.adminAuthenticated)return;
 const services=allServices();byId('adminTotalCount').textContent=String(services.length);byId('adminCustomCount').textContent=String(state.customServices.length);byId('adminHiddenCount').textContent=String(state.hiddenSet.size);
 const host=byId('adminList');host.replaceChildren();if(!services.length)host.append(el('p','admin-empty','Объявлений больше нет.'));
 services.forEach(s=>{const item=el('div','admin-item');const img=el('img');img.src=s.image;img.alt='';const mid=el('div','admin-item-main');mid.append(el('strong','',s.title),el('small','',`${s.category} · ${s.demo?'демо':'локальное объявление'}`));const del=buttonWithIcon('Удалить','trash','delete-button');del.setAttribute('aria-label',`Удалить: ${s.title}`);
 del.addEventListener('click',()=>{if(!confirm(`Удалить «${s.title}» из этого браузера?`))return;
  if(s.demo){state.hiddenSet.add(s.id);persistHidden();}else{const previous=[...state.customServices];state.customServices=state.customServices.filter(v=>v.id!==s.id);if(!persistServices()){state.customServices=previous;showToast('Не удалось сохранить изменения',true);return;}}
  state.favorites.delete(s.id);persistFavorites();renderServices();renderAdmin();showToast('Объявление удалено в этом браузере');});item.append(img,mid,del);host.append(item)});
 byId('restoreExamples').hidden=state.hiddenSet.size===0;
}
function exportData() {
 const output={version:1,exportedAt:new Date().toISOString(),services:state.customServices,hiddenExampleIds:[...state.hiddenSet]};const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=el('a');link.href=url;link.download=`delo-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);showToast('Резервная копия скачана');
}
async function importData(event) {
 const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>5*1024*1024){showToast('Файл слишком большой (максимум 5 МБ)',true);return;}
 try{const parsed=JSON.parse(await file.text());if(parsed.version!==1||!Array.isArray(parsed.services))throw Error('Неподходящий формат JSON');
  if(parsed.services.length>150)throw Error('Не больше 150 услуг за один импорт');
  const candidates=parsed.services.map(sanitizeService);if(candidates.some(s=>!s))throw Error('Некоторые объявления повреждены или некорректны');
  const existingIds=new Set(state.customServices.map(s=>s.id));const unique=candidates.filter(s=>!existingIds.has(s.id));const previous=state.customServices;state.customServices=[...unique,...previous];
  if(!persistServices()){state.customServices=previous;throw Error('Недостаточно места в браузере для импорта');}
  if(Array.isArray(parsed.hiddenExampleIds)){state.hiddenSet=new Set(parsed.hiddenExampleIds.filter(id=>DEMO_SERVICES.some(s=>s.id===id)));persistHidden();}
  renderServices();renderAdmin();showToast(`Импортировано: ${unique.length} объявлений`);
 }catch(error){showToast(`Ошибка импорта: ${error.message}`,true)}
}
function init() {
 const publishCategories=byId('publishCategory');CATEGORIES.filter(c=>c!=='Все').forEach(c=>{const opt=el('option','',c);opt.value=c;publishCategories.append(opt)});
 renderCategories();renderServices();
 byId('searchInput').addEventListener('input',event=>{state.query=event.target.value;renderServices()});
 byId('sortSelect').addEventListener('change',event=>{state.sort=event.target.value;renderServices()});
 byId('favoritesToggle').addEventListener('click',()=>{state.onlyFavorites=!state.onlyFavorites;renderServices()});
 byId('favoriteShortcut').addEventListener('click',()=>{state.onlyFavorites=true;renderServices();byId('catalog').scrollIntoView({behavior:'smooth'})});
 byId('resetFilters').addEventListener('click',()=>{state.category='Все';state.query='';state.onlyFavorites=false;byId('searchInput').value='';renderCategories();renderServices()});
 $$('[data-open-publish]').forEach(b=>b.addEventListener('click',()=>openDialog(byId('publishDialog'))));
 $$('.close-modal').forEach(b=>b.addEventListener('click',()=>closeDialog(b.closest('dialog'))));
 $$('dialog').forEach(dialog=>{dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog)});dialog.addEventListener('close',()=>{if(!$$('dialog[open]').length)document.body.classList.remove('dialog-open')})});
 byId('publishForm').addEventListener('submit',saveNewService);
 byId('imageFile').addEventListener('change',event=>handlePhoto(event.target.files?.[0]));
 const zone=byId('imageDropzone');zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('is-dragging')});zone.addEventListener('dragleave',()=>zone.classList.remove('is-dragging'));zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('is-dragging');handlePhoto(event.dataTransfer?.files?.[0])});
 byId('adminEntry').addEventListener('click',()=>{renderAdmin();openDialog(byId('adminDialog'))});
 byId('adminLoginForm').addEventListener('submit',loginAdmin);
 byId('adminLogout').addEventListener('click',()=>{state.adminAuthenticated=false;safeSessionRemove(STORAGE.admin);renderAdmin();showToast('Вы вышли из панели')});
 byId('exportButton').addEventListener('click',exportData);byId('importFile').addEventListener('change',importData);
 byId('restoreExamples').addEventListener('click',()=>{state.hiddenSet.clear();persistHidden();renderAdmin();renderServices();showToast('Примеры восстановлены')});
}
init();
