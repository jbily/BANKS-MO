# BANKS-MO

A modern full-stack digital banking system with secure user management, core banking features, and advanced frontend animations.

## Features

- **User Management**: Secure registration/login with JWT and 2FA
- **Core Banking**: Account management, transaction processing, and balance inquiries
- **Fund Transfers**: Internal and scheduled transfers with fraud detection
- **Virtual Cards**: Digital card management with controls
- **Merchant Services**: Payment gateway integration and dashboards
- **Security**: AES-256 encryption and comprehensive monitoring
- **Admin Panel**: Complete system management and reporting

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (with advanced animations)
- **Backend**: Node.js/Express
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens

## Project Structure

```
banks-mo/
├── client/                  # React frontend
│   ├── src/
│   │   ├── animations/      # Custom animations
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Main pages
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   ├── package.json         # Frontend dependencies
│   └── tailwind.config.js   # Tailwind CSS configuration
│
├── server/                  # Node.js/Express backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions
│   └── package.json         # Backend dependencies
│
├── database-schema.md       # Database schema documentation
└── README.md                # Project documentation
```

## Implementation Phases

### Phase 1: Core Infrastructure (Current)
- Basic project structure setup
- User authentication (JWT + refresh tokens)
- Database models and relationships
- Account management APIs
- Frontend authentication flows

### Phase 2: Banking Features
- Account creation and management
- Deposits and withdrawals
- Transaction history
- Balance inquiries
- Dashboard with visualizations

### Phase 3: Transfer System
- Internal transfers between accounts
- Scheduled transfers
- Transfer limits and controls
- Fraud detection mechanisms

### Phase 4: Virtual Cards
- Card creation and management
- Card freezing and controls
- Spending limits
- Transaction monitoring

### Phase 5: Merchant Services
- Merchant account management
- Payment processing APIs
- Transaction reporting
- Merchant dashboard

### Phase 6: Admin Functionality
- User management
- System monitoring
- Transaction oversight
- KYC verification processes

## Security Features

- JWT authentication with refresh tokens
- Two-factor authentication (2FA)
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Transaction fraud detection
- Card freezing capabilities
- Role-based access control

## Getting Started

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/username/banks-mo.git
cd banks-mo
```

2. Install dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# In the server directory
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. Start the development servers
```bash
# Start the backend server
cd server
npm run dev

# Start the frontend development server
cd ../client
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.