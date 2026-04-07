import { Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { assetUrl, formatDate, formatDateTime, formatNumber, joinClasses } from '../utils';

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[160px,1fr] gap-3 py-2 text-sm">
      <div className="text-slate-400">{label}</div>
      <div className="text-slate-100">{value || '—'}</div>
    </div>
  );
}

function BoolPill({ value }) {
  return (
    <span className={joinClasses('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', value ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300')}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

export function RecordDrawer() {
  const { drawerOpen, drawerLoading, drawerRecord, drawerError, closeDrawer } = useApp();

  if (!drawerOpen) return null;

  const record = drawerRecord || {};
  const isMissing = record.record_type === 'missing_person';
  const photo = assetUrl(record.profile_photo || record.photo_path);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80">
      <div className="absolute inset-y-0 right-0 w-full max-w-4xl overflow-y-auto border-l border-slate-700 bg-navy-900 shadow-soft">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Case record</div>
            <h2 className="font-heading text-xl font-semibold text-white">{record.pid || 'Record details'}</h2>
          </div>
          <button type="button" onClick={closeDrawer} className="rounded-md border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {drawerLoading ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-6 text-slate-300">Loading record...</div>
          ) : drawerError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">{drawerError}</div>
          ) : (
            <>
              {photo ? (
                <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                  <img src={photo} alt={record.pid || 'Case photo'} className="h-80 w-full object-cover" />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-sm text-teal-300">{record.pid || '—'}</span>
                <span className={joinClasses('rounded-full px-3 py-1 text-xs font-medium', record.status === 'Closed' ? 'bg-slate-700 text-slate-200' : record.status === 'Deceased' ? 'bg-red-500/15 text-red-200' : 'bg-amber-500/15 text-amber-200')}>
                  {record.status || 'Open'}
                </span>
                {isMissing ? null : <span className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-medium text-teal-200">UIDB</span>}
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
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">DNA</div>
                      <BoolPill value={Boolean(record.dna_sample_collected)} />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Dental</div>
                      <BoolPill value={Boolean(record.dental_records_available)} />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Fingerprints</div>
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

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
                <div className="text-sm text-slate-400">Vector and case details are available for this record.</div>
                <button type="button" onClick={() => navigator.clipboard.writeText(record.pid || '')} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500">
                  <Copy className="h-4 w-4" />
                  Copy PID
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
