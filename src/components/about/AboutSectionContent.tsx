import type { AboutSectionData } from "../../types/about";
import { aboutData } from "../../data/about/about";
import styles from "./AboutPage.module.css";

/** Content of the first tab: the publication's mission, audience and values. */
function AboutSectionContent({
  data = aboutData,
}: {
  data?: AboutSectionData;
}) {
  return (
    <>
      <p className={styles.lead}>{data.welcome}</p>

      <div className={styles.divider} />

      <h3>Our Mission</h3>
      <p>{data.mission}</p>
      {data.missionDetail.map((detail) => (
        <p key={detail}>{detail}</p>
      ))}

      <div className={styles.divider} />

      <h3>Who Is This For?</h3>
      <ul className={styles.checklist}>
        {data.audience.map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>

      <div className={styles.divider} />

      <h3>Why Wine Words?</h3>
      <div className={styles.cardGrid}>
        {data.values.map((value) => (
          <article key={value.title} className={styles.card}>
            <h4>{value.title}</h4>
            <p>{value.description}</p>
          </article>
        ))}
      </div>
    </>
  );
}

export default AboutSectionContent;
