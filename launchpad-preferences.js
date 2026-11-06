/* Launchpad preferences — local, reversible per-user archiving. Never removes catalog entries. */
(() => {
 "use strict";
 const key=()=>currentUser?"launchpad_archived_v1_"+currentUser.name:null;
 const archived=()=>{if(!key())return [];try{let v=JSON.parse(localStorage.getItem(key())||"[]");return Array.isArray(v)?v.filter(x=>typeof x==="string"):[]}catch{return []}};
 const isArchived=a=>archived().includes(a.name);
 let filter="all", previousFocus=null;
 const oldVisible=visibleApps, oldRecent=recentNames, oldHero=renderHero;
 visibleApps=function(){return oldVisible().filter(a=>!isArchived(a))};
 recentNames=function(){return oldRecent().filter(n=>!archived().includes(n))};
 renderHero=function(){oldHero();if(activeApp)document.querySelector(".hero").style.setProperty("--hero-accent",activeApp.accent||"#7ba3ee")};
 function node2(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el}
 function change(app,archive){
  if(!authorizedApps().some(a=>a.name===app.name))return;
  const names=new Set(archived());archive?names.add(app.name):names.delete(app.name);
  try{localStorage.setItem(key(),JSON.stringify([...names]))}catch{}
  renderGrid();renderRecent();draw();
 }
 function draw(){
  if(!currentUser)return;
  const list=authorizedApps(),hidden=archived(),search=document.getElementById("settingsSearch").value.trim().toLowerCase();
  const count=list.filter(a=>hidden.includes(a.name)).length;
  document.getElementById("settingsSummary").textContent=(list.length-count)+" visibles · "+count+" archivadas";
  document.getElementById("restoreAllButton").hidden=count===0;
  document.querySelectorAll("[data-archive-filter]").forEach(btn=>{
   const on=btn.dataset.archiveFilter===filter;btn.classList.toggle("active",on);btn.setAttribute("aria-pressed",String(on));
  });
  const filtered=list.filter(a=>(filter==="all"||(filter==="archived"?hidden.includes(a.name):!hidden.includes(a.name)))&&(a.name+" "+a.category+" "+a.subtitle).toLowerCase().includes(search));
  const panel=document.getElementById("settingsList");panel.replaceChildren();
  if(!filtered.length){panel.append(node2("p","settings-empty","No hay aplicaciones con estos filtros."));return}
  [...new Set(filtered.map(a=>a.category))].forEach(cat=>{
   panel.append(node2("h3","archive-group-title",cat));
   filtered.filter(a=>a.category===cat).forEach(app=>{
    const off=hidden.includes(app.name),row=node2("div","archive-row"),ic=node2("span","archive-app-icon");
    ic.style.setProperty("--tile-accent",app.accent||"#7f9af3");ic.append(symbol(iconFor(app)));
    const copy=node2("div","archive-row-copy");copy.append(node2("strong","",app.name),node2("small","",off?"Archivada · "+app.subtitle:app.subtitle));
    const button=node2("button","archive-action"+(off?" restore":""),off?"Restaurar":"Archivar");
    button.type="button";button.setAttribute("aria-label",(off?"Restaurar ":"Archivar ")+app.name);button.onclick=()=>change(app,!off);
    row.append(ic,copy,button);panel.append(row)
   })
  })
 }
 function open(){
  if(!currentUser)return;
  previousFocus=document.activeElement;filter="all";document.getElementById("settingsSearch").value="";
  document.getElementById("profileMenu").hidden=true;
  document.getElementById("profileButton").setAttribute("aria-expanded","false");
  document.getElementById("settingsOverlay").hidden=false;draw();document.getElementById("settingsClose").focus()
 }
 function close(){
  document.getElementById("settingsOverlay").hidden=true;
  if(previousFocus&&document.contains(previousFocus))previousFocus.focus();
  previousFocus=null
 }
 const settingsButton=node2("button","settings-trigger");
 settingsButton.type="button";settingsButton.id="settingsButton";settingsButton.title="Configurar aplicaciones";settingsButton.setAttribute("aria-label","Configurar aplicaciones");settingsButton.append(symbol("tune"));
 document.querySelector(".top-actions").insertBefore(settingsButton,document.querySelector(".profile-wrap"));
 settingsButton.onclick=open;
 const profileEntry=node2("button","","Configurar aplicaciones");profileEntry.type="button";
 profileEntry.prepend(symbol("tune"));profileEntry.onclick=open;document.getElementById("profileMenu").prepend(profileEntry);
 const overlay=node2("div","settings-overlay");overlay.id="settingsOverlay";overlay.hidden=true;
 overlay.innerHTML='<section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle"><header class="settings-head"><span class="settings-head-icon"><span class="symbol">tune</span></span><div><h2 id="settingsTitle">Personalizar Launchpad</h2><p>Archiva aplicaciones que no utilizas. Se pueden restaurar cuando quieras.</p></div><button type="button" class="settings-close" id="settingsClose" aria-label="Cerrar"><span class="symbol">close</span></button></header><div class="settings-tools"><span id="settingsSummary" class="settings-summary"></span><div class="settings-filters"><button type="button" class="settings-filter active" data-archive-filter="all">Todas</button><button type="button" class="settings-filter" data-archive-filter="active">Visibles</button><button type="button" class="settings-filter" data-archive-filter="archived">Archivadas</button></div></div><div class="settings-search-wrap"><input id="settingsSearch" class="settings-search" type="search" placeholder="Buscar aplicación..." aria-label="Buscar aplicación"></div><div class="settings-list" id="settingsList"></div><footer class="settings-foot"><div><div class="settings-note">Preferencias guardadas para este usuario en este navegador. No se eliminan aplicaciones ni cambian permisos.</div><button type="button" class="restore-all" id="restoreAllButton" hidden>Restaurar todas</button></div><button type="button" class="settings-done" id="settingsDone">Listo</button></footer></section>';
 document.body.append(overlay);
 document.getElementById("settingsClose").onclick=close;
 document.getElementById("settingsDone").onclick=close;
 document.getElementById("settingsSearch").addEventListener("input",draw);
 document.querySelectorAll("[data-archive-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.archiveFilter;draw()});
 document.getElementById("restoreAllButton").onclick=()=>{try{localStorage.setItem(key(),"[]")}catch{}renderGrid();renderRecent();draw()};
 overlay.onclick=e=>{if(e.target===overlay)close()};
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden){e.preventDefault();close()}},true);
 overlay.addEventListener("keydown",e=>{
  if(e.key!=="Tab")return;
  const items=[...overlay.querySelectorAll("button:not([hidden]),input")].filter(x=>x.getClientRects().length);
  if(!items.length)return;
  if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus()}
 });
 /* Decorate icon tiles with their distinct app accent after the existing renderer runs. */
 const originalGrid=renderGrid;
 renderGrid=function(){originalGrid();document.querySelectorAll(".app-tile").forEach(tile=>{
  const app=authorizedApps().find(a=>a.name===tile.dataset.name);
  if(app)tile.style.setProperty("--tile-accent",app.accent||"#7f9af3")
 })};
 const originalLogout=handleLogout;
 handleLogout=function(){close();originalLogout()};
})();
