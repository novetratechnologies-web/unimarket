// src/components/layout/FullScreenAnnouncement.jsx
import { useEffect, useState } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Star,
  Gift,
  Bell,
  Calendar,
  MapPin,
  TrendingUp,
  Users,
  BookOpen,
  Shield,
  Zap
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const FullScreenAnnouncement = () => {
  const { user, isAuthenticated } = useAuth(); // isAuthenticated is a BOOLEAN, not a function
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNextTime, setShowNextTime] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Welcome announcements
  const announcements = [
    {
      id: 1,
      title: "🎉 Welcome to UniMarket!",
      subtitle: "Your campus marketplace is now ready",
      description: "Start buying and selling textbooks, electronics, and more with fellow students.",
      icon: <Star className="w-12 h-12 text-yellow-500" />,
      color: "from-purple-500 to-pink-500",
      features: [
        { icon: <Shield className="w-5 h-5" />, text: "Verified students only" },
        { icon: <MapPin className="w-5 h-5" />, text: "Campus pickup locations" },
        { icon: <Zap className="w-5 h-5" />, text: "Instant messaging" }
      ],
      cta: { text: "Browse Listings", link: "/listings" }
    },
    {
      id: 2,
      title: "📚 Textbook Exchange",
      subtitle: "Save up to 70% on textbooks",
      description: "Buy from seniors, sell to juniors. Complete the textbook cycle on campus.",
      icon: <BookOpen className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500 to-cyan-500",
      stats: [
        { value: "500+", label: "Textbooks available" },
        { value: "70%", label: "Average savings" },
        { value: "24h", label: "Quick pickup" }
      ],
      cta: { text: "Find Textbooks", link: "/categories/textbooks" }
    },
    {
      id: 3,
      title: "🎓 Campus Events",
      subtitle: "Don't miss upcoming campus events",
      description: "From club meetings to career fairs, stay updated with campus activities.",
      icon: <Calendar className="w-12 h-12 text-green-500" />,
      color: "from-green-500 to-emerald-500",
      events: [
        { name: "Tech Club Meetup", date: "Tomorrow, 6 PM", location: "CS Building" },
        { name: "Career Fair 2024", date: "Feb 15-16", location: "Student Union" },
        { name: "Book Swap Event", date: "This Friday", location: "Library" }
      ],
      cta: { text: "View Events", link: "/events" }
    },
    {
      id: 4,
      title: "🎁 First-Time Bonus!",
      subtitle: "Get 50 bonus points for your first listing",
      description: "List your first item within 24 hours to receive bonus points redeemable for campus services.",
      icon: <Gift className="w-12 h-12 text-red-500" />,
      color: "from-red-500 to-orange-500",
      bonus: {
        points: 50,
        deadline: "24 hours",
        benefits: ["Free featured listing", "Priority support", "Event discounts"]
      },
      cta: { text: "List Item Now", link: "/sell" }
    },
    {
      id: 5,
      title: "👥 Community Guidelines",
      subtitle: "Help us keep UniMarket safe",
      description: "Review our community guidelines to ensure a positive experience for everyone.",
      icon: <Users className="w-12 h-12 text-indigo-500" />,
      color: "from-indigo-500 to-purple-500",
      guidelines: [
        "Meet in safe, public campus locations",
        "Verify student ID before meeting",
        "Keep communications on UniMarket",
        "Report suspicious activities"
      ],
      cta: { text: "Read Guidelines", link: "/guidelines" }
    }
  ];

  useEffect(() => {
    const checkAndShowAnnouncement = async () => {
      // 🔥 FIX: isAuthenticated is a boolean, not a function
      if (!isAuthenticated || !user) {
        setIsVisible(false);
        return;
      }

      try {
        // Check if user has seen announcements before
        const hasSeenAnnouncements = localStorage.getItem(`hasSeenAnnouncements_${user.id}`);
        const dontShowAgain = localStorage.getItem(`dontShowAnnouncements_${user.id}`);
        
        // Check if this is a new login (within last 5 minutes)
        const lastLoginTime = localStorage.getItem(`lastLoginTime_${user.id}`);
        const currentTime = Date.now();
        const isNewLogin = !lastLoginTime || (currentTime - parseInt(lastLoginTime)) < 5 * 60 * 1000;
        
        // Show if: new login AND hasn't chosen "Don't show again"
        if (isNewLogin && !dontShowAgain && !hasSeenAnnouncements) {
          setIsVisible(true);
          
          // Mark as seen for this session
          localStorage.setItem(`hasSeenAnnouncements_${user.id}`, 'true');
          
          // Update last login time
          localStorage.setItem(`lastLoginTime_${user.id}`, currentTime.toString());
        }
      } catch (error) {
        console.error("Error checking announcements:", error);
      }
    };

    // Small delay to ensure user context is loaded
    const timer = setTimeout(checkAndShowAnnouncement, 1000);
    return () => clearTimeout(timer);
  }, [user, isAuthenticated]); // 🔥 FIX: isAuthenticated is now a boolean dependency

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
    setHasInteracted(true);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    setHasInteracted(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    
    if (showNextTime) {
      localStorage.setItem(`dontShowAnnouncements_${user?.id}`, 'true');
    }
  };

  const handleSkipAll = () => {
    if (user) {
      localStorage.setItem(`dontShowAnnouncements_${user.id}`, 'true');
    }
    setIsVisible(false);
  };

  const handleGetStarted = () => {
    const currentAnn = announcements[currentIndex];
    if (currentAnn.cta?.link) {
      window.location.href = currentAnn.cta.link;
    }
    setIsVisible(false);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setHasInteracted(true);
  };

  if (!isVisible || !user) return null;

  const currentAnn = announcements[currentIndex];
  const isLastSlide = currentIndex === announcements.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* CLOSE BUTTON */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110"
          aria-label="Close announcement"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* MAIN CONTENT */}
        <div className="flex flex-col md:flex-row h-full">
          {/* LEFT SIDE - VISUAL */}
          <div className={`md:w-2/5 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br ${currentAnn.color} text-white relative overflow-hidden`}>
            {/* BACKGROUND PATTERN */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
            
            <div className="relative z-10">
              {/* SLIDE NUMBER */}
              <div className="flex items-center gap-2 mb-6">
                {announcements.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              {/* ICON */}
              <div className="mb-6">
                {currentAnn.icon}
              </div>
              
              {/* TITLE & SUBTITLE */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {currentAnn.title}
              </h1>
              <p className="text-xl opacity-90 mb-8">
                {currentAnn.subtitle}
              </p>
              
              {/* PROGRESS TEXT */}
              <p className="text-sm opacity-75">
                {currentIndex + 1} of {announcements.length}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - CONTENT */}
          <div className="md:w-3/5 p-8 md:p-12 overflow-y-auto">
            <div className="h-full flex flex-col">
              {/* DESCRIPTION */}
              <div className="mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {currentAnn.description}
                </p>
              </div>

              {/* DYNAMIC CONTENT */}
              <div className="flex-grow mb-8">
                {currentAnn.features && (
                  <div className="space-y-4">
                    {currentAnn.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {feature.icon}
                        </div>
                        <span className="font-medium text-gray-800">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentAnn.stats && (
                  <div className="grid grid-cols-3 gap-4">
                    {currentAnn.stats.map((stat, idx) => (
                      <div key={idx} className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {currentAnn.events && (
                  <div className="space-y-3">
                    {currentAnn.events.map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">{event.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentAnn.bonus && (
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-gray-900">{currentAnn.bonus.points}</div>
                      <div className="text-gray-700">Bonus Points</div>
                    </div>
                    <div className="text-center text-sm text-gray-600 mb-4">
                      Available for {currentAnn.bonus.deadline}
                    </div>
                    <div className="space-y-2">
                      {currentAnn.bonus.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentAnn.guidelines && (
                  <div className="space-y-3">
                    {currentAnn.guidelines.map((guideline, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-1">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-700">{guideline}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NAVIGATION & ACTIONS */}
              <div className="space-y-6">
                {/* NAVIGATION DOTS */}
                <div className="flex justify-center gap-2">
                  {announcements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-teal-600 w-8' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* ARROW NAVIGATION */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevSlide}
                    className="p-3 hover:bg-gray-100 rounded-full transition-all hover:scale-105"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>

                  <div className="flex items-center gap-4">
                    {/* SKIP ALL */}
                    {!isLastSlide && (
                      <button
                        onClick={handleSkipAll}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Skip All
                      </button>
                    )}

                    {/* CTA BUTTON */}
                    <button
                      onClick={handleGetStarted}
                      className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-lg"
                    >
                      {isLastSlide ? "Get Started" : currentAnn.cta.text}
                    </button>

                    {/* NEXT */}
                    {!isLastSlide && (
                      <button
                        onClick={nextSlide}
                        className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all hover:scale-105"
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <button
                    onClick={nextSlide}
                    className="p-3 hover:bg-gray-100 rounded-full transition-all hover:scale-105"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* DON'T SHOW AGAIN CHECKBOX */}
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    id="dontShowAgain"
                    checked={showNextTime}
                    onChange={(e) => setShowNextTime(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="dontShowAgain" className="text-sm text-gray-600">
                    Don't show welcome announcements again
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KEYBOARD SHORTCUT HINT */}
        {!hasInteracted && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
              ← Use arrow keys or click to navigate →
            </div>
          </div>
        )}
      </div>

      {/* KEYBOARD NAVIGATION */}
      <style jsx global>{`
        body {
          overflow: ${isVisible ? 'hidden' : 'auto'};
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .fixed.inset-0 {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FullScreenAnnouncement;