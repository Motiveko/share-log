import { Link } from "react-router";
import { Button } from "@web/components/ui/button";
import { useAuthStore } from "@web/features/auth/store";

function Divider() {
  return <span className="mx-2">|</span>;
}

function Header() {
  const { logout, user } = useAuthStore();
  return (
    <header className="flex justify-between py-2 px-5">
      <nav className="p-2">
        <Link to="/">Home</Link> <Divider />
        <Link to="/about">About</Link> <Divider />
        <Link to="/todo">Todo</Link> <Divider />
        <Link to="/videos">Videos</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link to="/profile" className="text-sm hover:underline">
          {user?.nickname || user?.email || "프로필"}
        </Link>
        <Button onClick={logout}>Logout</Button>
      </div>
    </header>
  );
}

export default Header;
