import {useEffect} from 'react';

export default function Modal({open, title, children, onClose}: {open: boolean; title: string; children: React.ReactNode; onClose: () => void}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
