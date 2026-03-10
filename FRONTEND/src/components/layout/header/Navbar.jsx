// Header.jsx
import HeaderTop from "./HeaderTop";
import HeaderMiddle from "./HeaderMiddle";
import HeaderBottom from "./HeaderBottom";

const Header = () => {
  return (
    <header className="w-full bg-white sticky top-0 z-50">
      <HeaderTop />
      <HeaderMiddle />
      <HeaderBottom />
    </header>
  );
};

export default Header;