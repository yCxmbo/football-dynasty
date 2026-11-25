const TEXT: Record<string, [string, string]> = {
  training: ['Training', 'Weekly training schedules, intensity and individual focus are coming soon (TrainingSchedule and DevelopmentCard in the design system). For now, players develop at the end of each season based on age, potential, professionalism and playing time.'],
  finances: ['Finances', 'Detailed income, wages and budgets are coming soon. Your balance, transfer budget and wage bill are on the Home screen.'],
};
export default function Placeholder({ id }: { id: string }) {
  const [title, body] = TEXT[id] ?? ['Coming soon', ''];
  return <div className="pg-stack" style={{ maxWidth: 640 }}><h1 className="pg-title">{title}</h1><p className="pg-sub">{body}</p></div>;
}
