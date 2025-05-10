const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create a new account
router.post('/', authorize('customer'), accountController.createAccount);

// Get all accounts for the authenticated user
router.get('/', accountController.getAccounts);

// Get account details by ID
router.get('/:accountId', accountController.getAccountById);

// Get account transactions
router.get('/:accountId/transactions', accountController.getAccountTransactions);

// Make a deposit
router.post('/:accountId/deposit', accountController.deposit);

// Make a withdrawal
router.post('/:accountId/withdraw', accountController.withdraw);

// Close an account
router.post('/:accountId/close', accountController.closeAccount);

// Update account limits
router.put('/:accountId/limits', accountController.updateLimits);

module.exports = router; 