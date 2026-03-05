// admin/src/pages/categories/components/DeleteConfirmModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FiAlertTriangle, 
  FiX, 
  FiTrash2, 
  FiAlertCircle,
  FiInfo,
  FiShield,
  FiLock,
  FiEye,
  FiEyeOff,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiClock,
  FiPackage,
  FiFolder,
  FiUsers
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  categoryName,
  categoryData = null,
  showToast = null
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState('delete');
  const [reassignTo, setReassignTo] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [hasProducts, setHasProducts] = useState(false);
  const [hasSubcategories, setHasSubcategories] = useState(false);
  
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Check if category has dependencies
  useEffect(() => {
    if (categoryData) {
      setHasProducts(categoryData.productCount > 0);
      setHasSubcategories(categoryData.subcategoryCount > 0);
    }
  }, [categoryData]);

  // Focus input on mount
  useEffect(() => {
    if (isOpen && step === 2) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, step]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Countdown for safety
  useEffect(() => {
    if (step === 3 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(reassignTo);
      showToast?.('Category deleted successfully', { type: 'success' });
    } catch (error) {
      showToast?.(error.message || 'Failed to delete category', { type: 'error' });
    } finally {
      setIsDeleting(false);
      setConfirmText('');
      setStep(1);
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setStep(1);
    setSelectedOption('delete');
    setReassignTo('');
    setShowDetails(false);
    onClose();
  };

  const nextStep = () => {
    if (step === 1 && hasProducts && selectedOption === 'delete') {
      showToast?.('Cannot delete category with products. Please reassign them first.', { type: 'warning' });
      return;
    }
    if (step === 1 && hasSubcategories && selectedOption === 'delete') {
      showToast?.('Cannot delete category with subcategories. Please reassign them first.', { type: 'warning' });
      return;
    }
    setStep(step + 1);
    setCountdown(5);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const stepVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center justify-center min-h-screen px-4"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Progress Steps */}
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${step > s ? 'bg-green-600 text-white' : 
                          step === s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}
                      `}>
                        {step > s ? <FiCheck className="w-4 h-4" /> : s}
                      </div>
                      {s < 3 && (
                        <div className={`
                          flex-1 h-1 mx-2
                          ${step > s ? 'bg-green-600' : 'bg-gray-200'}
                        `} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>Confirmation</span>
                  <span>Verification</span>
                  <span>Final</span>
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.2, 1.2, 1.2, 1.2, 1]
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center"
                  >
                    <FiAlertTriangle className="w-6 h-6 text-red-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Delete Category
                    </h3>
                    <p className="text-sm text-gray-500">
                      Step {step} of 3
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 min-h-[300px]">
                <AnimatePresence mode="wait">
                  {/* Step 1: Confirmation */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                          <FiTrash2 className="w-10 h-10 text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Delete "{categoryName}"?
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          This action will permanently remove this category from your store.
                        </p>
                      </div>

                      {/* Category Info */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <span className="text-sm font-medium text-gray-700">Category Details</span>
                          <FiChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {showDetails && categoryData && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 space-y-2 overflow-hidden"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center">
                                  <FiPackage className="w-4 h-4 mr-2" />
                                  Products:
                                </span>
                                <span className="font-medium text-gray-900">{categoryData.productCount || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center">
                                  <FiFolder className="w-4 h-4 mr-2" />
                                  Subcategories:
                                </span>
                                <span className="font-medium text-gray-900">{categoryData.subcategoryCount || 0}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Warning Messages */}
                      {(hasProducts || hasSubcategories) && (
                        <div className="space-y-2">
                          {hasProducts && (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start"
                            >
                              <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                              <p className="text-sm text-yellow-700">
                                This category has {categoryData.productCount} products. You must reassign them before deleting.
                              </p>
                            </motion.div>
                          )}
                          {hasSubcategories && (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start"
                            >
                              <FiFolder className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                              <p className="text-sm text-yellow-700">
                                This category has {categoryData.subcategoryCount} subcategories. You must reassign them before deleting.
                              </p>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Action Options */}
                      {(hasProducts || hasSubcategories) && (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Choose an action:
                          </label>
                          
                          <label className="flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-indigo-300">
                            <input
                              type="radio"
                              name="action"
                              value="reassign"
                              checked={selectedOption === 'reassign'}
                              onChange={(e) => setSelectedOption(e.target.value)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">Reassign products & subcategories</p>
                              <p className="text-xs text-gray-500">Move all items to another category</p>
                            </div>
                          </label>

                          {selectedOption === 'reassign' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="ml-7"
                            >
                              <select
                                value={reassignTo}
                                onChange={(e) => setReassignTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select destination category</option>
                                <option value="cat1">Electronics</option>
                                <option value="cat2">Clothing</option>
                                <option value="cat3">Books</option>
                              </select>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Verification */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <FiShield className="w-16 h-16 mx-auto text-red-600 mb-3" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Security Verification
                        </h4>
                        <p className="text-sm text-gray-500">
                          Please type <span className="font-bold text-red-600">DELETE</span> to confirm
                        </p>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 flex items-start">
                          <FiLock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Warning:</strong> This action cannot be undone. All data associated with this category will be permanently removed.
                          </span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Confirmation
                        </label>
                        <input
                          ref={inputRef}
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center text-xl font-bold"
                          placeholder="DELETE"
                          autoFocus
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Final */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4 text-center"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 360, 360]
                        }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center"
                      >
                        <FiAlertTriangle className="w-10 h-10 text-red-600" />
                      </motion.div>

                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Final Confirmation
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Are you absolutely sure you want to delete this category?
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-bold">Category:</span> {categoryName}
                        </p>
                        {reassignTo && (
                          <p className="text-sm text-gray-700">
                            <span className="font-bold">Reassign to:</span> Another category
                          </p>
                        )}
                      </div>

                      {/* Safety Countdown */}
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <FiClock className="w-4 h-4" />
                        <span>Deletion available in {countdown}s</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          initial={{ width: '100%' }}
                          animate={{ width: `${(countdown / 5) * 100}%` }}
                          className="h-full bg-red-600 rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={step > 1 ? prevStep : handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {step > 1 ? 'Back' : 'Cancel'}
                </button>

                {step < 3 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    disabled={
                      (step === 1 && hasProducts && selectedOption !== 'reassign') ||
                      (step === 1 && hasSubcategories && selectedOption !== 'reassign') ||
                      (step === 2 && confirmText !== 'DELETE')
                    }
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl flex items-center"
                  >
                    Continue
                    <FiChevronRight className="w-4 h-4 ml-2" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={isDeleting || countdown > 0}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl flex items-center min-w-[140px] justify-center"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete Permanently'
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;