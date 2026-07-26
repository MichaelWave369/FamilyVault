export type Role = 'guest' | 'child' | 'teen' | 'adult' | 'admin' | 'owner';

export type Family = {id: number; name: string; role: Role};
export type Member = {id: number; user_id: number; display_name: string; role: Role};
export type CalendarRecord = {id: number; family_id: number; name: string; color: string; created_by: number};
export type EventRecord = {
  id: number;
  calendar_id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  recurrence_rule?: string | null;
  created_by: number;
  updated_at: string;
};
export type Chore = {id: number; family_id: number; title: string; description?: string | null; points: number; schedule_rule?: string | null; created_by: number};
export type Assignment = {
  id: number;
  chore_id: number;
  chore_title: string;
  assignee_member_id: number;
  assignee_name: string;
  due_at?: string | null;
  status: string;
  completed_at?: string | null;
};
export type ShoppingList = {id: number; family_id: number; name: string; created_by: number};
export type ShoppingItem = {id: number; list_id: number; text: string; qty?: string | null; unit?: string | null; checked: boolean; category?: string | null};
export type ExpenseAccount = {id: number; family_id: number; name: string; currency: string; created_by: number};
export type Expense = {id: number; account_id: number; amount_cents: number; currency: string; category: string; merchant?: string | null; notes?: string | null; spent_at: string; created_by: number};
export type ExpenseSummary = {account_id: number; month: number; year: number; total_cents: number};
export type MedicalProfile = {id: number; family_id: number; member_id: number; dob?: string | null; blood_type?: string | null; notes?: string};
export type MedicalFile = {id: number; filename: string; mime: string; size: number; sha256: string; note?: string | null};
export type VaultFolder = {id: number; family_id: number; name: string; created_by: number};
export type VaultItemSummary = {id: number; folder_id: number; title: string; username?: string | null; url?: string | null; created_by: number; updated_at: string};
export type VaultItem = VaultItemSummary & {payload: {secret: string; totp_seed?: string | null; notes?: string | null}};
