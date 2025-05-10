import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Account {
  id: string;
  accountNumber: string;
  accountType: 'savings' | 'checking';
  balance: number;
  currency: string;
  isActive: boolean;
}

const AccountOverview: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/accounts');
        setAccounts(response.data.accounts);
        if (response.data.accounts.length > 0) {
          setSelectedAccountId(response.data.accounts[0].id);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to fetch your accounts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          className="w-16 h-16 border-4 border-banking-accent border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-red-100 text-red-800 p-4 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {error}
      </motion.div>
    );
  }

  if (accounts.length === 0) {
    return (
      <motion.div
        className="bg-white p-6 rounded-lg shadow-card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-semibold mb-4">No Accounts Found</h3>
        <p className="text-gray-600 mb-6">You don't have any accounts yet. Create your first account to get started.</p>
        <motion.button
          className="px-6 py-2 bg-banking-accent text-white rounded-lg font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Account
        </motion.button>
      </motion.div>
    );
  }

  const selectedAccount = accounts.find(account => account.id === selectedAccountId) || accounts[0];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center"
      >
        <h2 className="text-2xl font-bold text-banking-dark">Account Overview</h2>
        <motion.button
          className="px-4 py-2 bg-banking-accent text-white rounded-lg font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          New Account
        </motion.button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-card overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-banking-medium to-banking-light">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm">Current Balance</p>
              <motion.h3
                className="text-3xl font-bold text-white mt-1"
                animate={pulseAnimation}
              >
                {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
              </motion.h3>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-white text-sm font-medium">{selectedAccount.accountType === 'checking' ? 'Checking' : 'Savings'} Account</p>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-6">
            Account Number: •••• {selectedAccount.accountNumber.slice(-4)}
          </p>
        </div>

        <div className="p-6">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {accounts.map(account => (
              <motion.div
                key={account.id}
                className={`rounded-lg px-4 py-3 cursor-pointer min-w-[140px] transition-colors ${
                  selectedAccountId === account.id
                    ? 'bg-banking-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedAccountId(account.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <p className="text-xs font-medium opacity-80">
                  {account.accountType === 'checking' ? 'Checking' : 'Savings'}
                </p>
                <p className="font-semibold mt-1">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <motion.button
              className="flex items-center justify-center py-3 rounded-lg bg-primary-50 text-primary-700 font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Deposit
            </motion.button>
            
            <motion.button
              className="flex items-center justify-center py-3 rounded-lg bg-secondary-50 text-secondary-700 font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
              </svg>
              Transfer
            </motion.button>
            
            <motion.button
              className="flex items-center justify-center py-3 rounded-lg bg-banking-dark text-white font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
              Cards
            </motion.button>
            
            <motion.button
              className="flex items-center justify-center py-3 rounded-lg bg-gray-100 text-gray-700 font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Statements
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-card p-6"
      >
        <h3 className="text-xl font-semibold text-banking-dark mb-4">Recent Transactions</h3>
        
        <AnimatePresence>
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: item * 0.1 }}
              className="flex justify-between items-center py-4 border-b border-gray-100"
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d={item % 2 === 0 
                        ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                        : "M19 14l-7 7m0 0l-7-7m7 7V3"}>
                    </path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-800">
                    {item % 2 === 0 ? 'Deposit' : 'Withdrawal'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${
                item % 2 === 0 ? 'text-banking-success' : 'text-banking-danger'
              }`}>
                {item % 2 === 0 ? '+' : '-'}${(item * 120).toFixed(2)}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <motion.button
          className="w-full mt-4 py-2 text-banking-accent font-medium rounded-lg border border-banking-accent"
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(74, 163, 223, 0.05)' }}
          whileTap={{ scale: 0.98 }}
        >
          View All Transactions
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default AccountOverview; 