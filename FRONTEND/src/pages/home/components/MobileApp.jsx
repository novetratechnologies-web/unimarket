// src/components/home/MobileApp.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Apple, 
  QrCode,
  Star,
  Download,
  Sparkles,
  Play
} from 'lucide-react';

// Note: Use a placeholder if image doesn't exist
// You can remove this import if you don't have the image yet
// import mockupImage from '../../../assets/mobile-app-mockup.png';

const MobileApp = () => {
  const features = [
    { text: 'Shop on the go', icon: <Smartphone className="w-5 h-5" /> },
    { text: 'Exclusive app-only deals', icon: <Sparkles className="w-5 h-5" /> },
    { text: 'Real-time notifications', icon: <Download className="w-5 h-5" /> },
    { text: 'Secure payments', icon: <Star className="w-5 h-5" /> },
    { text: 'Track your orders', icon: <Smartphone className="w-5 h-5" /> },
    { text: '24/7 support', icon: <Download className="w-5 h-5" /> }
  ];

  const reviews = [
    { rating: 5, text: 'Best campus marketplace app!', author: 'John K.' },
    { rating: 5, text: 'So convenient for buying textbooks', author: 'Mary W.' },
    { rating: 5, text: 'Love the exclusive student deals', author: 'Peter M.' }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-600 text-white rounded-3xl overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Mobile App</span>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Shop on the Go with 
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  UniMarket App
                </span>
              </h2>
              <p className="text-lg text-white/80 max-w-lg">
                Download our mobile app for a seamless shopping experience. Get exclusive app-only deals and real-time notifications.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-white/90">
                  <div className="p-1 bg-white/10 rounded-full">
                    {feature.icon}
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="#"
                className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all hover:scale-105"
              >
                <Apple className="w-8 h-8" />
                <div>
                  <div className="text-xs">Download on the</div>
                  <div className="text-lg font-semibold -mt-1">App Store</div>
                </div>
              </Link>
              <Link
                to="#"
                className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all hover:scale-105"
              >
                <Play className="w-8 h-8" />
                <div>
                  <div className="text-xs">Get it on</div>
                  <div className="text-lg font-semibold -mt-1">Google Play</div>
                </div>
              </Link>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-white/80">4.8 • 10k+ reviews</span>
            </div>

            {/* User Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {reviews.map((review, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-300 to-cyan-300 flex items-center justify-center text-teal-900 font-bold text-sm border-2 border-white"
                  >
                    {review.author[0]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-white/80">and 5k+ more</span>
            </div>
          </div>

          {/* Right Content - App Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative z-10">
              {/* Placeholder for app mockup - replace with actual image */}
              <div className="w-full max-w-md mx-auto aspect-[9/16] bg-gradient-to-b from-teal-400 to-cyan-400 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="w-20 h-20 text-white opacity-50" />
                </div>
                <div className="absolute top-0 inset-x-0 h-6 bg-white/20"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/40 rounded-full"></div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 -left-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 animate-bounce">
              <QrCode className="w-8 h-8" />
            </div>
            <div className="absolute bottom-20 -right-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 animate-pulse">
              <Download className="w-8 h-8" />
            </div>
            <div className="absolute top-1/2 -right-5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-sm">Scan to download</p>
            </div>
          </div>

          {/* Mobile App Preview (for small screens) */}
          <div className="lg:hidden flex justify-center">
            <div className="relative">
              <div className="w-64 aspect-[9/16] bg-gradient-to-b from-teal-400 to-cyan-400 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-white opacity-50" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                NEW
              </div>
            </div>
          </div>
        </div>

        {/* App Benefits Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { number: '10k+', label: 'Downloads', icon: <Download className="w-5 h-5" /> },
            { number: '4.8', label: 'App Rating', icon: <Star className="w-5 h-5" /> },
            { number: '500+', label: 'Daily Users', icon: <Smartphone className="w-5 h-5" /> },
            { number: '24/7', label: 'Support', icon: <Download className="w-5 h-5" /> }
          ].map((stat, index) => (
            <div key={index} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.number}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileApp;