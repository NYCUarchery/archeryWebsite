const loginDialog=document.querySelector('#login-dialog');
const sampleDialog=document.querySelector('#sample-dialog');
const sampleTitle=document.querySelector('#sample-title');
const sampleCopy=document.querySelector('#sample-copy');
const sampleExtra=document.querySelector('#sample-extra');

function openSample(title,copy){sampleTitle.textContent=title;sampleCopy.textContent=copy;sampleExtra.innerHTML='';sampleDialog.showModal()}
function openLogin(context){document.querySelector('#login-context').textContent=context||'登入後可進入您的比賽工作區。';document.querySelector('#login-message').textContent='';loginDialog.showModal()}

document.querySelectorAll('[data-login-context]').forEach(button=>button.addEventListener('click',()=>openLogin(button.dataset.loginContext)));
document.querySelectorAll('[data-scoreboard]').forEach(button=>button.addEventListener('click',()=>openSample(button.dataset.scoreboard,'此互動僅展示記分板入口；未連至正式賽事頁。')));
document.querySelectorAll('[data-join]').forEach(button=>button.addEventListener('click',()=>{openSample('申請加入比賽','請選擇示意申請身分。此預覽不會送出資料。');sampleExtra.innerHTML='<div class="role-actions"><button class="button-secondary" type="button" data-role="選手">申請為選手</button><button class="button-secondary" type="button" data-role="裁判">申請為裁判</button><button class="button-secondary" type="button" data-role="管理員">申請為管理員</button></div>';sampleExtra.querySelectorAll('[data-role]').forEach(role=>role.addEventListener('click',()=>{sampleCopy.textContent='已收到「'+role.dataset.role+'」申請示意；此預覽不會送出資料。';sampleExtra.innerHTML=''}))}));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.querySelector('#'+button.dataset.close).close()));
document.querySelectorAll('.pagination button[data-page]').forEach(button=>button.addEventListener('click',()=>{const page=button.dataset.page;document.querySelectorAll('.pagination button[data-page]').forEach(item=>item.removeAttribute('aria-current'));button.setAttribute('aria-current','page');document.querySelectorAll('.page-set[data-page]').forEach(set=>set.hidden=set.dataset.page!==page)}));
document.querySelectorAll('[data-preview-state]').forEach(button=>button.addEventListener('click',()=>{const empty=button.dataset.previewState==='empty';document.querySelectorAll('[data-preview-state]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));const filled=document.querySelector('#mine-filled');const emptyState=document.querySelector('#mine-empty');if(filled)filled.hidden=empty;if(emptyState)emptyState.hidden=!empty}));
document.querySelector('#login-form')?.addEventListener('submit',event=>{event.preventDefault();document.querySelector('#login-message').textContent='此為設計預覽，未送出帳號或密碼。'});
document.querySelector('#show-register')?.addEventListener('click',()=>{loginDialog.close();openSample('建立帳號','這裡是註冊入口示意；本稿不會建立帳號。')});
loginDialog?.addEventListener('close',()=>{document.querySelector('#login-form').reset();document.querySelector('#login-message').textContent=''});
sampleDialog?.addEventListener('close',()=>sampleExtra.innerHTML='');
