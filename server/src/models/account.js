const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  accountNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  accountType: {
    type: DataTypes.ENUM('savings', 'checking'),
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 0,
    validate: {
      min: 0 // Prevent negative balances
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    validate: {
      isIn: [['USD', 'EUR', 'GBP', 'JPY', 'CAD']] // List of supported currencies
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dailyTransferLimit: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 5000.00
  },
  monthlyTransferLimit: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 50000.00
  },
  dailyTransferUsed: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 0
  },
  monthlyTransferUsed: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 0
  },
  lastResetDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users', // Note: Sequelize pluralizes the model name in the references
      key: 'id'
    },
    allowNull: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (account) => {
      // Generate a random account number
      // In a real system, this would follow a specific format and validation
      account.accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
    }
  }
});

// Instance methods
Account.prototype.updateTransferLimits = async function() {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  // Reset daily limit if it's a new day
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.dailyTransferUsed = 0;
  }
  
  // Reset monthly limit if it's a new month
  if (now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.monthlyTransferUsed = 0;
  }
  
  this.lastResetDate = now;
  await this.save();
};

module.exports = Account; 