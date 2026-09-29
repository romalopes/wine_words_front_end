import type { PhilosophyData } from "../../types/about";
import { philosophyData } from "../../data/about/philosophy";
import styles from "./AboutPage.module.css";

function PhilosophySection({ data = philosophyData }: { data?: PhilosophyData }) {
  return (
    <>
      <p className={styles.lead}>{data.intro}</p>
      <div className={styles.cardGrid}>
        {data.blocks.map((block, index) => (
          <article key={block.title} className={styles.card}>
            <p className={styles.cardNumber}>
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3>{block.title}</h3>
            <p>{block.description}</p>
          </article>
        ))}
      </div>
    </>
  );
}

export default PhilosophySection;
