import { Link } from "react-router-dom";
import type { ContentData } from "../../types/about";
import { contentData } from "../../data/about/content";
import styles from "./AboutPage.module.css";

function ContentSection({ data = contentData }: { data?: ContentData }) {
  return (
    <>
      <p className={styles.lead}>{data.intro}</p>
      <div className={styles.cardGrid}>
        {data.cards.map((card) => (
          <article key={card.title} className={styles.card}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.heroActions}>
        <Link className={styles.primaryButton} to="/wines">
          Explore Wines
        </Link>
        <Link className={styles.secondaryButton} to="/producers">
          Meet the Producers
        </Link>
      </div>
    </>
  );
}

export default ContentSection;
