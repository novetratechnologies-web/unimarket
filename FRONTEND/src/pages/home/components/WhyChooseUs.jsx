// components/home/WhyChooseUs.jsx
import React from 'react';
import { 
  Shield, 
  Truck, 
  CreditCard, 
  MessageCircle,
  Users,
  Award 
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Buy and sell with confidence on our secure platform'
  },
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'Free delivery on orders over KSh 2,000 within campus'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Multiple payment options with buyer protection'
  },
  {
    icon: MessageCircle,
    title: '24/7 Support',
    description: 'Round-the-clock customer support for all your needs'
  },
  {
    icon: Users,
    title: 'Student Verified',
    description: 'All users are verified students from your campus'
  },
  {
    icon: Award,
    title: 'Quality Guarantee',
    description: 'We ensure all products meet quality standards'
  }
];

const WhyChooseUs = () => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        Why Choose UniMarket?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <feature.icon className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;