const Account = require('../models/account');
const Transaction = require('../models/transaction');
const { sequelize } = require('../config/database');

// Create a new account for a user
exports.createAccount = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountType, currency } = req.body;
    const userId = req.user.id;
    
    // Create account
    const account = await Account.create({
      accountType,
      currency,
      userId
    }, { transaction: t });
    
    // Create initial transaction for opening balance if provided
    if (req.body.initialDeposit && parseFloat(req.body.initialDeposit) > 0) {
      const amount = parseFloat(req.body.initialDeposit);
      
      await Transaction.create({
        transactionType: 'deposit',
        amount,
        currency: account.currency,
        description: 'Initial deposit',
        status: 'completed',
        toAccountId: account.id,
        metadata: { source: 'account_opening' }
      }, { transaction: t });
      
      // Update account balance
      account.balance = amount;
      await account.save({ transaction: t });
    }
    
    await t.commit();
    
    res.status(201).json({
      message: 'Account created successfully',
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        createdAt: account.createdAt
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Account creation error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
};

// Get all accounts for a user
exports.getAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const accounts = await Account.findAll({
      where: { userId },
      attributes: ['id', 'accountNumber', 'accountType', 'balance', 'currency', 'isActive', 'createdAt', 'updatedAt']
    });
    
    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Failed to retrieve accounts' });
  }
};

// Get account details by ID
exports.getAccountById = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    
    const account = await Account.findOne({
      where: { id: accountId, userId },
      attributes: [
        'id', 'accountNumber', 'accountType', 'balance', 'currency', 'isActive', 
        'dailyTransferLimit', 'monthlyTransferLimit', 'dailyTransferUsed', 'monthlyTransferUsed',
        'createdAt', 'updatedAt'
      ]
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Failed to retrieve account details' });
  }
};

// Get account transactions
exports.getAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    
    // Verify account belongs to user
    const account = await Account.findOne({
      where: { id: accountId, userId }
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Build query
    const whereClause = {
      [sequelize.Op.or]: [
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    // Fetch transactions
    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      transactions: transactions.rows,
      totalCount: transactions.count,
      totalPages: Math.ceil(transactions.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get account transactions error:', error);
    res.status(500).json({ message: 'Failed to retrieve account transactions' });
  }
};

// Make a deposit to an account
exports.deposit = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountId } = req.params;
    const { amount, description } = req.body;
    const userId = req.user.id;
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }
    
    // Verify account belongs to user
    const account = await Account.findOne({
      where: { id: accountId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    
    if (!account) {
      await t.rollback();
      return res.status(404).json({ message: 'Account not found' });
    }
    
    if (!account.isActive) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot deposit to inactive account' });
    }
    
    const depositAmount = parseFloat(amount);
    
    // Create transaction
    const transaction = await Transaction.create({
      transactionType: 'deposit',
      amount: depositAmount,
      currency: account.currency,
      description: description || 'Account deposit',
      status: 'completed',
      toAccountId: account.id,
      metadata: { source: 'user_deposit' }
    }, { transaction: t });
    
    // Update account balance
    account.balance = parseFloat(account.balance) + depositAmount;
    await account.save({ transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Deposit successful',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.transactionType,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      newBalance: account.balance
    });
  } catch (error) {
    await t.rollback();
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Failed to process deposit' });
  }
};

// Make a withdrawal from an account
exports.withdraw = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountId } = req.params;
    const { amount, description } = req.body;
    const userId = req.user.id;
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }
    
    // Verify account belongs to user
    const account = await Account.findOne({
      where: { id: accountId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    
    if (!account) {
      await t.rollback();
      return res.status(404).json({ message: 'Account not found' });
    }
    
    if (!account.isActive) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot withdraw from inactive account' });
    }
    
    const withdrawalAmount = parseFloat(amount);
    
    // Check sufficient balance
    if (parseFloat(account.balance) < withdrawalAmount) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      transactionType: 'withdrawal',
      amount: withdrawalAmount,
      currency: account.currency,
      description: description || 'Account withdrawal',
      status: 'completed',
      fromAccountId: account.id,
      metadata: { source: 'user_withdrawal' }
    }, { transaction: t });
    
    // Update account balance
    account.balance = parseFloat(account.balance) - withdrawalAmount;
    await account.save({ transaction: t });
    
    await t.commit();
    
    res.json({
      message: 'Withdrawal successful',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.transactionType,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      newBalance: account.balance
    });
  } catch (error) {
    await t.rollback();
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
};

// Close an account
exports.closeAccount = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    
    // Verify account belongs to user
    const account = await Account.findOne({
      where: { id: accountId, userId },
      transaction: t
    });
    
    if (!account) {
      await t.rollback();
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Check if account has balance
    if (parseFloat(account.balance) > 0) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Cannot close account with balance. Please withdraw or transfer funds first.',
        currentBalance: account.balance
      });
    }
    
    // Deactivate account
    account.isActive = false;
    await account.save({ transaction: t });
    
    await t.commit();
    
    res.json({ message: 'Account closed successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Close account error:', error);
    res.status(500).json({ message: 'Failed to close account' });
  }
};

// Update account transfer limits
exports.updateLimits = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { dailyTransferLimit, monthlyTransferLimit } = req.body;
    const userId = req.user.id;
    
    // Verify account belongs to user
    const account = await Account.findOne({
      where: { id: accountId, userId }
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Update limits
    if (dailyTransferLimit !== undefined) {
      account.dailyTransferLimit = parseFloat(dailyTransferLimit);
    }
    
    if (monthlyTransferLimit !== undefined) {
      account.monthlyTransferLimit = parseFloat(monthlyTransferLimit);
    }
    
    await account.save();
    
    res.json({
      message: 'Account limits updated successfully',
      account: {
        id: account.id,
        dailyTransferLimit: account.dailyTransferLimit,
        monthlyTransferLimit: account.monthlyTransferLimit
      }
    });
  } catch (error) {
    console.error('Update limits error:', error);
    res.status(500).json({ message: 'Failed to update account limits' });
  }
}; 