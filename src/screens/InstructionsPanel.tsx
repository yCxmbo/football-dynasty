import { INSTRUCTION_OPTIONS, PHASES, withDefaults, type Instructions } from '../engine/instructions';

/** Instructions grouped by phase. `compact` (during a match) shows only `keys` and leaves out explanations. */
export default function InstructionsPanel({ value, onChange, compact, keys }: { value?: Partial<Instructions>; onChange: (change: Partial<Instructions>) => void; compact?: boolean; keys?: Array<keyof Instructions> }) {
  const v = withDefaults(value);
  const shown = INSTRUCTION_OPTIONS.filter((o) => !keys || keys.includes(o.key));
  const row = (o: (typeof INSTRUCTION_OPTIONS)[number]) => {
    const cur = o.options.find((x) => x.value === v[o.key]);
    return (
      <div key={o.key} className="instr__row">
        <span className="pg-h instr__label">{o.label}</span>
        <div className="fd-seg" role="radiogroup" aria-label={o.label}>
          {o.options.map((x) => (
            <button key={x.value} type="button" role="radio" aria-checked={v[o.key] === x.value} title={x.desc}
              className={'fd-seg__opt' + (v[o.key] === x.value ? ' is-on' : '')} onClick={() => onChange({ [o.key]: x.value } as Partial<Instructions>)}>{x.label}</button>
          ))}
        </div>
        {!compact && cur ? <span className="hm-note instr__desc">{cur.desc}</span> : null}
      </div>
    );
  };
  if (compact) return <div className="instr instr--compact">{shown.map(row)}</div>;
  return (
    <div className="instr-phases">
      {PHASES.map((ph) => {
        const list = shown.filter((o) => o.phase === ph);
        if (!list.length) return null;
        return (
          <div key={ph} className={'instr-phase' + (ph === 'Mentality' ? ' instr-phase--wide' : '')}>
            {ph !== 'Mentality' ? <h3 className="instr-phase__title">{ph}</h3> : null}
            <div className="instr">{list.map(row)}</div>
          </div>
        );
      })}
    </div>
  );
}
