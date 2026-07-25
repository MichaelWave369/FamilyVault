from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator, model_validator

ShortName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=10_000)]
Password = Annotated[str, StringConstraints(min_length=12, max_length=128)]
CurrencyCode = Annotated[str, StringConstraints(pattern=r'^[A-Z]{3}$')]
FamilyRole = Literal['guest', 'child', 'teen', 'adult']
VaultPermission = Literal['read', 'write']


class RegisterIn(BaseModel):
    email: EmailStr
    password: Password
    name: ShortName


class LoginIn(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=1, max_length=128)]


class TokenOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class FamilyIn(BaseModel):
    name: ShortName


class InviteIn(BaseModel):
    email: EmailStr
    role: FamilyRole


class InviteAcceptIn(BaseModel):
    token: Annotated[str, StringConstraints(min_length=20, max_length=255)]


class CalendarIn(BaseModel):
    name: ShortName
    color: str = Field(default='#6ee7ff', pattern=r'^#[0-9A-Fa-f]{6}$')


class EventIn(BaseModel):
    title: ShortName
    description: LongText | None = None
    location: Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)] | None = None
    start_at: datetime
    end_at: datetime
    all_day: bool = False
    recurrence_rule: Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)] | None = None

    @model_validator(mode='after')
    def validate_times(self):
        if self.end_at <= self.start_at:
            raise ValueError('end_at must be after start_at')
        return self


class ChoreIn(BaseModel):
    title: ShortName
    description: LongText | None = None
    points: int = Field(default=0, ge=0, le=100_000)
    schedule_rule: Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)] | None = None


class AssignmentIn(BaseModel):
    assignee_member_id: int = Field(gt=0)
    due_at: datetime | None = None


class ShoppingListIn(BaseModel):
    name: ShortName


class ShoppingItemIn(BaseModel):
    text: ShortName
    qty: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = None
    unit: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None
    category: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None = None


class ShoppingItemPatch(BaseModel):
    text: ShortName | None = None
    qty: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = None
    unit: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None
    checked: bool | None = None
    category: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None = None


class ExpenseAccountIn(BaseModel):
    name: ShortName
    currency: CurrencyCode = 'USD'

    @field_validator('currency')
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()


class ExpenseIn(BaseModel):
    amount_cents: int = Field(gt=0, le=1_000_000_000_00)
    currency: CurrencyCode = 'USD'
    category: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)] = 'general'
    merchant: Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)] | None = None
    notes: LongText | None = None
    spent_at: datetime

    @field_validator('currency')
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()


class ProfileIn(BaseModel):
    member_id: int = Field(gt=0)
    dob: date | None = None
    blood_type: Annotated[str, StringConstraints(strip_whitespace=True, max_length=10)] | None = None
    notes: LongText | None = None


class FolderIn(BaseModel):
    name: ShortName


class VaultItemIn(BaseModel):
    title: ShortName
    username: Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)] | None = None
    url: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2048)] | None = None
    secret: Annotated[str, StringConstraints(min_length=1, max_length=10_000)]
    totp_seed: Annotated[str, StringConstraints(strip_whitespace=True, max_length=512)] | None = None
    notes: LongText | None = None


class VaultAccessIn(BaseModel):
    member_id: int = Field(gt=0)
    permission: VaultPermission = 'read'
