(function(){
  // Tabs switching + hash sync
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const panels = Array.from(document.querySelectorAll('[data-panel]'));
  if(tabs.length){
    function show(tabKey){
      tabs.forEach(t=>{
        const active = t.getAttribute('data-tab')===tabKey;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active? 'true':'false');
      });
      panels.forEach(p=>{
        const on = p.getAttribute('data-panel')===tabKey;
        p.style.display = on? 'block':'none';
      });
      if(location.hash !== '#'+tabKey){
        history.replaceState(null,'','#'+tabKey);
      }
    }
    tabs.forEach(t=> t.addEventListener('click', ()=> show(t.getAttribute('data-tab'))));
    const initial = location.hash ? location.hash.slice(1) : 'vlan';
    show(['vlan','ip','calc','dhcp'].includes(initial)? initial : 'vlan');
  }
})();

(function(){
  const vlanSelects = {
    A: document.getElementById('vlanA'),
    B: document.getElementById('vlanB'),
    C: document.getElementById('vlanC'),
    D: document.getElementById('vlanD'),
  };
  const allow10 = document.getElementById('allow10');
  const allow20 = document.getElementById('allow20');
  const labelTrunk = document.getElementById('labelTrunk');
  const labels = {
    A: document.getElementById('labelA'),
    B: document.getElementById('labelB'),
    C: document.getElementById('labelC'),
    D: document.getElementById('labelD'),
  };
  const tag = document.getElementById('tag');
  const tagText = document.getElementById('tagText');
  const path = document.getElementById('animPath');
  const ping10 = document.getElementById('ping10');
  const ping20 = document.getElementById('ping20');
  const pingCross = document.getElementById('pingCross');
  const trunk = document.getElementById('trunk');

  function trunkAllowed(vlan){
    if(vlan === '10') return allow10.checked;
    if(vlan === '20') return allow20.checked;
    return false;
  }
  function updateLabels(){
    labels.A.textContent = 'VLAN ' + vlanSelects.A.value;
    labels.B.textContent = 'VLAN ' + vlanSelects.B.value;
    labels.C.textContent = 'VLAN ' + vlanSelects.C.value;
    labels.D.textContent = 'VLAN ' + vlanSelects.D.value;
    const allowed = [allow10.checked ? '10' : null, allow20.checked ? '20' : null].filter(Boolean);
    labelTrunk.textContent = 'Trunk 802.1Q: ' + (allowed.length? allowed.join(',') : '—');
    trunk.style.opacity = allowed.length? 1 : 0.3;
  }
  function setTagColor(vlan){
    tag.style.fill = vlan === '10'
      ? getComputedStyle(document.documentElement).getPropertyValue('--accent10')
      : getComputedStyle(document.documentElement).getPropertyValue('--accent20');
  }
  function animateTag(vlan, reverse=false){
    setTagColor(vlan);
    tagText.textContent = 'VLAN ' + vlan;
    tag.classList.remove('hidden');
    tagText.classList.remove('hidden');
    const total = path.getTotalLength();
    const startTime = performance.now();
    const duration = 1200;
    function frame(now){
      const t = Math.min((now - startTime) / duration, 1);
      const len = reverse ? total - t*total : t*total;
      const p = path.getPointAtLength(len);
      tag.setAttribute('cx', p.x);
      tag.setAttribute('cy', p.y);
      tagText.setAttribute('x', p.x + 12);
      tagText.setAttribute('y', p.y - 8);
      if(t < 1) requestAnimationFrame(frame); else { tag.classList.add('hidden'); tagText.classList.add('hidden'); }
    }
    requestAnimationFrame(frame);
  }
  function canPing(vlan, from, to){
    if(vlanSelects[from].value !== vlan) return false;
    if(vlanSelects[to].value !== vlan) return false;
    return trunkAllowed(vlan);
  }
  function simulatePing(vlan, from, to){
    const ok = canPing(vlan, from, to);
    if(ok){ animateTag(vlan, false); toast('Ping thành công: ' + from + ' → ' + to, true); }
    else { toast('Ping thất bại (khác VLAN hoặc trunk chặn): ' + from + ' → ' + to, false); }
  }
  function toast(msg, success){
    let t = document.createElement('div');
    t.textContent = msg;
    t.style.position = 'fixed';
    t.style.bottom = '16px';
    t.style.right = '16px';
    t.style.background = success ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
    t.style.color = '#fff';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '8px';
    t.style.zIndex = '1000';
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); }, 1600);
  }
  Object.values(vlanSelects).forEach(sel => sel.addEventListener('change', updateLabels));
  allow10.addEventListener('change', updateLabels);
  allow20.addEventListener('change', updateLabels);
  ping10.addEventListener('click', () => simulatePing('10','A','B'));
  ping20.addEventListener('click', () => simulatePing('20','C','D'));
  pingCross.addEventListener('click', () => {
    const same = vlanSelects.A.value === vlanSelects.C.value;
    if(same && trunkAllowed(vlanSelects.A.value)){
      animateTag(vlanSelects.A.value, false);
      toast('Cùng VLAN nên có thể thông, nhưng đây là kiểm thử khác VLAN.', true);
    } else {
      toast('Ping thất bại (khác VLAN): A → C', false);
    }
  });
  updateLabels();
})();

// IPv4 calculator
(function(){
  const ipEl = document.getElementById('ip-input');
  const maskEl = document.getElementById('mask-input');
  const btn = document.getElementById('calc-btn');
  if(!ipEl || !maskEl || !btn) return;

  const o = {
    network: document.getElementById('o-network'),
    broadcast: document.getElementById('o-broadcast'),
    range: document.getElementById('o-range'),
    hosts: document.getElementById('o-hosts'),
    cidr: document.getElementById('o-cidr'),
    mask: document.getElementById('o-mask'),
    scope: document.getElementById('o-scope'),
  };

  function parseIPv4(ip){
    const parts = ip.trim().split('.').map(Number);
    if(parts.length!==4 || parts.some(n=> Number.isNaN(n) || n<0 || n>255)) return null;
    return (parts[0]<<24)>>>0 | (parts[1]<<16) | (parts[2]<<8) | parts[3];
  }
  function intToIPv4(x){
    return [x>>>24 & 255, x>>>16 & 255, x>>>8 & 255, x & 255].join('.');
  }
  function parseMask(mask){
    const m = mask.trim();
    if(m.startsWith('/')){
      const cidr = Number(m.slice(1));
      if(!(cidr>=0 && cidr<=32)) return null;
      const maskInt = cidr===0?0: (~0 << (32-cidr))>>>0;
      return { cidr, maskInt };
    }
    const asInt = parseIPv4(m);
    if(asInt==null) return null;
    // validate contiguous ones
    const inv = (~asInt)>>>0;
    if(((inv+1) & inv)!==0) return null; // not contiguous zeros
    const cidr = 32 - Math.clz32(asInt);
    return { cidr, maskInt: asInt };
  }
  function isPrivate(ipInt){
    const a = ipInt>>>24;
    const b = ipInt>>>16 & 255;
    if(a===10) return true;
    if(a===172 && b>=16 && b<=31) return true;
    if(a===192 && (ipInt>>>16 & 65535)=== (192<<8 | 168)) return true;
    return false;
  }
  function calc(){
    const ipInt = parseIPv4(ipEl.value);
    const maskObj = parseMask(maskEl.value);
    if(ipInt==null || maskObj==null){
      o.network.textContent = o.broadcast.textContent = o.range.textContent = 'Không hợp lệ';
      o.hosts.textContent = o.cidr.textContent = o.mask.textContent = o.scope.textContent = '—';
      return;
    }
    const { cidr, maskInt } = maskObj;
    const network = ipInt & maskInt;
    const broadcast = network | (~maskInt >>> 0);
    const usableHosts = cidr===31?0: cidr===32?0: Math.max(0, (1<<(32-cidr)) - 2);
    const firstUsable = cidr>=31? network : network + 1;
    const lastUsable = cidr>=31? broadcast : broadcast - 1;

    o.network.textContent = intToIPv4(network);
    o.broadcast.textContent = intToIPv4(broadcast);
    o.range.textContent = usableHosts? `${intToIPv4(firstUsable)} - ${intToIPv4(lastUsable)}` : 'Không có (/<31)';
    o.hosts.textContent = String(usableHosts);
    o.cidr.textContent = `/${cidr}`;
    o.mask.textContent = intToIPv4(maskInt);
    o.scope.textContent = isPrivate(ipInt) ? 'Private' : 'Public';
  }
  btn.addEventListener('click', calc);
  calc();
})();

// DHCP demo: assign IPs based on VLAN selections
(function(){
  const dhcpBtn = document.getElementById('dhcp-assign');
  const clearBtn = document.getElementById('dhcp-clear');
  const leaseOut = {
    A: document.getElementById('ipA'),
    B: document.getElementById('ipB'),
    C: document.getElementById('ipC'),
    D: document.getElementById('ipD'),
  };
  if(!dhcpBtn || !clearBtn) return;

  const pools = {
    '10': { base: [192,168,10,10], nextHost: 10 },
    '20': { base: [192,168,20,10], nextHost: 10 },
  };

  const vlanOf = {
    A: document.getElementById('vlanA'),
    B: document.getElementById('vlanB'),
    C: document.getElementById('vlanC'),
    D: document.getElementById('vlanD'),
  };

  const leases = { A:null, B:null, C:null, D:null };

  function alloc(vlan){
    const p = pools[vlan];
    const host = p.nextHost++;
    if(host>=250) return null; // simple guard
    return `${p.base[0]}.${p.base[1]}.${p.base[2]}.${host}`;
  }
  function updateLeaseUI(){
    Object.keys(leases).forEach(k=>{
      leaseOut[k].textContent = leases[k] || '—';
    });
  }
  function clearForChangedVLAN(key){
    leases[key] = null;
    updateLeaseUI();
  }
  // Clear lease on VLAN change for that PC
  Object.keys(vlanOf).forEach(k=>{
    vlanOf[k].addEventListener('change', ()=> clearForChangedVLAN(k));
  });

  dhcpBtn.addEventListener('click', ()=>{
    ['A','B','C','D'].forEach(k=>{
      if(!leases[k]){
        const vlan = vlanOf[k].value;
        leases[k] = alloc(vlan);
      }
    });
    updateLeaseUI();
  });
  clearBtn.addEventListener('click', ()=>{
    Object.keys(leases).forEach(k=> leases[k]=null);
    // reset pools
    pools['10'].nextHost = 10;
    pools['20'].nextHost = 10;
    updateLeaseUI();
  });
  updateLeaseUI();
})();

// Help Desk tab interactions (flashcards + notes persistence)
(function(){
  const cards = Array.from(document.querySelectorAll('#helpdesk .flash'));
  const notes = document.getElementById('hd-notes');
  if(!document.getElementById('helpdesk')) return;
  cards.forEach(c => c.addEventListener('click', ()=> c.classList.toggle('flipped')));
  const KEY = 'hd-notes';
  try{ const saved = localStorage.getItem(KEY); if(saved) notes.value = saved; }catch{}
  notes && notes.addEventListener('input', ()=>{
    try{ localStorage.setItem(KEY, notes.value); }catch{}
  });

  // Shuffle, Quiz, Export
  const shuffleBtn = document.getElementById('hd-shuffle');
  const quizBtn = document.getElementById('hd-quiz');
  const exportBtn = document.getElementById('hd-export');
  const progress = document.getElementById('hd-progress');
  const quizArea = document.getElementById('hd-quiz-area');
  const quizQ = document.getElementById('quiz-q');
  const quizA = document.getElementById('quiz-a');
  const quizShow = document.getElementById('quiz-show');
  const quizNext = document.getElementById('quiz-next');

  function shuffleCards(){
    const grid = document.querySelector('#helpdesk .flash-grid');
    const arr = Array.from(grid.children);
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      grid.appendChild(arr[j]);
      arr.splice(j,1);
    }
  }
  shuffleBtn && shuffleBtn.addEventListener('click', shuffleCards);

  let quizIndex = 0;
  let qa = [];
  function buildQA(){
    qa = Array.from(document.querySelectorAll('#helpdesk .flash')).map(el=>({
      q: el.querySelector('.front').textContent.trim(),
      a: el.querySelector('.back').innerHTML.trim(),
    }));
  }
  function startQuiz(){
    buildQA();
    if(qa.length===0) return;
    quizIndex = 0;
    quizArea.style.display = 'block';
    showQuiz();
  }
  function showQuiz(){
    const item = qa[quizIndex];
    quizQ.textContent = item.q;
    quizA.style.display = 'none';
    quizA.innerHTML = item.a;
    progress.textContent = `Câu ${quizIndex+1}/${qa.length}`;
  }
  function nextQuiz(){
    quizIndex = (quizIndex + 1) % qa.length;
    showQuiz();
  }
  quizBtn && quizBtn.addEventListener('click', startQuiz);
  quizShow && quizShow.addEventListener('click', ()=> quizA.style.display = 'block');
  quizNext && quizNext.addEventListener('click', nextQuiz);

  exportBtn && exportBtn.addEventListener('click', ()=>{
    const blob = new Blob([notes.value || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'helpdesk-notes.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
})();

// Matching game: drag answers to questions
(function(){
  const area = document.getElementById('hd-match');
  if(!area) return;
  const drags = Array.from(area.querySelectorAll('.drag'));
  const drops = Array.from(area.querySelectorAll('.drop'));
  const scoreEl = document.getElementById('match-score');
  const resetBtn = document.getElementById('match-reset');
  function updateScore(){
    const ok = drops.filter(d=> d.classList.contains('ok')).length;
    scoreEl.textContent = `Đúng ${ok}/${drops.length}`;
  }
  function clearStates(){
    drops.forEach(d=>{ d.classList.remove('ok','bad'); d.textContent = d.getAttribute('data-key')==='good'? 'What makes a good Help Desk employee?'
      : d.getAttribute('data-key')==='cant'? "Issue you can't resolve/understand?"
      : d.getAttribute('data-key')==='frustrated'? 'Frustrated customer – what do you do?'
      : 'Conflict example and resolution';
    });
    const rightCol = area.querySelectorAll('.match-col')[1];
    drags.forEach(el=> rightCol.appendChild(el));
    updateScore();
  }
  drags.forEach(el=>{
    el.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', el.getAttribute('data-key'));
      e.dataTransfer.effectAllowed = 'move';
    });
  });
  drops.forEach(el=>{
    el.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    el.addEventListener('drop', e=>{
      e.preventDefault();
      const key = e.dataTransfer.getData('text/plain');
      if(key === el.getAttribute('data-key')){
        el.classList.remove('bad');
        el.classList.add('ok');
        const dragged = area.querySelector(`.drag[data-key="${key}"]`);
        if(dragged){ el.textContent = dragged.textContent; dragged.remove(); }
      } else {
        el.classList.add('bad');
        setTimeout(()=> el.classList.remove('bad'), 700);
      }
      updateScore();
    });
  });
  resetBtn && resetBtn.addEventListener('click', clearStates);
  updateScore();
})();

// Journey mode: guided tour across tabs with typewriter text
(function(){
  const jText = document.getElementById('journey-text');
  if(!jText) return;
  const jPrev = document.getElementById('j-prev');
  const jNext = document.getElementById('j-next');
  const jPlay = document.getElementById('j-play');
  const jPause = document.getElementById('j-pause');
  const jAuto = document.getElementById('j-auto');
  const jStep = document.getElementById('j-step');
  const jBar = document.getElementById('journey-progress-bar');
  const steps = [
    { tab:'vlan', text:'VLAN là “phòng” trong toà nhà mạng. Access Port = cửa vào 1 phòng. Trunk = hành lang mang nhiều phòng với nhãn 802.1Q.' },
    { tab:'ip', text:'Địa chỉ IP như số nhà. DHCP là văn phòng địa chính: cấp số nhà tự động, không trùng.' },
    { tab:'calc', text:'CIDR / Subnet mask quyết định phạm vi mạng. Nhập IP + /mask để thấy Network, Broadcast, Usable range.' },
    { tab:'dhcp', text:'Hãy thử cấp IP tự động theo VLAN. Đổi VLAN sẽ mất lease cho tới khi cấp lại.' },
    { tab:'helpdesk', text:'Ôn phỏng vấn: lật flashcards, làm quiz, và kéo‑thả matching để luyện phản xạ.' },
  ];
  let i = 0, playing = false, typer = null;

  function switchTab(tab){
    const btn = document.querySelector(`.tab[data-tab="${tab}"]`);
    btn && btn.click();
  }
  function type(str){
    if(typer) cancelAnimationFrame(typer);
    jText.textContent = '';
    let idx = 0;
    const speed = 18; // ms/char
    function frame(now){
      jText.textContent = str.slice(0, idx);
      if(idx < str.length){ idx++; typer = requestAnimationFrame(frame); }
      else typer = null;
    }
    typer = requestAnimationFrame(frame);
  }
  function show(){
    const step = steps[i];
    switchTab(step.tab);
    type(step.text);
    jStep.textContent = `${i+1}/${steps.length}`;
    jBar.style.width = `${Math.round(((i+1)/steps.length)*100)}%`;
  }
  function next(){ i = (i+1)%steps.length; show(); }
  function prev(){ i = (i-1+steps.length)%steps.length; show(); }
  let timer = null;
  function play(){
    if(playing) return; playing = true; jPlay.disabled = true; jPause.disabled = false;
    show();
    timer = setInterval(()=>{ next(); if(!jAuto.checked){ pause(); } }, 6000);
  }
  function pause(){ playing = false; jPlay.disabled = false; jPause.disabled = true; if(timer) clearInterval(timer); }

  jNext.addEventListener('click', ()=>{ pause(); next(); });
  jPrev.addEventListener('click', ()=>{ pause(); prev(); });
  jPlay.addEventListener('click', play);
  jPause.addEventListener('click', pause);
})();

// Answer Builder: good Help Desk employee
(function(){
  const genBtn = document.getElementById('ab-generate');
  const copyBtn = document.getElementById('ab-copy');
  const out = document.getElementById('ab-output');
  const example = document.getElementById('ab-example');
  if(!genBtn) return;
  function build(){
    const opts = Array.from(document.querySelectorAll('.ab-opt:checked')).map(x=>x.value);
    const parts = [];
    if(opts.includes('listen')) parts.push('I actively listen to understand the context and diagnose accurately.');
    if(opts.includes('explain')) parts.push('I communicate clearly and concisely, setting expectations and next steps.');
    if(opts.includes('patience')) parts.push('I stay patient, empathetic, and professional under pressure.');
    const ex = (example && example.value.trim()) ? ' For example: ' + example.value.trim() : '';
    const answer = parts.length ? parts.join(' ') + ex : 'Select at least one quality to generate an answer.';
    out.textContent = answer;
    copyBtn.disabled = !parts.length;
  }
  genBtn.addEventListener('click', build);
  copyBtn && copyBtn.addEventListener('click', ()=>{
    navigator.clipboard.writeText(out.textContent || '').then(()=>{
      copyBtn.textContent = 'Copied!';
      setTimeout(()=> copyBtn.textContent = 'Copy', 1200);
    }).catch(()=>{});
  });
})();
