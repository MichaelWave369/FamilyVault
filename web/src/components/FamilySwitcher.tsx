import {useFamily} from '../family/FamilyContext';

export default function FamilySwitcher() {
  const {families, currentFamily, selectFamily, loading} = useFamily();
  return (
    <select
      aria-label="Current family"
      disabled={loading || families.length === 0}
      value={currentFamily?.id ?? ''}
      onChange={event => selectFamily(Number(event.target.value))}
    >
      {families.length === 0 && <option value="">No family yet</option>}
      {families.map(family => <option key={family.id} value={family.id}>{family.name}</option>)}
    </select>
  );
}
