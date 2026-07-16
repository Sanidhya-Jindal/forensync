export function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card-warp p-5 ${className}`} style={{ animation: 'none' }}>
      {(title || subtitle) ? (
        <div className="mb-4">
          {title ? <h3 className="text-base font-semibold text-white">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-secondary">{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

export function TextInput({ className = '', ...props }) {
  return <input {...props} className={`input-warp ${className}`} />;
}

export function TextArea({ className = '', ...props }) {
  return <textarea {...props} className={`input-warp ${className}`} style={{ minHeight: '6rem', ...(props.style || {}) }} />;
}

export function Select({ className = '', ...props }) {
  return <select {...props} className={`input-warp ${className}`} />;
}

export function ToggleSwitch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <span className="text-sm text-secondary">{label}</span>
      <span className="relative inline-flex h-6 w-11 items-center rounded-full transition"
            style={{ background: checked ? 'var(--accent)' : 'var(--border-strong)' }}>
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
        <span className="text-sm font-medium text-secondary">{label}</span>
        <span className="font-mono text-xs text-muted">
          {lower}{unit ? ` ${unit}` : ''} - {upper}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="relative py-2">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ background: 'var(--border-strong)' }} />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
             style={{ background: 'var(--accent)', left: `${((lower - min) / (max - min)) * 100}%`, right: `${100 - ((upper - min) / (max - min)) * 100}%` }} />
        <input
          type="range" min={min} max={max} value={lower}
          onChange={(event) => onChange([Math.min(Number(event.target.value), upper), upper])}
          className="pointer-events-auto relative z-10 h-1 w-full appearance-none bg-transparent"
          style={{ accentColor: 'var(--accent)' }}
        />
        <input
          type="range" min={min} max={max} value={upper}
          onChange={(event) => onChange([lower, Math.max(Number(event.target.value), lower)])}
          className="pointer-events-auto relative z-10 -mt-1 h-1 w-full appearance-none bg-transparent"
          style={{ accentColor: 'var(--accent)' }}
        />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function FileDropzone({ label, file, onFileChange, accept = 'image/jpeg,image/png', required = false, previewUrl, hint }) {
  const preview = previewUrl || (file ? URL.createObjectURL(file) : '');

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-secondary">{label}{required ? ' *' : ''}</label>
      <div className="rounded-lg border-2 border-dashed p-4 transition"
           style={{ borderColor: 'var(--border-strong)', background: 'var(--bg-secondary)' }}>
        <input
          type="file"
          accept={accept}
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm text-secondary"
        />
        {preview ? (
          // object-contain so the whole photo is visible (object-cover zoom-crops faces)
          <div className="flex items-center justify-center overflow-hidden rounded-md"
               style={{ border: '1px solid var(--border)', background: '#000', maxHeight: '16rem' }}>
            <img src={preview} alt="Upload preview" className="max-h-64 w-auto max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md text-sm text-muted"
               style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
            Drag and drop or browse for a file
          </div>
        )}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
