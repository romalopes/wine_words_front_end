import { Link } from "react-router-dom";
import styles from "./AboutPage.module.css";

function AboutCTA() {
  return (
    <section className={styles.cta} aria-labelledby="about-cta-title">
      <h2 id="about-cta-title">Join Wine Words</h2>
      <p>Read free articles or become a subscriber.</p>
      <div className={styles.heroActions}>
        <Link className={styles.primaryButton} to="/reviews">
          Browse Reviews
        </Link>
        <Link className={styles.secondaryButton} to="/subscribe">
          Create Free Account
        </Link>
      </div>
    </section>
  );
}

export default AboutCTA;
