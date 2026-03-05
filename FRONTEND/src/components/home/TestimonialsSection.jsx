// src/components/home/TestimonialsSection.jsx
import { Star } from 'lucide-react';
import EmptyState from '../shared/EmptyState';

const TestimonialsSection = ({ testimonials = [] }) => {
  if (testimonials.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="💬"
            title="No testimonials yet"
            message="Student reviews will appear here"
            compact
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Student Stories</h2>
          <p className="text-gray-600">What our campus community says</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial._id || testimonial.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                  <span className="text-teal-600 font-semibold">
                    {testimonial.user?.firstName?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.user?.firstName || 'Student'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.user?.university || 'University Student'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`w-4 h-4 ${star <= testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;