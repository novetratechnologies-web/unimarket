import { Link } from "react-router-dom";
import { Menu, Store, ChevronDown } from "lucide-react";

const categories = ["Electronics", "Books", "Fashion", "Furniture", "Hostels", "Others"];

const HeaderBottom = () => {
  return (
    <nav className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
        {/* LEFT: MENU */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {categories.map((cat, i) => (
            <Link
              key={i}
              to={`/category/${cat.toLowerCase()}`}
              className="text-gray-700 hover:text-teal-600 font-medium whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* RIGHT: STORE DROPDOWN */}
        <div className="flex items-center gap-1 text-gray-700 hover:text-teal-600 cursor-pointer">
          <Store className="w-4 h-4" />
          <span>Store</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </nav>
  );
};

export default HeaderBottom;
