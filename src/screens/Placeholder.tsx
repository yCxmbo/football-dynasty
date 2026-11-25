export default function Placeholder({ id }: { id: string }) {
  return <div className="pg-stack" style={{ maxWidth: 640 }}><h1 className="pg-title">Coming soon</h1><p className="pg-sub">The “{id}” screen isn't built yet.</p></div>;
}
