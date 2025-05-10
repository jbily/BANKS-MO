const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'banks_mo_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Initialize models and relationships
const initializeDatabase = async () => {
  try {
    // Import models
    const User = require('../models/user');
    const Account = require('../models/account');
    const Transaction = require('../models/transaction');
    const Card = require('../models/card');
    
    // Define relationships
    User.hasMany(Account, { 
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
    Account.belongsTo(User, { foreignKey: 'userId' });
    
    User.hasMany(Card, { 
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
    Card.belongsTo(User, { foreignKey: 'userId' });
    
    Account.hasMany(Card, { 
      foreignKey: 'linkedAccountId',
      onDelete: 'CASCADE'
    });
    Card.belongsTo(Account, { foreignKey: 'linkedAccountId' });
    
    Account.hasMany(Transaction, { 
      foreignKey: 'fromAccountId',
      as: 'SentTransactions'
    });
    Transaction.belongsTo(Account, { 
      foreignKey: 'fromAccountId',
      as: 'FromAccount'
    });
    
    Account.hasMany(Transaction, { 
      foreignKey: 'toAccountId',
      as: 'ReceivedTransactions'
    });
    Transaction.belongsTo(Account, { 
      foreignKey: 'toAccountId',
      as: 'ToAccount'
    });
    
    Card.hasMany(Transaction, { foreignKey: 'cardId' });
    Transaction.belongsTo(Card, { foreignKey: 'cardId' });
    
    User.hasMany(Transaction, { 
      foreignKey: 'merchantId',
      as: 'MerchantTransactions'
    });
    Transaction.belongsTo(User, { 
      foreignKey: 'merchantId',
      as: 'Merchant'
    });

    // Sync all models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
}; 