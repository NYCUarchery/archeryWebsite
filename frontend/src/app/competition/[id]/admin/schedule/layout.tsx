"use client";
import prunePath from "@/utils/prunePath";
import { Tab, Tabs } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [tabValue, setTabValue] = useState(0);
  const currentPath = prunePath(usePathname(), 5);

  return (
    <>
      <Tabs
        centered
        value={tabValue}
        aria-label="schedule panel"
        role="navigation"
      >
        <LinkTab
          href="/activation"
          label="賽程開啟"
          selected={tabValue === 0}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={0}
        />
        <LinkTab
          href="/qualification"
          label="資格賽"
          selected={tabValue === 1}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={1}
        />
        <LinkTab
          href="/elimination/1"
          label="個人對抗賽"
          selected={tabValue === 2}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={2}
        />
        <LinkTab
          href="/elimination/3"
          label="團體對抗賽"
          selected={tabValue === 3}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={3}
        />
        <LinkTab
          href="/elimination/2"
          label="混雙對抗賽"
          selected={tabValue === 4}
          currentPath={currentPath}
          setTabValue={setTabValue}
          value={4}
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
