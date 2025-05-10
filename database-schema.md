# BANKS-MO Database Schema

## Users
- **id**: UUID (PK)
- **firstName**: String
- **lastName**: String
- **email**: String (unique)
- **password**: String (hashed)
- **role**: Enum ('customer', 'merchant', 'admin')
- **phoneNumber**: String
- **address**: Text
- **kycStatus**: Enum ('pending', 'verified', 'rejected')
- **kycDocuments**: JSONB
- **twoFactorEnabled**: Boolean
- **twoFactorSecret**: String
- **lastLogin**: DateTime
- **isActive**: Boolean
- **refreshToken**: String
- **createdAt**: DateTime
- **updatedAt**: DateTime

## Accounts
- **id**: UUID (PK)
- **accountNumber**: String (unique)
- **accountType**: Enum ('savings', 'checking')
- **balance**: Decimal(19,4)
- **currency**: String(3)
- **isActive**: Boolean
- **dailyTransferLimit**: Decimal(19,4)
- **monthlyTransferLimit**: Decimal(19,4)
- **dailyTransferUsed**: Decimal(19,4)
- **monthlyTransferUsed**: Decimal(19,4)
- **lastResetDate**: DateTime
- **userId**: UUID (FK to Users)
- **createdAt**: DateTime
- **updatedAt**: DateTime

## Transactions
- **id**: UUID (PK)
- **transactionType**: Enum ('deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee')
- **amount**: Decimal(19,4)
- **currency**: String(3)
- **description**: Text
- **status**: Enum ('pending', 'completed', 'failed', 'cancelled')
- **reference**: String (unique)
- **metadata**: JSONB
- **fromAccountId**: UUID (FK to Accounts, can be null)
- **toAccountId**: UUID (FK to Accounts, can be null)
- **cardId**: UUID (FK to Cards, can be null)
- **merchantId**: UUID (FK to Users, can be null)
- **ipAddress**: String
- **deviceInfo**: Text
- **location**: String
- **isFraudSuspected**: Boolean
- **fraudReviewStatus**: Enum ('not_reviewed', 'under_review', 'cleared', 'confirmed_fraud')
- **createdAt**: DateTime
- **updatedAt**: DateTime

## Cards
- **id**: UUID (PK)
- **cardNumber**: String (unique)
- **cardType**: Enum ('visa', 'mastercard')
- **cardHolderName**: String
- **expiryMonth**: Integer
- **expiryYear**: Integer
- **cvv**: String
- **billingAddress**: Text
- **isActive**: Boolean
- **isFrozen**: Boolean
- **dailySpendingLimit**: Decimal(19,4)
- **monthlySpendingLimit**: Decimal(19,4)
- **dailySpendingUsed**: Decimal(19,4)
- **monthlySpendingUsed**: Decimal(19,4)
- **lastResetDate**: DateTime
- **allowedCategories**: Array(String)
- **blockedCategories**: Array(String)
- **allowAtm**: Boolean
- **allowOnlinePurchases**: Boolean
- **allowInternationalTransactions**: Boolean
- **userId**: UUID (FK to Users)
- **linkedAccountId**: UUID (FK to Accounts)
- **createdAt**: DateTime
- **updatedAt**: DateTime

## Entity Relationships

```
User
├── Has many Accounts
├── Has many Cards
└── As Merchant has many Transactions

Account
├── Belongs to User
├── Has many Cards
├── Has many SentTransactions (as fromAccountId)
└── Has many ReceivedTransactions (as toAccountId)

Card
├── Belongs to User
├── Belongs to Account (linkedAccountId)
└── Has many Transactions

Transaction
├── May belong to FromAccount (fromAccountId)
├── May belong to ToAccount (toAccountId)
├── May belong to Card (cardId)
└── May belong to Merchant (merchantId)
``` 