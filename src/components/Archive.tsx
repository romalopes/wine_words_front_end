import { Link } from "react-router-dom";
import styles from "./Archive.module.css";

function Archive() {
  return (
    <main className={styles.archive}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <img
            src="/wine_words.jpg"
            alt="Wine Words"
            className={styles.logo}
          />
        </div>
        <h1 className={styles.title}>Wine Words Archive</h1>
        <p className={styles.text}>
          Looking for articles published before the launch of the new Wine Words?
        </p>
        <p className={styles.text}>
          Visit our legacy Wine Words archive:
        </p>
        <Link
          className={styles.archiveLink}
          to="https://kasiasobiesiak.substack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://kasiasobiesiak.substack.com
        </Link>
      </div>
    </main>
  );
}

export default Archive;