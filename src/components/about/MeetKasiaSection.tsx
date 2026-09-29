import type { MeetKasiaData } from "../../types/about";
import { kasiaData } from "../../data/about/kasia";
import styles from "./AboutPage.module.css";

/** Vertical SVG timeline of Kasia's professional journey. */
function KasiaTimeline({ timeline }: { timeline: MeetKasiaData["timeline"] }) {
  const rowHeight = 92;
  const firstRowOffset = 36;
  const height = firstRowOffset + (timeline.length - 1) * rowHeight + 36;
  const width = 520;
  const lineX = 90;

  return (
    <figure className={styles.timelineFigure}>
      <figcaption className={styles.timelineCaption}>
        Professional Journey
      </figcaption>
      <svg
        className={styles.timelineSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Kasia's professional timeline from 2013 to today"
      >
        <title>Kasia's professional timeline</title>
        <line
          x1={lineX}
          y1={firstRowOffset - 10}
          x2={lineX}
          y2={height - 26}
          stroke="#766963"
          strokeWidth="2"
          className={styles.timelineLine}
        />
        {timeline.map((entry, index) => {
          const y = firstRowOffset + index * rowHeight;
          return (
            <g key={entry.year + entry.title}>
              <circle
                cx={lineX}
                cy={y}
                r="6"
                fill="#681a2a"
                className={styles.timelineDot}
              />
              <text
                x={lineX - 16}
                y={y + 5}
                textAnchor="end"
                fill="#681a2a"
                className={styles.timelineYear}
              >
                {entry.year}
              </text>
              <text
                x={lineX + 16}
                y={y + 2}
                fill="#241b19"
                className={styles.timelineTitle}
              >
                {entry.title}
              </text>
              {entry.detail && (
                <text
                  x={lineX + 16}
                  y={y + 20}
                  fill="#5d514b"
                  className={styles.timelineDetail}
                >
                  {entry.detail}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Screen-reader friendly ordered list mirroring the SVG. */}
      <ol className={styles.srOnly}>
        {timeline.map((entry) => (
          <li key={entry.year + entry.title}>
            {entry.year}: {entry.title}
            {entry.detail ? ` — ${entry.detail}` : ""}
          </li>
        ))}
      </ol>
    </figure>
  );
}

function MeetKasiaSection({ data = kasiaData }: { data?: MeetKasiaData }) {
  return (
    <>
      <p className={styles.lead}>{data.intro}</p>

      <ul className={styles.roleList} aria-label="Roles">
        {data.roles.map((role) => (
          <li key={role} className={styles.roleChip}>
            {role}
          </li>
        ))}
      </ul>

      <div className={styles.divider} />

      <h3>Biography</h3>
      {data.biography.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}

      <div className={styles.divider} />

      <KasiaTimeline timeline={data.timeline} />

      <div className={styles.divider} />

      <h3>Professional Highlights</h3>
      <ul className={styles.checklist}>
        {data.highlights.map((highlight) => (
          <li key={highlight}>✓ {highlight}</li>
        ))}
      </ul>
    </>
  );
}

export default MeetKasiaSection;
