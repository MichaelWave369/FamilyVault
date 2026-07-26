export default function PageHeader({eyebrow, title, description, actions}: {eyebrow?: string; title: string; description?: string; actions?: React.ReactNode}) {
  return <div className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}
