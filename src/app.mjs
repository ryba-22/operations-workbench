import {sessions as seed, rooms} from './data.mjs';
import {issuesFor, updateSession, summary, weekday} from './domain.mjs';

let sessions = seed.map(x => ({...x}));
let editing = null;
const $ = sel => document.querySelector(sel);
const root = $('#sessionRows');
const statusNames = {planned:'Zaplanowane',completed:'Odbyte',cancelled:'Odwołane'};
const format = iso => new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z'));
const escapeHtml = input => String(input).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

function render() {
  const filter = $('#dayFilter').value;
  const query = $('#search').value.trim().toLocaleLowerCase('pl-PL');
  const entries = sessions.filter(x => (filter === 'all' || x.date === filter) &&
      `${x.title} ${x.group} ${x.facilitator} ${x.room}`.toLocaleLowerCase('pl-PL').includes(query));
  const s = summary(sessions);
  $('#scheduledCount').textContent = s.scheduled;
  $('#completedCount').textContent = s.completed;
  $('#conflictCount').textContent = s.conflicts;
  $('#rowCount').textContent = `${entries.length} pozycji`;
  $('#issueCount').textContent = s.conflicts ? `${s.conflicts} sesje wymagają decyzji` : 'Brak konfliktów w aktualnym planie';
  $('#issueCount').classList.toggle('alert',s.conflicts>0);
  root.replaceChildren();
  for(const session of entries) {
    const issues = issuesFor(session,sessions);
    const row = document.createElement('tr');
    if(issues.length) row.className='needs-review';
    row.innerHTML = `<td><span class="date-strong">${weekday(session.date)}</span><span class="date-muted">${format(session.date)}</span></td>
      <td><span class="time-strong">${escapeHtml(session.start)}–${escapeHtml(session.end)}</span></td>
      <td><strong>${escapeHtml(session.title)}</strong><small>${escapeHtml(session.group)}</small></td>
      <td>${escapeHtml(session.facilitator)}</td><td>${escapeHtml(session.room)}</td>
      <td><span class="state ${session.status}">${statusNames[session.status]}</span></td>
      <td>${issues.length ? `<span class="conflict" title="${escapeHtml(issues.map(i=>i.message).join(' · '))}">● Konflikt</span>` : '<span class="fine">—</span>'}</td>
      <td class="last"><button class="action" type="button" data-edit="${escapeHtml(session.id)}" aria-label="Edytuj: ${escapeHtml(session.title)}">Zmień ↗</button></td>`;
    root.appendChild(row);
  }
  $('#empty').hidden = entries.length>0;
}
function openEditor(id) {
  const session = sessions.find(x=>x.id===id);
  if (!session) return;
  editing = id;
  $('#editTitle').textContent = session.title;
  $('#editMeta').textContent = `${weekday(session.date)} ${format(session.date)} · ${session.start}–${session.end} · ${session.facilitator}`;
  $('#roomEdit').replaceChildren(...rooms.map(room => {
    const option=document.createElement('option'); option.value=room;option.textContent=room;option.selected=room===session.room;return option;
  }));
  $('#statusEdit').value=session.status;
  $('#editError').hidden=true;
  $('#editDialog').showModal();
}
root.addEventListener('click',event=>{const btn=event.target.closest('[data-edit]'); if(btn)openEditor(btn.dataset.edit);});
$('#dayFilter').addEventListener('change',render);
$('#search').addEventListener('input',render);
$('#resetDemo').addEventListener('click',()=>{sessions=seed.map(x=>({...x}));$('#search').value='';$('#dayFilter').value='all';render();$('#feedback').textContent='Przywrócono dane demonstracyjne.';});
$('#closeEdit').addEventListener('click',()=>$('#editDialog').close());
$('#editForm').addEventListener('submit', event=>{
  event.preventDefault();
  try {
    sessions=updateSession(sessions,editing,{room:$('#roomEdit').value,status:$('#statusEdit').value});
    $('#editDialog').close();
    $('#feedback').textContent='Zmiana zaakceptowana przez reguły planu. Stan nie jest zapisywany na serwerze.';
    render();
  } catch(error) {
    $('#editError').hidden=false;
    $('#editError').textContent=error.message;
  }
});
render();
