import type { CredentialsData } from "../../types/about";
import { credentialsData } from "../../data/about/credentials";
import styles from "./AboutPage.module.css";

function CredentialsSection({ data = credentialsData }: { data?: CredentialsData }) {
  return (
    <>
      <div className={styles.twoColumn}>
        <div>
          <h3>Education</h3>
          <ul className={styles.checklist}>
            {data.education.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Professional</h3>
          <ul className={styles.plainList}>
            {data.professional.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.divider} />

      <h3>Current Focus</h3>
      <ul className={styles.checklist}>
        {data.currentFocus.map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>
    </>
  );
}

export default CredentialsSection;
