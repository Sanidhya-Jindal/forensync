export function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-700 bg-slate-800/90 p-5 ${className}`}>
      {(title || subtitle) ? (
        <div className="mb-4">
          {title ? <h3 className="font-heading text-base font-semibold text-white">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-200">{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${props.className || ''}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${props.className || ''}`} />;
}

export function Select(props) {
  return <select {...props} className={`w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${props.className || ''}`} />;
}

export function ToggleSwitch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-left transition hover:border-slate-600"
    >
      <span className="text-sm text-slate-200">{label}</span>
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-teal-600' : 'bg-slate-700'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}

export function DualRange({ label, min, max, value, onChange, unit = '', hint }) {
  const lower = Number(value[0]);
  const upper = Number(value[1]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="font-mono text-xs text-slate-400">
          {lower}{unit ? ` ${unit}` : ''} - {upper}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="relative py-2">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-700" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-teal-500" style={{ left: `${((lower - min) / (max - min)) * 100}%`, right: `${100 - ((upper - min) / (max - min)) * 100}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={lower}
          onChange={(event) => onChange([Math.min(Number(event.target.value), upper), upper])}
          className="pointer-events-auto relative z-10 h-1 w-full appearance-none bg-transparent accent-teal-500"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={upper}
          onChange={(event) => onChange([lower, Math.max(Number(event.target.value), lower)])}
          className="pointer-events-auto relative z-10 -mt-1 h-1 w-full appearance-none bg-transparent accent-teal-500"
        />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function FileDropzone({ label, file, onFileChange, accept = 'image/jpeg,image/png', required = false, previewUrl, hint }) {
  const preview = previewUrl || (file ? URL.createObjectURL(file) : '');

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">{label}{required ? ' *' : ''}</label>
      <div className="rounded-lg border-2 border-dashed border-slate-700 bg-slate-900 p-4 transition hover:border-slate-500">
        <input
          type="file"
          accept={accept}
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-500"
        />
        {preview ? (
          <div className="overflow-hidden rounded-md border border-slate-700 bg-slate-950">
            <img src={preview} alt="Upload preview" className="h-64 w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-sm text-slate-500">
            Drag and drop or browse for a file
          </div>
        )}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
