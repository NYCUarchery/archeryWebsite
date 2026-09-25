"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DatabaseUser } from "@/types/Api";

interface HeaderProps {
  user?: DatabaseUser;
  isUserFetched: boolean;
}

const navigation = [
  { href: "/", label: "首頁" },
  { href: "/recent_competitions", label: "比賽列表" },
  { href: "/my_competitions", label: "我的比賽" },
];

const Header = ({ user, isUserFetched }: HeaderProps) => {
  const pathname = usePathname();

  return (
    <Box component="header" className="home-header">
      <Box className="home-nav-shell">
        <Link className="home-brand" href="/" aria-label="NYCU Archery System 首頁">
          <Box component="img" className="home-brand-mark" src="/logo.svg" alt="" />
          <Box className="home-brand-word">
            <strong>Archery</strong>
            <small>NYCU ARCHERY SYSTEM</small>
          </Box>
        </Link>
        <Box component="nav" className="home-nav-links" aria-label="主要導覽">
          {navigation.map(({ href, label }) => {
            const isCurrent = pathname === href;
            const destination = href === "/my_competitions" && !user
              ? "/login?next=/my_competitions"
              : href;
            return (
              <Link key={href} href={destination} aria-current={isCurrent ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </Box>
        {isUserFetched && user ? (
          <Box className="home-user-top">
            <Typography component="span">{user.real_name}</Typography>
            <Link href="/logout">登出</Link>
          </Box>
        ) : (
          <Button component={Link} href="/login" className="home-login-top">
            登入 <span aria-hidden="true">→</span>
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Header;
