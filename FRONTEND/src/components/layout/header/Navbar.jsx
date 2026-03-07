// Header.jsx
import HeaderTop from "./HeaderTop";
import HeaderMiddle from "./HeaderMiddle";
import HeaderBottom from "./HeaderBottom";

const Header = () => {
  return (
    <header className="w-full shadow-sm sticky top-0 z-[100] bg-white">
      <HeaderTop />
      <HeaderMiddle />
      <HeaderBottom />
    </header>
  );
};

export default Header;