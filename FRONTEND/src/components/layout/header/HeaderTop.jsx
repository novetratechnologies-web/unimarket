// src/components/layout/FullScreenAnnouncement.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Star,
  Gift,
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
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const contentRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Welcome announcements - memoized to prevent recreation
  const announcements = useMemo(() => [
    {
      id: 1,
      title: "🎉 Welcome!",
      subtitle: "Your campus marketplace",
      description: "Buy and sell textbooks, electronics, and more with fellow students.",
      icon: <Star className="w-10 h-10 md:w-12 md:h-12 text-yellow-500" />,
      color: "from-purple-500 to-pink-500",
      features: [
        { icon: <Shield className="w-4 h-4 md:w-5 md:h-5" />, text: "Verified students only" },
        { icon: <MapPin className="w-4 h-4 md:w-5 md:h-5" />, text: "Campus pickup" },
        { icon: <Zap className="w-4 h-4 md:w-5 md:h-5" />, text: "Instant messaging" }
      ],
      cta: { text: "Browse", link: "/listings" }
    },
    {
      id: 2,
      title: "📚 Textbooks",
      subtitle: "Save up to 70%",
      description: "Buy from seniors, sell to juniors. Complete the textbook cycle.",
      icon: <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />,
      color: "from-blue-500 to-cyan-500",
      stats: [
        { value: "500+", label: "Books" },
        { value: "70%", label: "Savings" },
        { value: "24h", label: "Pickup" }
      ],
      cta: { text: "Find", link: "/categories/textbooks" }
    },
    {
      id: 3,
      title: "🎓 Events",
      subtitle: "Campus activities",
      description: "From club meetings to career fairs, stay updated.",
      icon: <Calendar className="w-10 h-10 md:w-12 md:h-12 text-green-500" />,
      color: "from-green-500 to-emerald-500",
      events: [
        { name: "Tech Club", date: "Tomorrow", location: "CS Building" },
        { name: "Career Fair", date: "Feb 15-16", location: "Student Union" },
        { name: "Book Swap", date: "Friday", location: "Library" }
      ],
      cta: { text: "View", link: "/events" }
    },
    {
      id: 4,
      title: "🎁 Bonus!",
      subtitle: "50 points for first listing",
      description: "List within 24h to get bonus points for campus services.",
      icon: <Gift className="w-10 h-10 md:w-12 md:h-12 text-red-500" />,
      color: "from-red-500 to-orange-500",
      bonus: {
        points: 50,
        deadline: "24h",
        benefits: ["Free featured", "Priority support", "Event discounts"]
      },
      cta: { text: "List", link: "/sell" }
    },
    {
      id: 5,
      title: "👥 Safety",
      subtitle: "Community guidelines",
      description: "Keep UniMarket safe for everyone.",
      icon: <Users className="w-10 h-10 md:w-12 md:h-12 text-indigo-500" />,
      color: "from-indigo-500 to-purple-500",
      guidelines: [
        "Meet in public",
        "Verify student ID",
        "Use in-app chat",
        "Report suspicious"
      ],
      cta: { text: "Read", link: "/guidelines" }
    }
  ], []);

  // Check if announcement should be shown
  useEffect(() => {
    const checkAndShowAnnouncement = () => {
      if (!isAuthenticated || !user) {
        setIsVisible(false);
        return;
      }

      try {
        const storageKey = `unimarket_announcements_${user.id}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored === 'dismissed') {
          setIsVisible(false);
          return;
        }

        const hasVisitedBefore = localStorage.getItem(`unimarket_visited_${user.id}`);
        
        if (!hasVisitedBefore) {
          setIsVisible(true);
          localStorage.setItem(`unimarket_visited_${user.id}`, 'true');
          localStorage.setItem(`unimarket_announcements_${user.id}`, 'shown');
        }
      } catch (error) {
        console.error("Error checking announcements:", error);
      }
    };

    const timer = setTimeout(checkAndShowAnnouncement, 1000);
    return () => clearTimeout(timer);
  }, [user, isAuthenticated]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextSlide();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentIndex]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
    setHasInteracted(true);
  }, [announcements.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    setHasInteracted(true);
  }, [announcements.length]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    
    if (dontShowAgain && user) {
      localStorage.setItem(`unimarket_announcements_${user.id}`, 'dismissed');
    }
  }, [dontShowAgain, user]);

  const handleSkipAll = useCallback(() => {
    if (user) {
      localStorage.setItem(`unimarket_announcements_${user.id}`, 'dismissed');
    }
    setIsVisible(false);
  }, [user]);

  const handleGetStarted = useCallback(() => {
    const currentAnn = announcements[currentIndex];
    if (currentAnn.cta?.link) {
      window.location.href = currentAnn.cta.link;
    }
    setIsVisible(false);
  }, [currentIndex, announcements]);

  const handleDotClick = useCallback((index) => {
    setCurrentIndex(index);
    setHasInteracted(true);
  }, []);

  // Prevent body scroll when announcement is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible || !user) return null;

  const currentAnn = announcements[currentIndex];
  const isLastSlide = currentIndex === announcements.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div 
        ref={contentRef}
        className="relative w-full max-w-4xl max-h-[98vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* CLOSE BUTTON - Always visible on mobile */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 p-2 bg-black/50 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all hover:scale-110 text-white focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close announcement"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* MOBILE SWIPE INDICATOR */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
          <div className="w-12 h-1 bg-white/30 rounded-full"></div>
        </div>

        {/* MAIN CONTENT - Stacked on mobile, side by side on desktop */}
        <div className="flex flex-col md:flex-row h-full">
          {/* LEFT SIDE - VISUAL - Compact on mobile */}
          <div className={`md:w-2/5 p-6 sm:p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br ${currentAnn.color} text-white relative overflow-hidden min-h-[200px] md:min-h-full`}>
            {/* BACKGROUND PATTERN */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 sm:-translate-y-24 md:-translate-y-32 translate-x-16 sm:translate-x-24 md:translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-white rounded-full translate-y-12 sm:translate-y-16 md:translate-y-24 -translate-x-12 sm:-translate-x-16 md:-translate-x-24"></div>
            </div>
            
            <div className="relative z-10">
              {/* SLIDE INDICATORS - Hidden on mobile (shown at bottom) */}
              <div className="hidden md:flex items-center gap-2 mb-6">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                      index === currentIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 w-2 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              {/* ICON - Smaller on mobile */}
              <div className="mb-4 md:mb-6">
                {currentAnn.icon}
              </div>
              
              {/* TITLE & SUBTITLE - Smaller on mobile */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3">
                {currentAnn.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl opacity-90 mb-4 md:mb-8">
                {currentAnn.subtitle}
              </p>
              
              {/* PROGRESS TEXT - Mobile only */}
              <p className="text-xs sm:text-sm opacity-75 md:hidden">
                {currentIndex + 1} / {announcements.length}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - CONTENT - Scrollable on mobile */}
          <div className="md:w-3/5 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto max-h-[60vh] md:max-h-full">
            <div className="h-full flex flex-col">
              {/* DESCRIPTION - Condensed on mobile */}
              <div className="mb-4 md:mb-6 lg:mb-8">
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                  {currentAnn.description}
                </p>
              </div>

              {/* DYNAMIC CONTENT - Mobile optimized */}
              <div className="flex-grow mb-4 md:mb-6 lg:mb-8">
                {currentAnn.features && (
                  <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    {currentAnn.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm">
                          {feature.icon}
                        </div>
                        <span className="text-sm md:text-base font-medium text-gray-800">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentAnn.stats && (
                  <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4">
                    {currentAnn.stats.map((stat, idx) => (
                      <div key={idx} className="text-center p-2 md:p-3 lg:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5 md:mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {currentAnn.events && (
                  <div className="space-y-2 md:space-y-3">
                    {currentAnn.events.map((event, idx) => (
                      <div key={idx} className="flex flex-col xs:flex-row xs:items-center justify-between p-3 md:p-4 bg-blue-50 rounded-lg md:rounded-xl hover:bg-blue-100 transition-colors gap-2">
                        <div>
                          <div className="font-medium text-sm md:text-base text-gray-900">{event.name}</div>
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            {event.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                          {event.location}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentAnn.bonus && (
                  <div className="p-4 md:p-5 lg:p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl md:rounded-2xl hover:shadow-lg transition-shadow">
                    <div className="text-center mb-3 md:mb-4">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{currentAnn.bonus.points}</div>
                      <div className="text-sm md:text-base text-gray-700">Bonus Points</div>
                    </div>
                    <div className="text-center text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                      Available for {currentAnn.bonus.deadline}
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      {currentAnn.bonus.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 md:gap-2">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs md:text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentAnn.guidelines && (
                  <div className="space-y-2 md:space-y-3">
                    {currentAnn.guidelines.map((guideline, idx) => (
                      <div key={idx} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="p-0.5 md:p-1">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-teal-500 rounded-full"></div>
                        </div>
                        <span className="text-sm md:text-base text-gray-700">{guideline}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NAVIGATION & ACTIONS - Mobile optimized */}
              <div className="space-y-4 md:space-y-6">
                {/* NAVIGATION DOTS - Mobile only */}
                <div className="flex justify-center gap-1.5 md:hidden">
                  {announcements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`h-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        index === currentIndex 
                          ? 'bg-teal-600 w-6' 
                          : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* ACTION BUTTONS - Stack on mobile, row on larger screens */}
                <div className="flex flex-col xs:flex-row items-center justify-between gap-3">
                  {/* SKIP ALL - Hidden on smallest screens */}
                  {!isLastSlide && (
                    <button
                      onClick={handleSkipAll}
                      className="w-full xs:w-auto px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 order-2 xs:order-1"
                    >
                      Skip
                    </button>
                  )}

                  {/* CTA BUTTON - Full width on mobile */}
                  <button
                    onClick={handleGetStarted}
                    className="w-full xs:flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base order-1 xs:order-2"
                  >
                    {isLastSlide ? "Get Started" : currentAnn.cta.text}
                  </button>

                  {/* NEXT BUTTON */}
                  {!isLastSlide && (
                    <button
                      onClick={nextSlide}
                      className="w-full xs:w-auto px-4 py-2.5 xs:px-3 xs:py-2 text-sm sm:text-base bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500 order-3"
                    >
                      Next
                    </button>
                  )}
                </div>

                {/* DON'T SHOW AGAIN CHECKBOX */}
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    id="dontShowAgain"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2"
                  />
                  <label htmlFor="dontShowAgain" className="text-xs md:text-sm text-gray-600 select-none">
                    Don't show again
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KEYBOARD SHORTCUT HINT - Desktop only */}
        {!hasInteracted && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
            <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm whitespace-nowrap">
              ← → keys • ESC to close
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default FullScreenAnnouncement;