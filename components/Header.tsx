import type { ReactNode } from "react";
import styles from "./Header.module.scss";

interface HeaderProps {
  children?: ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/avatar_sanne.png" alt="Sanne" width={48} height={48} className={styles.avatar} />
        <div className={styles.text}>
          <span className={styles.eyebrow}>Sanne</span>
          <span className={styles.title}>XREX · Design planning</span>
        </div>
      </div>
      <div className={styles.actions}>{children}</div>
    </header>
  );
}
