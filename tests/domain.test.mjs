import test from 'node:test';
import assert from 'node:assert/strict';
import {minutes,overlaps,issuesFor,updateSession,summary,weekday} from '../src/domain.mjs';
import {sessions,rooms} from '../src/data.mjs';

test('time intervals are half-open: adjacent sessions do not overlap',()=>{
  assert.equal(overlaps({start:'09:00',end:'10:00'},{start:'10:00',end:'11:00'}),false);
  assert.equal(overlaps({start:'09:00',end:'10:30'},{start:'10:00',end:'11:00'}),true);
});
test('invalid times fail instead of silently changing conflict rules',()=>assert.throws(()=>minutes('28:90')));
test('initial fixture contains one room collision (two affected sessions)',()=>{
  assert.equal(summary(sessions).conflicts,2);
  assert.equal(issuesFor(sessions.find(s=>s.id==='W-102'),sessions)[0].type,'room');
});
test('rescheduling into a free room fixes a conflict',()=>{
  const next=updateSession(sessions,'W-103',{room:'Sala Spotkań'});
  assert.equal(summary(next).conflicts,0);
  assert.equal(summary(sessions).conflicts,2); // immutable update
});
test('moving to occupied room is rejected without mutating state',()=>{
  const pair=[{id:'a',date:'2026-10-19',start:'09:00',end:'10:00',room:'R1',facilitator:'A',status:'planned'},
    {id:'b',date:'2026-10-19',start:'09:30',end:'10:30',room:'R2',facilitator:'B',status:'planned'}];
  assert.throws(()=>updateSession(pair,'b',{room:'R1'}),/Sala zajęta/);
  assert.equal(pair[1].room,'R2');
});
test('cancelled sessions do not block rooms',()=>{
  assert.equal(issuesFor(sessions.find(s=>s.id==='W-107'),sessions).length,0);
  assert.equal(issuesFor(sessions.find(s=>s.id==='W-108'),sessions).length,0);
});
test('a person cannot lead overlapping sessions in different rooms',()=>{
  const pair=[{id:'a',date:'2026-10-19',start:'09:00',end:'10:00',room:'R1',facilitator:'Someone',status:'planned'},
    {id:'b',date:'2026-10-19',start:'09:30',end:'10:30',room:'R2',facilitator:'Someone',status:'planned'}];
  assert.equal(issuesFor(pair[0],pair)[0].type,'facilitator');
});
test('no unsupported field may be patched',()=>assert.throws(()=>updateSession(sessions,'W-101',{facilitator:'Other'}),/Niedozwolona/));
test('valid status change can cancel a conflicted booking',()=>{
  const next=updateSession(sessions,'W-103',{status:'cancelled'});
  assert.equal(summary(next).conflicts,0);
  assert.equal(summary(next).cancelled,2);
});
test('weekdays are stable independent of browser timezone',()=>assert.equal(weekday('2026-10-19'),'Pon'));
test('fixture uses fictional rooms',()=>assert.equal(rooms.includes('Sala Beta'),true));
