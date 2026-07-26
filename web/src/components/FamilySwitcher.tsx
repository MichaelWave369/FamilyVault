import {useFamily} from '../family/FamilyContext';

export default function FamilySwitcher() {
  const {families, currentFamily, selectFamily, loading} = useFamily();
  if (!families.length) return <span className="family-pill">No family yet</span>;
  return (
    <label className="family-select-wrap">
      <span>Household</span>
      <select value={currentFamily?.id ?? ''} onChange={event => selectFamily(Number(event.target.value))} disabled={loading}>
        {families.map(family => <option key={family.id} value={family.id}>{family.name}</option>)}
      </select>
    </label>
  );
}
