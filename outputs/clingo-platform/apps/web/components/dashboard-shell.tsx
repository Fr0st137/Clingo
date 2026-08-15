"use client";

import { ReactNode, useEffect, useState } from "react";
import { accountProfileToSidebarUser, getAccountProfile } from "../lib/account";
import { Sidebar, SidebarUser } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  active: string;
  children: ReactNode;
  user?: SidebarUser;
};

export function DashboardShell({ active, children, user }: DashboardShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountUser, setAccountUser] = useState<SidebarUser | undefined>(user);

  useEffect(() => {
    setAccountUser(user);
  }, [user]);

  useEffect(() => {
    const email = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("clingo-user-email="))
      ?.split("=")[1];

    if (!email) {
      return;
    }

    let isMounted = true;

    getAccountProfile(decodeURIComponent(email))
      .then((profile) => {
        if (isMounted) {
          setAccountUser(accountProfileToSidebarUser(profile) ?? user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccountUser(user);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <>
      <Topbar isMenuOpen={isMenuOpen} onMenuToggle={() => setIsMenuOpen((value) => !value)} />
      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-4 pt-[122px] md:grid-cols-[320px_minmax(0,1090px)] md:gap-[30px] md:px-0 md:pt-[90px]">
        <div className="hidden md:block">
          <Sidebar active={active} user={accountUser} />
        </div>
        {isMenuOpen ? (
          <div className="fixed inset-x-4 top-[118px] z-40 md:hidden">
            <Sidebar active={active} compact user={accountUser} />
          </div>
        ) : null}
        <div className={isMenuOpen ? "pointer-events-none blur-sm md:pointer-events-auto md:blur-0" : ""}>{children}</div>
      </main>
    </>
  );
}
