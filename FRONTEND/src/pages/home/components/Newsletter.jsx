// src/pages/home/components/Newsletter.jsx
import React, { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import useToast from '../../../hooks/useToast';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      showToast('Successfully subscribed to newsletter!', 'success');
      setEmail('');
    } catch (error) {
      showToast('Failed to subscribe. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Mail className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Stay Updated!
        </h2>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Get the latest deals, new arrivals, and campus offers directly in your inbox
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1 relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 pl-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
              disabled={isSubmitting}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Subscribing...
              </>
            ) : (
              <>
                Subscribe <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-sm text-white/70 mt-4">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default Newsletter;