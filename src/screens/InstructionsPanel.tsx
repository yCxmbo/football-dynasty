import { DEFAULT_INSTRUCTIONS, INSTRUCTION_OPTIONS, type Instructions } from '../engine/instructions';

/** Five segmented choices. `compact` (during a match) leaves out the explanations. */
export default function InstructionsPanel({ value = DEFAULT_INSTRUCTIONS, onChange, compact }: { value?: Instructions; onChange: (change: Partial<Instructions>) => void; compact?: boolean }) {
  return (
    <div className={'instr' + (compact ? ' instr--compact' : '')}>
      {INSTRUCTION_OPTIONS.map((o) => {
        const cur = o.options.find((x) => x.value === value[o.key]);
        return (
          <div key={o.key} className="instr__row">
            <span className="pg-h instr__label">{o.label}</span>
            <div className="fd-seg" role="radiogroup" aria-label={o.label}>
              {o.options.map((x) => (
                <button key={x.value} type="button" role="radio" aria-checked={value[o.key] === x.value} title={x.desc}
                  className={'fd-seg__opt' + (value[o.key] === x.value ? ' is-on' : '')} onClick={() => onChange({ [o.key]: x.value } as Partial<Instructions>)}>{x.label}</button>
              ))}
            </div>
            {!compact && cur ? <span className="hm-note instr__desc">{cur.desc}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
