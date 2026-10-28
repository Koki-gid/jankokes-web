const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(stored) {
 const listeners={}, buttons=['denied','granted'].map(choice=>({dataset:{choice},addEventListener(_,fn){this.click=fn},focus(){}}));
 const scripts=[],cookies=[];
 const panel={setAttribute(){},querySelectorAll(){return buttons},querySelector(){return buttons[0]}};
 const settings={addEventListener(_,fn){this.click=fn}};
 const doc={createElement(tag){return tag==='section'?panel:tag==='button'?settings:{}},body:{append(){}},head:{append(s){scripts.push(s)}},addEventListener(n,fn){listeners[n]=fn},set cookie(c){cookies.push(c)}};
 const context={document:doc,window:{},localStorage:{getItem(){return stored?JSON.stringify({value:stored,at:Date.now()}):null},setItem(){}},location:{hostname:'jankokes.cz'},Date,JSON};
 vm.runInNewContext(fs.readFileSync('measurement.js','utf8'),context);
 return {context,buttons,scripts,listeners,cookies,panel,settings,calls:()=>context.window.fbq?.queue.map(a=>Array.from(a))||[]};
}
test('no Meta script or lead without consent; rejecting keeps form measurement off',()=>{
 const h=setup();h.listeners['secondmind:lead-confirmed']();h.buttons[0].click();
 assert.equal(h.scripts.length,0);assert.deepEqual(h.calls(),[]);
});
test('grant loads once; confirmed lead once; revocation stops future leads',()=>{
 const h=setup();h.buttons[1].click();h.listeners['secondmind:lead-confirmed']();
 assert.equal(h.scripts.length,1);assert.equal(h.calls().filter(x=>x[1]==='PageView').length,1);
 assert.equal(h.calls().filter(x=>x[1]==='Lead').length,1);
 h.buttons[0].click();h.listeners['secondmind:lead-confirmed']();
 assert.equal(h.calls().filter(x=>x[1]==='Lead').length,1);
 assert(h.cookies.some(x=>x.startsWith('_fbp=; Max-Age=0')));
 h.buttons[1].click();assert.equal(h.scripts.length,1);
 assert.equal(h.calls().filter(x=>x[1]==='PageView').length,1);
});
test('persisted denial stays off; persisted grant starts page view',()=>{
 assert.equal(setup('denied').scripts.length,0);
 assert.equal(setup('granted').scripts.length,1);
});
test('form only announces a Lead after Web3Forms confirms, never on Google opaque success',async()=>{
 for (const confirmed of [false,true]) {
  let submit; const events=[];
  const status={classList:{add(){}},scrollIntoView(){}};
  const button={textContent:'Odeslat'};
  const form={action:'https://api.web3forms.com/submit',addEventListener(n,fn){submit=fn},querySelector(){return button},reset(){}};
  const document={getElementById(id){return {contactForm:form,formStatus:status}[id]},dispatchEvent(e){events.push(e.type)}};
  class FormData {get(k){return k==='zdroj'?'second-mind':null}set(){} *[Symbol.iterator](){yield ['zdroj','second-mind'];}}
  await vm.runInNewContext(fs.readFileSync('script.js','utf8'),{document,FormData,URLSearchParams,location:{pathname:'/second-mind'},CustomEvent:class{constructor(type){this.type=type}},fetch:async url=>url===form.action?{json:async()=>({success:confirmed})}:{type:'opaque'}});
  await submit({preventDefault(){}});await new Promise(r=>setImmediate(r));
  assert.equal(events.length,confirmed?1:0);
 }
});
