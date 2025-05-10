import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface CardProps {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardType: 'visa' | 'mastercard';
  isFrozen: boolean;
  onFreeze?: (id: string) => void;
  onUnfreeze?: (id: string) => void;
}

const VirtualCard: React.FC<CardProps> = ({
  id,
  cardNumber,
  cardHolderName,
  expiryMonth,
  expiryYear,
  cvv,
  cardType,
  isFrozen,
  onFreeze,
  onUnfreeze,
}) => {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCardDetailsVisible, setIsCardDetailsVisible] = useState(false);

  const formatCardNumber = (number: string) => {
    if (isCardDetailsVisible) {
      return number.match(/.{1,4}/g)?.join(' ') || number;
    }
    return `•••• •••• •••• ${number.slice(-4)}`;
  };

  const formatExpiry = () => {
    const month = expiryMonth.toString().padStart(2, '0');
    const year = expiryYear.toString().slice(-2);
    return `${month}/${year}`;
  };

  const handleToggleVisibility = () => {
    setIsCardDetailsVisible(!isCardDetailsVisible);
  };

  const handleToggleFreeze = () => {
    if (isFrozen && onUnfreeze) {
      onUnfreeze(id);
    } else if (!isFrozen && onFreeze) {
      onFreeze(id);
    }
  };

  const cardVariants = {
    front: {
      rotateY: 0,
    },
    back: {
      rotateY: 180,
    },
  };

  const frostVariants = {
    unfrozen: {
      opacity: 0,
    },
    frozen: {
      opacity: 0.7,
    },
  };

  const renderCardLogo = () => {
    if (cardType === 'visa') {
      return (
        <div className="text-white font-bold text-xl italic">VISA</div>
      );
    } else if (cardType === 'mastercard') {
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
          <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-4"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-sm mx-auto perspective">
      <motion.div
        className="relative w-full h-56 cursor-pointer"
        animate={isFlipped ? 'back' : 'front'}
        variants={cardVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of the card */}
        <motion.div
          className={`absolute inset-0 rounded-xl p-6 flex flex-col justify-between bg-gradient-to-br ${
            cardType === 'visa' 
              ? 'from-blue-600 to-blue-900' 
              : 'from-gray-800 to-gray-900'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Frost effect for frozen cards */}
          <motion.div 
            className="absolute inset-0 bg-white backdrop-blur-sm rounded-xl"
            variants={frostVariants}
            animate={isFrozen ? 'frozen' : 'unfrozen'}
            transition={{ duration: 0.3 }}
          />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="text-white text-xl font-bold">BANKS-MO</div>
            {renderCardLogo()}
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-10 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded"></div>
              <motion.button
                className="text-white bg-white/20 p-2 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      isCardDetailsVisible
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    }
                  ></path>
                </svg>
              </motion.button>
            </div>

            <div className="text-white text-lg font-medium mb-4">
              {formatCardNumber(cardNumber)}
            </div>

            <div className="flex justify-between">
              <div>
                <div className="text-white/70 text-xs">Card Holder</div>
                <div className="text-white text-sm font-medium">{cardHolderName}</div>
              </div>
              <div>
                <div className="text-white/70 text-xs">Expires</div>
                <div className="text-white text-sm font-medium">{formatExpiry()}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back of the card */}
        <motion.div
          className={`absolute inset-0 rounded-xl p-6 flex flex-col justify-between bg-gradient-to-br ${
            cardType === 'visa' 
              ? 'from-blue-600 to-blue-900' 
              : 'from-gray-800 to-gray-900'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Frost effect for frozen cards */}
          <motion.div 
            className="absolute inset-0 bg-white backdrop-blur-sm rounded-xl"
            variants={frostVariants}
            animate={isFrozen ? 'frozen' : 'unfrozen'}
            transition={{ duration: 0.3 }}
          />
          
          <div className="relative z-10">
            <div className="w-full h-12 bg-black mt-4 mb-6"></div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white/70 text-xs">CVV</div>
                <div className="bg-white/20 py-2 px-4 rounded-md">
                  <span className="text-white">
                    {isCardDetailsVisible ? cvv : '•••'}
                  </span>
                </div>
              </div>
              
              <motion.button
                className={`py-2 px-4 rounded-md font-medium ${
                  isFrozen
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFreeze();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
              </motion.button>
            </div>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="text-white text-sm">
              {isCardDetailsVisible ? `****-${cardNumber.slice(-4)}` : ''}
            </div>
            {renderCardLogo()}
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-6 space-y-4">
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            className="flex items-center justify-center py-3 px-4 rounded-lg bg-primary-50 text-primary-700 font-medium"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Card Settings
          </motion.button>
          
          <motion.button
            className="flex items-center justify-center py-3 px-4 rounded-lg bg-secondary-50 text-secondary-700 font-medium"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            Transactions
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default VirtualCard; 