// src/components/home/HowItWorks.jsx
import { CheckCircle, Search, Shield } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      title: 'Sign Up',
      description: 'Create your account with university email',
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      step: 2,
      title: 'Browse or List',
      description: 'Find what you need or sell what you don\'t',
      icon: <Search className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      step: 3,
      title: 'Connect & Transact',
      description: 'Chat safely and complete transactions',
      icon: <Shield className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Three simple steps to buy and sell on campus
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.step} className="relative">
              <div className={`${step.bgColor} rounded-2xl p-8 text-center`}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6 shadow-sm">
                  <div className={step.color}>
                    {step.icon}
                  </div>
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-white rounded-full text-teal-600 font-bold mb-4 border-2 border-gray-100">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;