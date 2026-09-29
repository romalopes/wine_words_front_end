import type { ReactNode } from "react";
import type { AboutTab } from "../../types/about";
import styles from "./AboutPage.module.css";

interface AboutSectionProps {
  id: AboutTab;
  title: string;
  active: boolean;
  children: ReactNode;
}

/** Generic tab-panel wrapper: renders its children only when active. */
function AboutSection({ id, title, active, children }: AboutSectionProps) {
  if (!active) {
    return null;
  }

  return (
    <section
      id={`about-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`about-tab-${id}`}
      className={styles.panel}
    >
      <h2 className={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default AboutSection;
