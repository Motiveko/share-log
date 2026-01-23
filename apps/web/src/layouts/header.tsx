import { Link } from "react-router";
import { Button } from "@web/components/ui/button";
import { useAuthStore } from "@web/features/auth/store";

function Header() {
  const { logout, user } = useAuthStore();
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b bg-background shrink-0">
      <Link to="/" className="font-semibold text-lg">
        ShareLog
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {user?.nickname || user?.email || "프로필"}
        </Link>
        <Button variant="ghost" size="sm" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </header>
  );
}

export default Header;
