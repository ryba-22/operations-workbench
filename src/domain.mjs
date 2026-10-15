/** Domain rules operate on strings YYYY-MM-DD and 24-hour HH:mm. No timezone conversion. */
export const minutes = hhmm => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) throw new Error(`Invalid time: ${hhmm}`);
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const overlaps = (a, b) => minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end);
export const active = session => session.status !== 'cancelled';
export const issuesFor = (session, sessions) => {
  if (!active(session)) return [];
  const issues = [];
  for (const other of sessions) {
    if (session.id === other.id || !active(other) || session.date !== other.date || !overlaps(session, other)) continue;
    if (session.room === other.room) issues.push({type:'room', with:other.id, message:`Sala zajęta przez ${other.title}`});
    if (session.facilitator === other.facilitator) issues.push({type:'facilitator', with:other.id, message:`Prowadzący zajęty przy ${other.title}`});
  }
  return issues;
};
export function updateSession(sessions, id, patch) {
  const source = sessions.find(x => x.id === id);
  if (!source) throw new Error('Nie znaleziono sesji');
  // Changes intentionally scoped to room/status. Editing time would require a different workflow.
  if (Object.keys(patch).some(key => !['room','status'].includes(key))) throw new Error('Niedozwolona zmiana');
  const replacement = {...source, ...patch};
  if (!['planned','completed','cancelled'].includes(replacement.status)) throw new Error('Nieznany status');
  if (!replacement.room) throw new Error('Sala jest wymagana');
  if (minutes(replacement.start) >= minutes(replacement.end)) throw new Error('Przedział czasu jest nieprawidłowy');
  const next = sessions.map(x => x.id === id ? replacement : x);
  const prior = issuesFor(source, sessions);
  const current = issuesFor(replacement, next);
  // Existing conflicts may be repaired, but no change may add or introduce a different conflict.
  const priorKeys = new Set(prior.map(i => `${i.type}:${i.with}`));
  const added = current.filter(i => !priorKeys.has(`${i.type}:${i.with}`));
  if (added.length) throw new Error(added.map(i => i.message).join(' · '));
  return next;
}
export function summary(sessions) {
  const activeSessions = sessions.filter(active);
  return {
    scheduled: activeSessions.length,
    completed: sessions.filter(x => x.status === 'completed').length,
    cancelled: sessions.filter(x => x.status === 'cancelled').length,
    conflicts: activeSessions.filter(x => issuesFor(x, sessions).length > 0).length,
  };
}
export function weekday(iso) {
  // ISO local calendar date interpreted at noon UTC, avoiding midnight timezone shift.
  const days = ['Ndz','Pon','Wt','Śr','Czw','Pt','Sob'];
  return days[new Date(`${iso}T12:00:00Z`).getUTCDay()];
}
