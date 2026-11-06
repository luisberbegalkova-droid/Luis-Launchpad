/* Nordic SpringBoard layout adapter. Uses the existing authorized catalog, search, login, links and archive manager. */
(() => {
 "use strict";
 const main=document.getElementById("mainContent"),shell=main.querySelector(".shell"),header=shell.querySelector(".header");
 const categories=document.getElementById("topTabs"),search=document.getElementById("searchInput"),settingsButton=document.getElementById("settingsButton");
 const $n=(tag,className,text)=>{let n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n};
 const colors={
  "INJUSA 12W":["#e7ad78","#bd7947","#b47b4b38"],
  "INJUSA CRM":["#738da0","#486478","#4c677a3a"],
  "INJUSA VENTA PEQUEÑOS":["#cb8877","#9f6155","#a36c5835"],
  "INJUSA EVO STOCK":["#74a087","#3c6d58","#3c6d5838"],
  "INJUSA CONTROL TAREAS":["#89a9a7","#5b8585","#5b85853d"],
  "INJUSA NECESIDADES NETAS":["#7c9a89","#4b7667","#547e6940"],
  "INJUSA CONTROL BLOQUEOS":["#bc796b","#874c3e","#965a4f40"],
  "INJUSA SIMULADOR PEDIDOS":["#7b9ab2","#4d708a","#4d708a3c"],
  "INJUSA ATLAS EXPEDICIONES":["#7e98aa","#506a80","#506a803b"],
  "INJUSA CUADRO DE MANDO EXPEDICIONES":["#bd9096","#91656b","#91656b3b"],
  "INJUSA BOM ANALYZER":["#94a096","#596f60","#596f6040"],
  "KOVA SONG ARCHIVE":["#b695ad","#805c79","#805c7940"],
  "KOVA CONTENT OS":["#d39e72","#aa754c","#b38b613f"],
  "KOVA LEAD MANAGER":["#73a9ad","#3e8589","#3e85893d"]
 };
 const defaultColors=["#82a18a","#426750","#4267503d"];
 function colorize(el,app){
  const vals=colors[app?.name]||defaultColors;
  el.style.setProperty("--n-icon-light",vals[0]);el.style.setProperty("--n-icon-dark",vals[1]);el.style.setProperty("--n-icon-shadow",vals[2])
 }
 /* Real current-time menubar with only working navigation actions. */
 const topbar=$n("div","n-topbar");
 const left=$n("div","n-top-left"),clock=$n("span","n-time"),badge=$n("span","n-capsule","INJUSA · KOVA  /  STUDIO");
 left.append(clock,badge);
 const topNav=$n("nav","n-top-nav");topNav.setAttribute("aria-label","Navegación principal");
 function navButton(title,action){const b=$n("button","",title);b.type="button";b.onclick=action;topNav.append(b);return b}
 const home=navButton("SpringBoard",()=>{currentTab="ALL";renderTabs();renderGrid();window.scrollTo({top:0,behavior:"smooth"})});
 navButton("Aplicaciones",()=>document.getElementById("appGrid").scrollIntoView({behavior:"smooth",block:"center"}));
 navButton("Buscar",()=>{search.focus();search.select()});
 navButton("Ajustes",()=>settingsButton.click());
 const right=$n("div","n-top-right"),glass=symbol("apps"),avatar=$n("span","n-avatar","IJ");glass.setAttribute("title","Accesos disponibles");right.append(glass,avatar);
 topbar.append(left,topNav,right);main.insertBefore(topbar,shell);
 function clockTick(){clock.textContent=new Intl.DateTimeFormat("es-ES",{hour:"2-digit",minute:"2-digit"}).format(new Date())}
 clockTick();setInterval(clockTick,60000);
 /* Use segmented INJUSA/KOVA navigation above the search without changing category authorization. */
 header.insertBefore(categories,header.querySelector(".top-actions"));
 const hero=shell.querySelector(".hero"),widgets=$n("div","n-widgets"),side=$n("aside","n-summary");
 side.setAttribute("aria-label","Resumen de accesos");
 side.innerHTML='<div class="n-summary-title"><div><p>MI ESPACIO DE TRABAJO</p><h2>Accesos disponibles</h2></div><div class="n-summary-badge"><span class="symbol" aria-hidden="true">grid_view</span></div></div><div class="n-summary-counts"><div class="n-summary-count"><strong id="n-visible-count">0</strong><span>Visibles</span></div><div class="n-summary-count"><strong id="n-hidden-count">0</strong><span>Archivadas</span></div><div class="n-summary-count"><strong id="n-total-count">0</strong><span>Total</span></div></div><div class="n-summary-foot"><span class="symbol" aria-hidden="true">verified_user</span><span id="n-summary-desc">Solo se muestran las aplicaciones permitidas para tu usuario.</span></div>';
 hero.parentNode.insertBefore(widgets,hero);widgets.append(hero,side);
 const dockWrap=$n("div","n-dock-wrap"),dock=$n("nav","n-dock");dock.setAttribute("aria-label","Accesos rápidos");dockWrap.append(dock);main.append(dockWrap);
 function hiddenNames(){
  if(!currentUser)return [];
  try{const x=JSON.parse(localStorage.getItem("launchpad_archived_v1_"+currentUser.name)||"[]");return Array.isArray(x)?x:[]}catch{return []}
 }
 function addDock(){
  dock.replaceChildren();
  if(!currentUser)return;
  const all=authorizedApps(),hidden=new Set(hiddenNames()),available=all.filter(a=>!hidden.has(a.name));
  const inCategory=available.filter(a=>currentTab==="ALL"||a.category===currentTab);
  const preferred=["INJUSA BOM ANALYZER","INJUSA CONTROL BLOQUEOS","INJUSA ATLAS EXPEDICIONES","KOVA CONTENT OS","KOVA LEAD MANAGER","INJUSA 12W"];
  const ordered=[...recentNames(),...preferred].map(name=>inCategory.find(a=>a.name===name)).filter(Boolean);
  const unique=[];for(const a of ordered){if(!unique.some(x=>x.name===a.name))unique.push(a)}
  for(const a of inCategory){if(unique.length>=4)break;if(!unique.some(x=>x.name===a.name))unique.push(a)}
  unique.slice(0,4).forEach(app=>{
   const link=$n("a","n-dock-item");link.href=app.url;link.target="_blank";link.rel="noopener noreferrer";link.setAttribute("aria-label","Abrir "+app.name);link.title=app.name;
   colorize(link,app);link.append(symbol(iconFor(app)), $n("span","n-dock-note",app.name));link.onclick=()=>saveRecent(app);dock.append(link)
  });
  if(unique.length)dock.append($n("span","n-dock-divider"));
  const button=$n("button","n-dock-item n-dock-settings");button.type="button";button.title="Personalizar aplicaciones";button.setAttribute("aria-label","Configurar aplicaciones");button.append(symbol("settings"),$n("span","n-dock-note","Configuración"));button.onclick=()=>settingsButton.click();dock.append(button)
 }
 function decorate(){
  if(!currentUser)return;
  const all=authorizedApps(),hidden=new Set(hiddenNames());
  const count=all.filter(a=>hidden.has(a.name)).length;
  document.getElementById("n-total-count").textContent=all.length;
  document.getElementById("n-hidden-count").textContent=count;
  document.getElementById("n-visible-count").textContent=all.length-count;
  document.getElementById("n-summary-desc").textContent=count?count+" aplicaciones archivadas. Puedes recuperarlas desde Ajustes.":"Todas tus aplicaciones autorizadas están disponibles.";
  avatar.textContent=(currentUser.name||"U").slice(0,2).toUpperCase();
  topNav.querySelectorAll("button").forEach((b,i)=>b.classList.toggle("n-on",i===0));
  document.querySelectorAll(".app-tile").forEach(tile=>{let app=all.find(a=>a.name===tile.dataset.name);if(app)colorize(tile,app)});
  if(activeApp)colorize(hero,activeApp);
  addDock()
 }
 /* Preserve original navigation, deep links, keyboard arrows and archive manager. */
 const oldGrid=renderGrid;
 renderGrid=function(){oldGrid();decorate()};
 const oldRecent=renderRecent;
 renderRecent=function(){oldRecent();decorate()};
 const oldHero=renderHero;
 renderHero=function(){oldHero();if(activeApp)colorize(hero,activeApp)};
 const oldTabs=renderTabs;
 renderTabs=function(){
  oldTabs();
  const labels={"ALL":"Todas","INJUSA":"INJUSA Central","KOVA":"KOVA Studio","KOVA.labs":"KOVA.labs"};
  document.querySelectorAll("#topTabs .cat").forEach(btn=>{
   const old=btn.textContent.trim();
   const key=old==="All"?"ALL":old;
   btn.textContent=labels[key]||old;
  })
 };
 const oldSetup=setupWorkspace;
 setupWorkspace=function(){oldSetup();decorate()};
 /* Native shortcuts and Escape behavior are handled by the existing application.
    Capture Cmd+K so it focuses the visible search field. */
 document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"&&currentUser){e.preventDefault();e.stopImmediatePropagation();search.focus()}
 },true);
})();
