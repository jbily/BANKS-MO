import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
  twoFactorCode?: string;
}

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
    twoFactorCode: '',
  };

  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters'),
    twoFactorCode: requires2FA
      ? Yup.string().required('Two-factor code is required').length(6, 'Code must be 6 digits')
      : Yup.string(),
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await login(
        values.email,
        values.password,
        requires2FA ? values.twoFactorCode : undefined
      );

      if (result.success) {
        if (result.requires2FA) {
          setRequires2FA(true);
          setUserId(result.userId || '');
        } else {
          // Successful login, redirect to dashboard
          navigate('/dashboard');
        }
      } else {
        setErrorMessage('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
        duration: 0.3,
      },
    },
  };

  const inputVariants = {
    focused: { scale: 1.02, boxShadow: '0 0 8px rgba(0, 0, 255, 0.3)' },
    unfocused: { scale: 1, boxShadow: 'none' },
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-banking-dark mb-6 text-center">
          {requires2FA ? 'Two-Factor Authentication' : 'Login to Your Account'}
        </h2>
      </motion.div>

      {errorMessage && (
        <motion.div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {errorMessage}
        </motion.div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isValid, dirty, touched, errors, handleBlur, handleChange, setFieldTouched }) => (
          <Form>
            {!requires2FA ? (
              <>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <motion.div
                    variants={inputVariants}
                    initial="unfocused"
                    whileFocus="focused"
                  >
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        touched.email && errors.email
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                  </motion.div>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 mt-1 text-sm"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                    Password
                  </label>
                  <motion.div
                    variants={inputVariants}
                    initial="unfocused"
                    whileFocus="focused"
                  >
                    <Field
                      type="password"
                      id="password"
                      name="password"
                      className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        touched.password && errors.password
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                  </motion.div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 mt-1 text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label htmlFor="twoFactorCode" className="block text-gray-700 font-medium mb-2">
                  Authentication Code
                </label>
                <motion.div
                  variants={inputVariants}
                  initial="unfocused"
                  whileFocus="focused"
                >
                  <Field
                    type="text"
                    id="twoFactorCode"
                    name="twoFactorCode"
                    className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      touched.twoFactorCode && errors.twoFactorCode
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    autoComplete="off"
                  />
                </motion.div>
                <ErrorMessage
                  name="twoFactorCode"
                  component="div"
                  className="text-red-500 mt-1 text-sm"
                />
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              className={`w-full py-3 px-4 bg-banking-accent text-white font-semibold rounded transition-colors ${
                isSubmitting || !isValid || !dirty
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              whileHover={isSubmitting || !isValid || !dirty ? {} : { scale: 1.02 }}
              whileTap={isSubmitting || !isValid || !dirty ? {} : { scale: 0.98 }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Processing...</span>
                </div>
              ) : requires2FA ? (
                'Verify Code'
              ) : (
                'Login'
              )}
            </motion.button>
          </Form>
        )}
      </Formik>

      <div className="mt-4 text-center">
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Don't have an account?{' '}
          <motion.span
            className="text-banking-accent font-medium cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/register')}
          >
            Register
          </motion.span>
        </motion.p>
      </div>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span
          className="text-banking-accent cursor-pointer hover:underline"
          onClick={() => navigate('/forgot-password')}
        >
          Forgot your password?
        </span>
      </motion.div>
    </motion.div>
  );
};

export default LoginForm; 