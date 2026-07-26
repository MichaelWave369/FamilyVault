export default function EmptyState({icon = '⌂', title, message, action}: {icon?: string; title: string; message: string; action?: React.ReactNode}) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{message}</p>{action}</div>;
}
