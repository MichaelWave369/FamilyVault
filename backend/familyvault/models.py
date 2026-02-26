from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from familyvault.db import Base


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Family(Base):
    __tablename__ = 'families'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FamilyMember(Base):
    __tablename__ = 'family_members'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    role: Mapped[str] = mapped_column(String(20))
    display_name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Invite(Base):
    __tablename__ = 'invites'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    email: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    token: Mapped[str] = mapped_column(String(255), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Calendar(Base):
    __tablename__ = 'calendars'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    name: Mapped[str] = mapped_column(String(255))
    color: Mapped[str] = mapped_column(String(20), default='#6ee7ff')
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class Event(Base):
    __tablename__ = 'events'
    id: Mapped[int] = mapped_column(primary_key=True)
    calendar_id: Mapped[int] = mapped_column(ForeignKey('calendars.id'))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Chore(Base):
    __tablename__ = 'chores'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    schedule_rule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class ChoreAssignment(Base):
    __tablename__ = 'chore_assignments'
    id: Mapped[int] = mapped_column(primary_key=True)
    chore_id: Mapped[int] = mapped_column(ForeignKey('chores.id'))
    assignee_member_id: Mapped[int] = mapped_column(ForeignKey('family_members.id'))
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='pending')
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_by: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True)


class ShoppingList(Base):
    __tablename__ = 'shopping_lists'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    name: Mapped[str] = mapped_column(String(255))
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class ShoppingItem(Base):
    __tablename__ = 'shopping_items'
    id: Mapped[int] = mapped_column(primary_key=True)
    list_id: Mapped[int] = mapped_column(ForeignKey('shopping_lists.id'))
    text: Mapped[str] = mapped_column(String(255))
    qty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    checked: Mapped[bool] = mapped_column(Boolean, default=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ExpenseAccount(Base):
    __tablename__ = 'expense_accounts'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    name: Mapped[str] = mapped_column(String(255))
    currency: Mapped[str] = mapped_column(String(5), default='USD')
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class Expense(Base):
    __tablename__ = 'expenses'
    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey('expense_accounts.id'))
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(5), default='USD')
    category: Mapped[str] = mapped_column(String(100), default='general')
    merchant: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    spent_at: Mapped[datetime] = mapped_column(DateTime)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class Split(Base):
    __tablename__ = 'splits'
    id: Mapped[int] = mapped_column(primary_key=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey('expenses.id'))
    member_id: Mapped[int] = mapped_column(ForeignKey('family_members.id'))
    share_cents: Mapped[int] = mapped_column(Integer)


class Profile(Base):
    __tablename__ = 'profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    member_id: Mapped[int] = mapped_column(ForeignKey('family_members.id'))
    dob: Mapped[Date | None] = mapped_column(Date, nullable=True)
    blood_type: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class Medication(Base):
    __tablename__ = 'medications'
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey('profiles.id'))
    name: Mapped[str] = mapped_column(String(255))
    dose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    schedule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Allergy(Base):
    __tablename__ = 'allergies'
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey('profiles.id'))
    allergen: Mapped[str] = mapped_column(String(255))
    reaction: Mapped[str | None] = mapped_column(String(255), nullable=True)
    severity: Mapped[str | None] = mapped_column(String(50), nullable=True)


class Immunization(Base):
    __tablename__ = 'immunizations'
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey('profiles.id'))
    name: Mapped[str] = mapped_column(String(255))
    date_administered: Mapped[Date | None] = mapped_column(Date, nullable=True)


class MedicalFile(Base):
    __tablename__ = 'medical_files'
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey('profiles.id'))
    filename: Mapped[str] = mapped_column(String(255))
    mime: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    stored_path: Mapped[str] = mapped_column(String(255))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class VaultFolder(Base):
    __tablename__ = 'vault_folders'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int] = mapped_column(ForeignKey('families.id'))
    name: Mapped[str] = mapped_column(String(255))
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))


class VaultItem(Base):
    __tablename__ = 'vault_items'
    id: Mapped[int] = mapped_column(primary_key=True)
    folder_id: Mapped[int] = mapped_column(ForeignKey('vault_folders.id'))
    title: Mapped[str] = mapped_column(String(255))
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    encrypted_payload: Mapped[str] = mapped_column(Text)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class VaultAccess(Base):
    __tablename__ = 'vault_access'
    id: Mapped[int] = mapped_column(primary_key=True)
    vault_item_id: Mapped[int] = mapped_column(ForeignKey('vault_items.id'))
    member_id: Mapped[int] = mapped_column(ForeignKey('family_members.id'))
    permission: Mapped[str] = mapped_column(String(20), default='read')


class AuditLog(Base):
    __tablename__ = 'audit_log'
    id: Mapped[int] = mapped_column(primary_key=True)
    family_id: Mapped[int | None] = mapped_column(ForeignKey('families.id'), nullable=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    target_type: Mapped[str] = mapped_column(String(100))
    target_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    meta_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
