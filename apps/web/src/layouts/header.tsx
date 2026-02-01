import { Link } from "react-router";
import { useAuthStore } from "@web/features/auth/store";
import { NotificationPopover } from "@web/features/notification/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@web/components/ui/dropdown-menu";

function Header() {
  const { logout, user } = useAuthStore();
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b bg-background shrink-0">
      <Link to="/" className="font-semibold text-lg">
        ShareLog
      </Link>
      <div className="flex items-center gap-4">
        <NotificationPopover />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full overflow-hidden border hover:ring-2 hover:ring-ring transition-all focus:outline-none focus:ring-2 focus:ring-ring">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {(user?.nickname?.[0] || user?.email?.[0] || "?").toUpperCase()}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                내 정보
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
