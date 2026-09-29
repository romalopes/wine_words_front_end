import { useState } from "react";
import type { AboutTab, AboutTabData } from "../../types/about";
import { heroData } from "../../data/about/hero";
import AboutHero from "./AboutHero";
import AboutTabs from "./AboutTabs";
import AboutSection from "./AboutSection";
import AboutSectionContent from "./AboutSectionContent";
import MeetKasiaSection from "./MeetKasiaSection";
import PhilosophySection from "./PhilosophySection";
import ContentSection from "./ContentSection";
import CredentialsSection from "./CredentialsSection";
import TradeSection from "./TradeSection";
import AboutCTA from "./AboutCTA";
import styles from "./AboutPage.module.css";

const TABS: AboutTabData[] = [
  { id: "about", label: "About" },
  { id: "kasia", label: "Meet Kasia" },
  { id: "philosophy", label: "Philosophy" },
  { id: "content", label: "Content" },
  { id: "credentials", label: "Credentials" },
  { id: "trade", label: "Trade" },
];

function AboutPage() {
  const [activeTab, setActiveTab] = useState<AboutTab>("about");

  return (
    <main className="about-page">
      <div className={styles.page}>
        <AboutHero hero={heroData} />

        <AboutTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <AboutSection id="about" title="About" active={activeTab === "about"}>
          <AboutSectionContent />
        </AboutSection>

        <AboutSection
          id="kasia"
          title="Meet Kasia"
          active={activeTab === "kasia"}
        >
          <MeetKasiaSection />
        </AboutSection>

        <AboutSection
          id="philosophy"
          title="Our Philosophy"
          active={activeTab === "philosophy"}
        >
          <PhilosophySection />
        </AboutSection>

        <AboutSection
          id="content"
          title="What You'll Find"
          active={activeTab === "content"}
        >
          <ContentSection />
        </AboutSection>

        <AboutSection
          id="credentials"
          title="Credentials"
          active={activeTab === "credentials"}
        >
          <CredentialsSection />
        </AboutSection>

        <AboutSection
          id="trade"
          title="Trade & Submissions"
          active={activeTab === "trade"}
        >
          <TradeSection />
        </AboutSection>

        <AboutCTA />
      </div>
    </main>
  );
}

export default AboutPage;
