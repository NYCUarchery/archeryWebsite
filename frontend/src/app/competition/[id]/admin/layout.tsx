"use client";
import prunePath from "@/utils/prunePath";
import { Tab, Tabs } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [tabValue, setTabValue] = useState(0);
  const currentPath = prunePath(usePathname(), 4);

  return (
    <>
      <Tabs
        centered
        value={tabValue}
        aria-label="Administration board"
        role="navigation"
      >
        <LinkTab
          href="/main"
          label="主面板"
          selected={tabValue === 0}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={0}
        />
        <LinkTab
          href="/participants"
          label="參加者管理"
          selected={tabValue === 1}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={1}
        />
        <LinkTab
          href="/groups"
          label="組別管理"
          selected={tabValue === 2}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={2}
        />
        <LinkTab
          href="/schedule"
          label="賽程"
          selected={tabValue === 3}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={3}
        />
        <LinkTab
          href="/progress"
          label="進度"
          selected={tabValue === 4}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={4}
        />
        <LinkTab
          href="/score_edition"
          label="分數編輯"
          selected={tabValue === 5}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={5}
        />
      </Tabs>
      {children}
    </>
  );
}
interface LinkTabProps {
  currentPath: string;
  label: string;
  href: string;
  selected: boolean;
  setTabValue: (value: number) => void;
  value: number;
}

function LinkTab({
  currentPath,
  label,
  href,
  selected,
  setTabValue,
  value,
}: LinkTabProps) {
  const router = useRouter();
  const props = {
    label,

    selected,
  };
  return (
    <Tab
      component="a"
      onClick={(_event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        router.push(currentPath + href);
        setTabValue(value);
      }}
      aria-current={selected && "page"}
      {...props}
    />
  );
}
