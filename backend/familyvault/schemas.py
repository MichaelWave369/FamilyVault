from datetime import date, datetime
from pydantic import BaseModel, EmailStr


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'


class FamilyIn(BaseModel):
    name: str


class InviteIn(BaseModel):
    email: EmailStr
    role: str


class InviteAcceptIn(BaseModel):
    token: str


class CalendarIn(BaseModel):
    name: str
    color: str = '#6ee7ff'


class EventIn(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    start_at: datetime
    end_at: datetime
    all_day: bool = False
    recurrence_rule: str | None = None


class ChoreIn(BaseModel):
    title: str
    description: str | None = None
    points: int = 0
    schedule_rule: str | None = None


class AssignmentIn(BaseModel):
    assignee_member_id: int
    due_at: datetime | None = None


class ShoppingListIn(BaseModel):
    name: str


class ShoppingItemIn(BaseModel):
    text: str
    qty: str | None = None
    unit: str | None = None
    category: str | None = None


class ShoppingItemPatch(BaseModel):
    text: str | None = None
    qty: str | None = None
    unit: str | None = None
    checked: bool | None = None
    category: str | None = None


class ExpenseAccountIn(BaseModel):
    name: str
    currency: str = 'USD'


class ExpenseIn(BaseModel):
    amount_cents: int
    currency: str = 'USD'
    category: str = 'general'
    merchant: str | None = None
    notes: str | None = None
    spent_at: datetime


class ProfileIn(BaseModel):
    member_id: int
    dob: date | None = None
    blood_type: str | None = None
    notes: str | None = None


class FolderIn(BaseModel):
    name: str


class VaultItemIn(BaseModel):
    title: str
    username: str | None = None
    url: str | None = None
    secret: str
    totp_seed: str | None = None
    notes: str | None = None
