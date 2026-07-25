import {FormEvent, useState} from 'react';
import {ApiError} from '../api/client';
import {useAuth} from '../auth/AuthContext';
import {useFamily} from '../family/FamilyContext';

const modules = [
  ['Calendar', 'Coordinate appointments and family events.'],
  ['Chores', 'Assign responsibilities without losing track.'],
  ['Shopping', 'Keep shared household lists together.'],
  ['Expenses', 'Record family spending and monthly totals.'],
  ['Medical', 'Store encrypted notes and encrypted documents.'],
  ['Vault', 'Share individual secrets only with named adults.'],
];

export default function Dashboard() {
  const {user} = useAuth();
  const {currentFamily, families, createFamily} = useFamily();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await createFamily(name);
      setName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create family');
    }
  }

  return (
    <div>
      <div className="page-heading"><div><h1>Hello, {user?.name}</h1><p>{currentFamily ? `${currentFamily.name} · ${currentFamily.role}` : 'Create your first private family space.'}</p></div></div>
      {families.length === 0 && (
        <form className="panel create-family" onSubmit={submit}>
          <h2>Create a family</h2>
          <p>This becomes the private boundary for members, roles, records, and sharing.</p>
          {error && <div className="error-box">{error}</div>}
          <div className="inline-form"><input required placeholder="Family name" value={name} onChange={e => setName(e.target.value)} /><button>Create</button></div>
        </form>
      )}
      <div className="card-grid">
        {modules.map(([title, description]) => <article className="module-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
      </div>
      <div className="security-note"><strong>Security posture:</strong> refresh sessions are revocable, medical uploads are encrypted at rest, and vault items are private until explicitly shared.</div>
    </div>
  );
}
