const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cardNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  cardType: {
    type: DataTypes.ENUM('visa', 'mastercard'),
    allowNull: false
  },
  cardHolderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiryMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  expiryYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2023 // Should be dynamic in a real application
    }
  },
  cvv: {
    type: DataTypes.STRING,
    allowNull: false
  },
  billingAddress: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFrozen: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dailySpendingLimit: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 1000.00
  },
  monthlySpendingLimit: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 10000.00
  },
  dailySpendingUsed: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 0
  },
  monthlySpendingUsed: {
    type: DataTypes.DECIMAL(19, 4),
    defaultValue: 0
  },
  lastResetDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  allowedCategories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [] // Empty array means all categories allowed
  },
  blockedCategories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  allowAtm: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowOnlinePurchases: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowInternationalTransactions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    },
    allowNull: false
  },
  linkedAccountId: {
    type: DataTypes.UUID,
    references: {
      model: 'Accounts',
      key: 'id'
    },
    allowNull: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (card) => {
      // In a real system, these would be generated and stored securely
      // This is just for demonstration
      card.cardNumber = '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
      card.cvv = Array(3).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    }
  }
});

// Instance methods
Card.prototype.updateSpendingLimits = async function() {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  // Reset daily limit if it's a new day
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.dailySpendingUsed = 0;
  }
  
  // Reset monthly limit if it's a new month
  if (now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.monthlySpendingUsed = 0;
  }
  
  this.lastResetDate = now;
  await this.save();
};

Card.prototype.freeze = async function() {
  this.isFrozen = true;
  await this.save();
  return true;
};

Card.prototype.unfreeze = async function() {
  this.isFrozen = false;
  await this.save();
  return true;
};

module.exports = Card; 