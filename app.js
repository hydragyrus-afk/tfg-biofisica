(() => {
  const $ = (id) => document.getElementById(id);
  const PHASES = [
    {id:"bibliography", name:"Leer bibliografía"},
    {id:"understanding", name:"Comprensión de temas"},
    {id:"math", name:"Desarrollos físico-matemáticos"},
    {id:"variables", name:"Identificación de variables clave"},
    {id:"assumptions", name:"Justificación de aproximaciones y regímenes"},
    {id:"simulation", name:"Simulación"},
    {id:"interpretation", name:"Interpretación de resultados"},
    {id:"visuals", name:"Generar imágenes y soporte visual"},
    {id:"writing", name:"Redacción de textos"},
    {id:"layout", name:"Maquetación"},
    {id:"conclusions", name:"Conclusiones"},
    {id:"report", name:"Generar memoria"},
    {id:"presentation", name:"Generar presentación"}
  ];
  const TOPIC_GROUPS = [
    {id:"fluid",letter:"A",title:"Medio fluido y geometría",subtitle:"El entorno físico de la adhesión",color:"#dce8d9",topics:[
      {id:"hydro",name:"Hidrodinámica",desc:"Ecuaciones de flujo, escalas, fuerzas y regímenes."},
      {id:"blood",name:"Sangre como fluido",desc:"Reología, viscosidad efectiva y naturaleza multifásica."},
      {id:"capillaries",name:"Capilares",desc:"Geometría, dimensiones, condiciones de contorno y flujo."}
    ]},
    {id:"cell",letter:"B",title:"Biología y mecánica celular",subtitle:"La célula como objeto físico y biológico",color:"#f4dfd2",topics:[
      {id:"morphology",name:"Morfología celular",desc:"Forma, tamaño, orientación y deformabilidad geométrica."},
      {id:"biochemistry",name:"Bioquímica celular",desc:"Procesos bioquímicos relevantes para la adhesión."},
      {id:"mechanics",name:"Propiedades mecánicas",desc:"Elasticidad, rigidez, viscoelasticidad y respuesta a fuerzas."},
      {id:"cellpairs",name:"Pares celulares",desc:"Interacción entre células, contacto y fuerzas mutuas."}
    ]},
    {id:"adhesion",letter:"C",title:"Adhesión molecular",subtitle:"Del receptor al enlace mecánico",color:"#e4def0",topics:[
      {id:"integrins",name:"Integrinas",desc:"Receptores, activación, distribución y unión al ligando."},
      {id:"bonds",name:"Bonds",desc:"Cinética de enlace, fuerzas de ruptura y modelos de unión."},
      {id:"tethers",name:"Tethers",desc:"Formación, elongación, fuerza y desprendimiento de tether."}
    ]},
    {id:"models",letter:"D",title:"Modelización",subtitle:"De las hipótesis a las ecuaciones",color:"#dce8ef",topics:[
      {id:"rigid",name:"Modelo de sólido rígido",desc:"Geometría idealizada, fuerzas y condiciones de contacto."},
      {id:"nonideal",name:"Modelo de célula no ideal",desc:"Deformabilidad, geometría realista y complejidad adicional."}
    ]},
    {id:"analysis",letter:"E",title:"Análisis y resultados",subtitle:"Qué predice el modelo y por qué",color:"#f0e8c9",topics:[
      {id:"sensitivity",name:"Análisis de sensibilidad",desc:"Parámetros dominantes, incertidumbre y robustez."},
      {id:"simulations",name:"Simulaciones",desc:"Implementación, verificación numérica y exploración del modelo."}
    ]}
  ];
  const ALL_TOPICS = TOPIC_GROUPS.flatMap(g => g.topics.map(t => ({...t, group:g.title})));
  const SEED_TASKS = [
    ["Definir el alcance físico del modelo y la pregunta central","understanding","hydro","doing"],
    ["Construir una bibliografía inicial sobre adhesión celular bajo flujo","bibliography","integrins","todo"],
    ["Identificar escalas características y números adimensionales","variables","hydro","todo"],
    ["Justificar las aproximaciones del modelo de sólido rígido","assumptions","rigid","todo"],
    ["Derivar y comprobar las ecuaciones principales del modelo","math","rigid","todo"],
    ["Definir un conjunto de parámetros de referencia","variables","simulations","todo"],
    ["Implementar una primera simulación reproducible","simulation","simulations","todo"],
    ["Comparar resultados con límites o casos de referencia","interpretation","simulations","todo"],
    ["Diseñar las figuras principales de la memoria","visuals","simulations","todo"],
    ["Preparar un índice razonado de la memoria","writing","simulations","todo"]
  ];
  let supabase = null, user = null, authMode = "login";
  let data = {tasks:[],topics:[],sources:[],simulations:[]};
  let busy = false;

  const escapeHTML = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const topicName = id => ALL_TOPICS.find(t=>t.id===id)?.name || "Sin tema";
  const phaseName = id => PHASES.find(p=>p.id===id)?.name || "Sin fase";
  const statusName = s => ({todo:"Pendiente",doing:"En curso",blocked:"Bloqueada",done:"Completada"}[s] || s);
  const sourceStatusName = s => ({to_read:"Por leer",reading:"Leyendo",read:"Leído",useful:"Clave para el TFG"}[s] || s);
  const simStatusName = s => ({idea:"Idea",building:"En desarrollo",running:"Ejecutada",analysed:"Analizada",validated:"Verificada / validada"}[s] || s);
  const topicStatusName = s => ({not_started:"Pendiente",exploring:"Explorando",understood:"Comprendido",mastered:"Consolidado"}[s] || s);
  const today = () => new Date().toISOString().slice(0,10);
  const formatDate = d => { if(!d) return ""; const x=new Date(d+"T12:00:00"); return x.toLocaleDateString("es-ES",{day:"2-digit",month:"short"}); };
  const toast = msg => { const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2600); };
  const setCloud = (text,connected=false) => { $("cloudStatus").innerHTML=`<i></i> ${escapeHTML(text)}`; $("cloudStatus").classList.toggle("connected",connected); };
  const setSave = text => $("saveStatus").textContent=text;
  const configured = () => window.TFG_CONFIG && window.TFG_CONFIG.SUPABASE_URL.startsWith("https://") && !window.TFG_CONFIG.SUPABASE_URL.includes("PEGA_AQUI") && window.TFG_CONFIG.SUPABASE_ANON_KEY && !window.TFG_CONFIG.SUPABASE_ANON_KEY.includes("PEGA_AQUI");

  function init(){
    $("footerYear").textContent = new Date().getFullYear();
    $("todayLabel").textContent = "CUADERNO · " + new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
    fillSelects();
    renderTopicGroups(); renderPhaseFilter();
    bindEvents();
    if(!configured()){
      $("configWarning").hidden=false;
      $("configWarning").textContent="Falta configurar Supabase. Sigue las instrucciones de README.md y completa config.js para activar el acceso privado y la sincronización.";
      $("authSubmit").disabled=true; $("authSubmit").style.opacity=".5";
      setCloud("Configurar Supabase");
      return;
    }
    if(!window.supabase){ $("configWarning").hidden=false; $("configWarning").textContent="No se pudo cargar el cliente de Supabase. Comprueba tu conexión a Internet."; return; }
    supabase = window.supabase.createClient(window.TFG_CONFIG.SUPABASE_URL, window.TFG_CONFIG.SUPABASE_ANON_KEY);
    supabase.auth.getSession().then(({data:{session}})=> session ? onSignedIn(session.user) : showAuth());
    supabase.auth.onAuthStateChange((_event,session)=> { if(session) onSignedIn(session.user); else { user=null; showAuth(); } });
  }

  function fillSelects(){
    const phaseOptions=PHASES.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join("");
    const topicOptions='<option value="">Sin tema asociado</option>'+ALL_TOPICS.map(t=>`<option value="${t.id}">${escapeHTML(t.name)}</option>`).join("");
    ["taskPhase","phaseFilter"].forEach(id=>$(id).innerHTML=(id==="phaseFilter"?'<option value="all">Todas las fases</option>':"")+phaseOptions);
    ["taskTopic","sourceTopic","simulationTopic"].forEach(id=>$(id).innerHTML=topicOptions);
  }
  function bindEvents(){
    document.querySelectorAll("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>{authMode=b.dataset.authTab;document.querySelectorAll("[data-auth-tab]").forEach(x=>x.classList.toggle("active",x===b));$("authSubmit").innerHTML=authMode==="login"?'Entrar en mi cuaderno <span>↗</span>':'Crear mi cuenta <span>↗</span>'; $("password").autocomplete=authMode==="login"?"current-password":"new-password";$("authMessage").textContent="";}));
    $("authForm").addEventListener("submit",authSubmit);
    $("signOutBtn").addEventListener("click",()=>supabase.auth.signOut());
    document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
    document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
    $("quickAddBtn").addEventListener("click",()=>openTask());
    $("addTaskBtn").addEventListener("click",()=>openTask());
    $("addSourceBtn").addEventListener("click",()=>openSource());
    $("addSimulationBtn").addEventListener("click",()=>openSimulation());
    document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
    $("taskForm").addEventListener("submit",saveTask);
    $("sourceForm").addEventListener("submit",saveSource);
    $("simulationForm").addEventListener("submit",saveSimulation);
    $("taskSearch").addEventListener("input",renderTasks); $("taskFilter").addEventListener("change",renderTasks); $("phaseFilter").addEventListener("change",renderTasks);
    $("sourceSearch").addEventListener("input",renderSources); $("sourceStatus").addEventListener("change",renderSources);
    $("topicGroups").addEventListener("change",updateTopicStatus);
    $("taskList").addEventListener("click",taskListAction);
    $("nextTasks").addEventListener("click",taskListAction);
    $("sourceList").addEventListener("click",sourceAction);
    $("simulationList").addEventListener("click",simulationAction);
  }
  async function authSubmit(e){
    e.preventDefault(); if(!supabase) return;
    const email=$("email").value.trim(), password=$("password").value; $("authSubmit").disabled=true; $("authMessage").textContent="";
    try{
      const result=authMode==="login" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password});
      if(result.error) throw result.error;
      if(authMode==="signup" && !result.data.session) $("authMessage").textContent="Cuenta creada. Revisa tu correo para confirmar la dirección y después inicia sesión.";
      else if(result.data.user) await onSignedIn(result.data.user);
    }catch(err){$("authMessage").textContent=err.message || "No se pudo iniciar sesión.";}
    finally{$("authSubmit").disabled=false;}
  }
  function showAuth(){ $("authScreen").hidden=false; $("appScreen").hidden=true; $("signOutBtn").hidden=true; setCloud(configured()?"Sin sesión":"Configurar Supabase"); }
  async function onSignedIn(u){
    if(!u || busy) return; busy=true; user=u;
    $("authScreen").hidden=true; $("appScreen").hidden=false; $("signOutBtn").hidden=false; setCloud("Sincronizando…");
    try{ await loadAll(); setCloud("Sincronizado",true); renderAll(); }
    catch(err){console.error(err); toast("Error al cargar datos: "+(err.message||"comprueba el esquema SQL"));setCloud("Error de sincronización");}
    finally{busy=false;}
  }
  function showView(view){
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
  }
  async function loadAll(){
    const tables=[["tasks","tasks"],["topics","topic_progress"],["sources","sources"],["simulations","simulations"]];
    const loaded=await Promise.all(tables.map(async ([key,table])=>{const {data,error}=await supabase.from(table).select("*").order("created_at",{ascending:false});if(error)throw error;return [key,data||[]];}));
    loaded.forEach(([k,v])=>data[k]=v);
    if(data.topics.length===0){
      const seeds=ALL_TOPICS.map(t=>({user_id:user.id,topic_id:t.id,status:"not_started",notes:""}));
      const {data:inserted,error}=await supabase.from("topic_progress").insert(seeds).select();
      if(error) throw error; data.topics=inserted||[];
    }
    if(data.tasks.length===0){
      const seeds=SEED_TASKS.map(([title,phase,topic_id,status])=>({user_id:user.id,title,phase,topic_id,status,notes:"",due_date:null}));
      const {data:inserted,error}=await supabase.from("tasks").insert(seeds).select();
      if(error) throw error; data.tasks=inserted||[];
    }
  }
  function renderAll(){renderDashboard();renderTopicGroups();renderTasks();renderSources();renderSimulations();}
  function renderDashboard(){
    const total=data.tasks.length, done=data.tasks.filter(t=>t.status==="done").length, pct=total?Math.round(done/total*100):0;
    $("overallProgress").textContent=pct; $("overallBar").style.width=pct+"%"; $("progressCaption").textContent=`${done} de ${total} tareas completadas`;
    $("openTasks").textContent=data.tasks.filter(t=>t.status!=="done").length;
    $("masteredTopics").textContent=data.topics.filter(t=>t.status==="mastered").length; $("topicTotal").textContent="/ "+ALL_TOPICS.length;
    $("simulationCount").textContent=data.simulations.length; $("taskNavCount").textContent=data.tasks.filter(t=>t.status!=="done").length;
    const next=data.tasks.filter(t=>t.status!=="done").sort((a,b)=>(a.due_date||"9999").localeCompare(b.due_date||"9999")).slice(0,5);
    $("nextTasks").innerHTML=next.length?next.map(t=>`<div class="preview-task"><button class="tiny-check ${t.status==="done"?"done":""}" data-action="toggle-task" data-id="${t.id}" aria-label="Completar tarea">${t.status==="done"?"✓":""}</button><div><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(phaseName(t.phase))} · ${escapeHTML(topicName(t.topic_id))}</small></div><span class="task-date">${escapeHTML(formatDate(t.due_date))}</span></div>`).join(""):'<div class="empty-state"><strong>Todo despejado</strong>Añade una tarea para definir el siguiente paso.</div>';
    $("phaseProgress").innerHTML=PHASES.map(p=>{const ts=data.tasks.filter(t=>t.phase===p.id), d=ts.filter(t=>t.status==="done").length, pp=ts.length?Math.round(d/ts.length*100):0;return `<div class="phase-row"><label>${escapeHTML(p.name)}</label><span>${ts.length?pp+"%":"—"}</span><div class="mini-track"><i style="width:${pp}%"></i></div></div>`;}).join("");
  }
  function renderTopicGroups(){
    $("topicGroups").innerHTML=TOPIC_GROUPS.map(g=>`<article class="topic-group"><div class="topic-group-head" style="--group-color:${g.color}"><div class="topic-letter">${g.letter}</div><div><h3>${escapeHTML(g.title)}</h3><p>${escapeHTML(g.subtitle)}</p></div></div><div class="topic-cards">${g.topics.map(t=>{const p=data.topics.find(x=>x.topic_id===t.id);const s=p?.status||"not_started";const dot=s==="mastered"?"dot-green":s==="exploring"||s==="understood"?"dot-amber":"dot-grey";return `<article class="topic-card"><div class="topic-status"><i class="dot ${dot}"></i>${escapeHTML(topicStatusName(s))}</div><h4>${escapeHTML(t.name)}</h4><p>${escapeHTML(t.desc)}</p><select data-topic-id="${t.id}" aria-label="Estado de ${escapeHTML(t.name)}"><option value="not_started" ${s==="not_started"?"selected":""}>Pendiente</option><option value="exploring" ${s==="exploring"?"selected":""}>Explorando</option><option value="understood" ${s==="understood"?"selected":""}>Comprendido</option><option value="mastered" ${s==="mastered"?"selected":""}>Consolidado</option></select></article>`;}).join("")}</div></article>`).join("");
  }
  async function updateTopicStatus(e){
    const sel=e.target.closest("[data-topic-id]"); if(!sel||!user)return;
    const existing=data.topics.find(t=>t.topic_id===sel.dataset.topicId);
    setSave("Guardando…");
    const {data:updated,error}=await supabase.from("topic_progress").update({status:sel.value,updated_at:new Date().toISOString()}).eq("id",existing.id).select().single();
    if(error){toast("No se pudo guardar el estado");setSave("Error al guardar");return;}
    data.topics=data.topics.map(t=>t.id===updated.id?updated:t);renderTopicGroups();renderDashboard();setSave("Cambios sincronizados");
  }
  function renderPhaseFilter(){/* select options are populated in fillSelects */}
  function renderTasks(){
    if(!$("taskList"))return;
    const q=$("taskSearch").value.toLowerCase(), st=$("taskFilter").value, ph=$("phaseFilter").value;
    const list=data.tasks.filter(t=>(st==="all"||t.status===st)&&(ph==="all"||t.phase===ph)&&[t.title,t.notes,phaseName(t.phase),topicName(t.topic_id)].join(" ").toLowerCase().includes(q)).sort((a,b)=>{if(a.status==="done"&&b.status!=="done")return 1;if(b.status==="done"&&a.status!=="done")return -1;return (a.due_date||"9999").localeCompare(b.due_date||"9999");});
    $("taskList").innerHTML=list.length?list.map(t=>`<article class="task-item ${t.status==="done"?"is-done":""}"><input class="task-check" type="checkbox" data-action="toggle-task" data-id="${t.id}" ${t.status==="done"?"checked":""} aria-label="Marcar como completada"><div><h3>${escapeHTML(t.title)}</h3><div class="task-meta"><span class="pill">${escapeHTML(phaseName(t.phase))}</span><span class="pill">${escapeHTML(topicName(t.topic_id))}</span><span class="pill status-${t.status}">${escapeHTML(statusName(t.status))}</span>${t.due_date?`<span class="pill">Objetivo: ${escapeHTML(formatDate(t.due_date))}</span>`:""}</div>${t.notes?`<p class="task-notes">${escapeHTML(t.notes)}</p>`:""}</div><div class="task-actions"><button class="small-action" data-action="edit-task" data-id="${t.id}">Editar</button><button class="small-action" data-action="delete-task" data-id="${t.id}">×</button></div></article>`).join(""):'<div class="empty-state"><strong>No hay tareas que coincidan</strong>Prueba otro filtro o crea una tarea nueva.</div>';
    $("taskNavCount").textContent=data.tasks.filter(t=>t.status!=="done").length;
  }
  function openTask(task=null){
    $("taskForm").reset();$("taskId").value=task?.id||"";$("taskDialogTitle").textContent=task?"Editar tarea":"Nueva tarea";
    $("taskTitle").value=task?.title||"";$("taskPhase").value=task?.phase||"understanding";$("taskTopic").value=task?.topic_id||"";$("taskStatus").value=task?.status||"todo";$("taskDue").value=task?.due_date||"";$("taskNotes").value=task?.notes||"";$("taskFormMessage").textContent="";$("taskDialog").showModal();
  }
  async function saveTask(e){
    e.preventDefault();const id=$("taskId").value;const payload={title:$("taskTitle").value.trim(),phase:$("taskPhase").value,topic_id:$("taskTopic").value||null,status:$("taskStatus").value,due_date:$("taskDue").value||null,notes:$("taskNotes").value.trim(),user_id:user.id};
    await persist("tasks",id,payload,"Tarea guardada",async result=>{if(id)data.tasks=data.tasks.map(t=>t.id===id?result:t);else data.tasks.unshift(result);$("taskDialog").close();renderAll();});
  }
  async function taskListAction(e){
    const b=e.target.closest("[data-action]");if(!b)return;const {action,id}=b.dataset;const t=data.tasks.find(x=>x.id===id);if(!t)return;
    if(action==="edit-task")return openTask(t);
    if(action==="delete-task"){if(!confirm("¿Eliminar esta tarea?"))return;await removeRecord("tasks",id,()=>{data.tasks=data.tasks.filter(x=>x.id!==id);renderAll();});}
    if(action==="toggle-task"){const status=t.status==="done"?"todo":"done";await persist("tasks",id,{status,updated_at:new Date().toISOString()},status==="done"?"Tarea completada":"Tarea reabierta",r=>{data.tasks=data.tasks.map(x=>x.id===id?r:x);renderAll();});}
  }
  function renderSources(){
    const q=$("sourceSearch").value.toLowerCase(),st=$("sourceStatus").value;
    const list=data.sources.filter(s=>(st==="all"||s.status===st)&&[s.title,s.author,s.notes,topicName(s.topic_id)].join(" ").toLowerCase().includes(q));
    $("sourceList").innerHTML=list.length?list.map(s=>`<article class="source-card"><div class="source-top"><span class="pill">${escapeHTML(sourceStatusName(s.status))}</span><div class="task-actions"><button class="small-action" data-action="edit-source" data-id="${s.id}">Editar</button><button class="small-action" data-action="delete-source" data-id="${s.id}">×</button></div></div><h3>${escapeHTML(s.title)}</h3><div class="source-author">${escapeHTML([s.author,s.year].filter(Boolean).join(" · ")||"Autoría pendiente")} · ${escapeHTML(topicName(s.topic_id))}</div>${s.notes?`<p class="source-notes">${escapeHTML(s.notes)}</p>`:'<p class="source-notes">Añade notas sobre las ideas, ecuaciones y limitaciones útiles.</p>'}<div class="source-foot">${s.url?`<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>`:'<span class="small-muted">Sin enlace</span>'}<span class="pill">${escapeHTML(s.year||"Año —")}</span></div></article>`).join(""):'<div class="empty-state"><strong>Tu biblioteca empieza aquí</strong>Registra artículos, libros, DOI y notas de lectura.</div>';
  }
  function openSource(s=null){
    $("sourceForm").reset();$("sourceId").value=s?.id||"";$("sourceDialogTitle").textContent=s?"Editar referencia":"Añadir referencia";$("sourceTitleInput").value=s?.title||"";$("sourceAuthor").value=s?.author||"";$("sourceYear").value=s?.year||"";$("sourceUrl").value=s?.url||"";$("sourceTopic").value=s?.topic_id||"";$("sourceReadStatus").value=s?.status||"to_read";$("sourceNotes").value=s?.notes||"";$("sourceFormMessage").textContent="";$("sourceDialog").showModal();
  }
  async function saveSource(e){
    e.preventDefault();const id=$("sourceId").value;const payload={title:$("sourceTitleInput").value.trim(),author:$("sourceAuthor").value.trim(),year:$("sourceYear").value?Number($("sourceYear").value):null,url:$("sourceUrl").value.trim()||null,topic_id:$("sourceTopic").value||null,status:$("sourceReadStatus").value,notes:$("sourceNotes").value.trim(),user_id:user.id};
    await persist("sources",id,payload,"Referencia guardada",r=>{if(id)data.sources=data.sources.map(x=>x.id===id?r:x);else data.sources.unshift(r);$("sourceDialog").close();renderSources();});
  }
  async function sourceAction(e){
    const b=e.target.closest("[data-action]");if(!b)return;const s=data.sources.find(x=>x.id===b.dataset.id);if(!s)return;
    if(b.dataset.action==="edit-source")openSource(s);
    if(b.dataset.action==="delete-source"&&confirm("¿Eliminar esta referencia?"))await removeRecord("sources",s.id,()=>{data.sources=data.sources.filter(x=>x.id!==s.id);renderSources();});
  }
  function renderSimulations(){
    const list=data.simulations;
    $("simulationList").innerHTML=list.length?list.map(s=>`<article class="simulation-card"><div class="source-top"><span class="pill">${escapeHTML(simStatusName(s.status))}</span><div class="task-actions"><button class="small-action" data-action="edit-sim" data-id="${s.id}">Editar</button><button class="small-action" data-action="delete-sim" data-id="${s.id}">×</button></div></div><h3>${escapeHTML(s.title)}</h3><div class="source-author">${escapeHTML(topicName(s.topic_id))}</div>${s.question?`<div class="model-section"><strong>PREGUNTA FÍSICA</strong><p>${escapeHTML(s.question)}</p></div>`:""}${s.assumptions?`<div class="model-section"><strong>HIPÓTESIS Y APROXIMACIONES</strong><p>${escapeHTML(s.assumptions)}</p></div>`:""}${s.variables?`<div class="model-section"><strong>VARIABLES Y PARÁMETROS</strong><p>${escapeHTML(s.variables)}</p></div>`:""}${s.results?`<div class="model-section"><strong>RESULTADOS E INTERPRETACIÓN</strong><p>${escapeHTML(s.results)}</p></div>`:""}${s.link?`<div class="source-foot"><a href="${escapeHTML(s.link)}" target="_blank" rel="noopener noreferrer">Abrir código / notebook ↗</a></div>`:""}</article>`).join(""):'<div class="empty-state"><strong>El banco está vacío</strong>Registra tus modelos, hipótesis, parámetros y resultados para que sean reproducibles.</div>';
  }
  function openSimulation(s=null){
    $("simulationForm").reset();$("simulationId").value=s?.id||"";$("simulationDialogTitle").textContent=s?"Editar modelo":"Registrar simulación";$("simulationTitle").value=s?.title||"";$("simulationTopic").value=s?.topic_id||"";$("simulationStatus").value=s?.status||"idea";$("simulationQuestion").value=s?.question||"";$("simulationAssumptions").value=s?.assumptions||"";$("simulationVariables").value=s?.variables||"";$("simulationResults").value=s?.results||"";$("simulationLink").value=s?.link||"";$("simulationFormMessage").textContent="";$("simulationDialog").showModal();
  }
  async function saveSimulation(e){
    e.preventDefault();const id=$("simulationId").value;const payload={title:$("simulationTitle").value.trim(),topic_id:$("simulationTopic").value||null,status:$("simulationStatus").value,question:$("simulationQuestion").value.trim(),assumptions:$("simulationAssumptions").value.trim(),variables:$("simulationVariables").value.trim(),results:$("simulationResults").value.trim(),link:$("simulationLink").value.trim()||null,user_id:user.id};
    await persist("simulations",id,payload,"Modelo guardado",r=>{if(id)data.simulations=data.simulations.map(x=>x.id===id?r:x);else data.simulations.unshift(r);$("simulationDialog").close();renderSimulations();renderDashboard();});
  }
  async function simulationAction(e){
    const b=e.target.closest("[data-action]");if(!b)return;const s=data.simulations.find(x=>x.id===b.dataset.id);if(!s)return;
    if(b.dataset.action==="edit-sim")openSimulation(s);
    if(b.dataset.action==="delete-sim"&&confirm("¿Eliminar este registro de simulación?"))await removeRecord("simulations",s.id,()=>{data.simulations=data.simulations.filter(x=>x.id!==s.id);renderSimulations();renderDashboard();});
  }
  async function persist(table,id,payload,success,callback){
    if(!user)return;setSave("Guardando…");
    try{let q=id?supabase.from(table).update(payload).eq("id",id):supabase.from(table).insert(payload);const {data:result,error}=await q.select().single();if(error)throw error;callback(result);setSave("Cambios sincronizados");toast(success);}
    catch(err){console.error(err);setSave("Error al guardar");toast("No se pudo guardar: "+(err.message||"error de conexión"));}
  }
  async function removeRecord(table,id,callback){
    setSave("Guardando…");try{const {error}=await supabase.from(table).delete().eq("id",id);if(error)throw error;callback();setSave("Cambios sincronizados");toast("Registro eliminado");}catch(err){setSave("Error al guardar");toast("No se pudo eliminar: "+err.message);}
  }
  init();
})();