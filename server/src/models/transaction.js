const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionType: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false,
    validate: {
      min: 0.01 // Minimum transaction amount
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    validate: {
      isIn: [['USD', 'EUR', 'GBP', 'JPY', 'CAD']] // List of supported currencies
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  reference: {
    type: DataTypes.STRING,
    unique: true // Unique transaction reference
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  fromAccountId: {
    type: DataTypes.UUID,
    references: {
      model: 'Accounts',
      key: 'id'
    },
    allowNull: true // Can be null for deposits
  },
  toAccountId: {
    type: DataTypes.UUID,
    references: {
      model: 'Accounts',
      key: 'id'
    },
    allowNull: true // Can be null for withdrawals
  },
  cardId: {
    type: DataTypes.UUID,
    references: {
      model: 'Cards',
      key: 'id'
    },
    allowNull: true // Only for card transactions
  },
  merchantId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    },
    allowNull: true // Only for merchant payments
  },
  ipAddress: {
    type: DataTypes.STRING,
    validate: {
      isIP: true
    }
  },
  deviceInfo: {
    type: DataTypes.TEXT
  },
  location: {
    type: DataTypes.STRING
  },
  isFraudSuspected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fraudReviewStatus: {
    type: DataTypes.ENUM('not_reviewed', 'under_review', 'cleared', 'confirmed_fraud'),
    defaultValue: 'not_reviewed'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (transaction) => {
      // Generate a unique transaction reference
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      transaction.reference = `TXN-${timestamp}-${random}`;
    }
  }
});

module.exports = Transaction; 