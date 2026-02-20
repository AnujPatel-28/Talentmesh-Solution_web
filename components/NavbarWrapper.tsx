"use client";
import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/signup", "/forgot-password"];

interface NavbarWrapperProps {
    children: React.ReactNode;
    showFooter?: boolean;
}

export default function NavbarWrapper({ children, showFooter = false }: NavbarWrapperProps) {
    const pathname = usePathname();
    const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));

    if (isAuthPage) return null;

    return <>{children}</>;
}
