import { useEffect } from 'react';
import { Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { assetUrl, formatDate, formatDateTime, joinClasses } from '../utils';

function Section({ title, children }) {
  return (
    <section className="rounded-lg p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[150px,1fr] gap-3 py-2 text-sm">
      <div className="text-muted">{label}</div>
      <div style={{ color: 'var(--text)' }}>{value || '—'}</div>
    </div>
  );
}

function BoolPill({ value }) {
  return (
    <span className={joinClasses('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', value ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-muted')}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

export default function RecordDrawer() {
  const { drawerOpen, drawerLoading, drawerRecord, drawerError, closeDrawer } = useApp();

  // Escape to close + lock background scroll while open
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const record = drawerRecord || {};
  const isMissing = record.record_type === 'missing_person';
  const photo = assetUrl(record.profile_photo || record.photo_path);

  return (
    // z-[60] so it sits ABOVE the fixed navbar (z-50) — otherwise the navbar
    // covered this panel's header and hid the close button.
    <div className="fixed inset-0 z-[60] animate-fade-in" role="dialog" aria-modal="true" aria-label="Case record details">
      {/* Click the backdrop to close */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={closeDrawer} />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col shadow-2xl"
           style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-strong)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 backdrop-blur"
             style={{ background: 'rgba(11,11,13,0.95)', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted">Case record</div>
            <h2 className="text-xl font-semibold text-white">{record.pid || 'Record details'}</h2>
          </div>
          <button type="button" onClick={closeDrawer} aria-label="Close record details"
                  className="btn-warp">
            <X className="h-4 w-4" /> Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 p-5">
          {drawerLoading ? (
            <div className="rounded-lg p-6 text-secondary" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>Loading record…</div>
          ) : drawerError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">{drawerError}</div>
          ) : (
            <>
              {photo ? (
                <div className="overflow-hidden rounded-lg flex items-center justify-center"
                     style={{ border: '1px solid var(--border)', background: '#000', maxHeight: '26rem' }}>
                  {/* object-contain: show the whole photo instead of zoom-cropping the face */}
                  <img src={photo} alt={`Case photo for ${record.pid || 'record'}`}
                       className="max-h-[26rem] w-auto max-w-full object-contain"
                       onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full px-3 py-1 font-mono text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)' }}>{record.pid || '—'}</span>
                <span className={joinClasses('rounded-full px-3 py-1 text-xs font-medium', record.status === 'Closed' ? 'bg-white/10 text-secondary' : record.status === 'Deceased' ? 'bg-red-500/15 text-red-200' : 'bg-amber-500/15 text-amber-200')}>
                  {record.status || 'Open'}
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {isMissing ? 'Missing Person' : 'Unidentified Body'}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Section title="Core Details">
                  <InfoRow label="Type" value={record.record_type || '—'} />
                  <InfoRow label="Gender" value={record.gender} />
                  <InfoRow label={isMissing ? 'Age' : 'Estimated Age'} value={record.age || record.estimated_age} />
                  <InfoRow label="Height" value={record.height_cm ? `${record.height_cm} cm` : '—'} />
                  <InfoRow label="Build" value={record.build} />
                  <InfoRow label="Police Station" value={record.police_station} />
                </Section>

                <Section title="Timeline">
                  <InfoRow label={isMissing ? 'Reported Date' : 'Found Date'} value={formatDateTime(record.reported_date || record.found_date)} />
                  <InfoRow label="Last Seen" value={formatDateTime(record.last_seen_date)} />
                  <InfoRow label="Found Address" value={record.found_address} />
                  <InfoRow label="Last Seen Address" value={record.last_seen_address} />
                  <InfoRow label="Created" value={formatDate(record.created_at)} />
                  <InfoRow label="Updated" value={formatDate(record.updated_at)} />
                </Section>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Section title="Physical Description">
                  <InfoRow label="Hair" value={record.hair_color} />
                  <InfoRow label="Eye Color" value={record.eye_color} />
                  <InfoRow label="Complexion" value={record.complexion} />
                  <InfoRow label="Face Shape" value={record.face_shape} />
                  <InfoRow label="Distinguishing Marks" value={record.distinguishing_marks} />
                  <InfoRow label="Distinctive Features" value={record.distinctive_features} />
                </Section>

                <Section title="Clothing and Evidence">
                  <InfoRow label="Clothing" value={record.clothing_description} />
                  <InfoRow label="Jewelry" value={record.jewelry_description} />
                  <InfoRow label="Person Description" value={record.person_description} />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">DNA</div>
                      <BoolPill value={Boolean(record.dna_sample_collected)} />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">Dental</div>
                      <BoolPill value={Boolean(record.dental_records_available)} />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">Fingerprints</div>
                      <BoolPill value={Boolean(record.fingerprints_collected)} />
                    </div>
                  </div>
                </Section>
              </div>

              <Section title="Reporter and Contacts">
                <div className="grid gap-2 lg:grid-cols-2">
                  <InfoRow label="FIR Number" value={record.fir_number} />
                  <InfoRow label="Reporter Name" value={record.reporter_name} />
                  <InfoRow label="Reporter Contact" value={record.reporter_contact} />
                  <InfoRow label="Cause of Death" value={record.cause_of_death} />
                </div>
              </Section>

              <div className="flex flex-wrap items-center justify-end gap-3 rounded-lg px-4 py-3"
                   style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <button type="button" onClick={() => navigator.clipboard.writeText(record.pid || '')} className="btn-warp">
                  <Copy className="h-4 w-4" /> Copy PID
                </button>
                <button type="button" onClick={closeDrawer} className="btn-warp-primary">Close</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
