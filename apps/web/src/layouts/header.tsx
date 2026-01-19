import { Link } from "react-router";
import { Button } from "@web/components/ui/button";
import { useAuthStore } from "@web/features/auth/store";

function Divider() {
  return <span className="mx-2">|</span>;
}

function Header() {
  const logout = useAuthStore((state) => state.logout);
  return (
    <header className="flex justify-between py-2 px-5">
      <nav className="p-2">
        <Link to="/">Home</Link> <Divider />
        <Link to="/about">About</Link> <Divider />
        <Link to="/todo">Todo</Link> <Divider />
        <Link to="/videos">Videos</Link>
      </nav>
      <div>
        <Button onClick={logout}>Logout</Button>
      </div>
    </header>
  );
}

export default Header;
