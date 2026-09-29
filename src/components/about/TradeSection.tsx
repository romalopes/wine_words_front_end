import type { TradeData } from "../../types/about";
import { tradeData } from "../../data/about/trade";
import styles from "./AboutPage.module.css";

/** Horizontal SVG flowchart of the editorial submission workflow. */
function SubmissionFlowchart({ steps }: { steps: string[] }) {
  const nodeWidth = 150;
  const nodeHeight = 52;
  const gap = 32;
  const width = steps.length * nodeWidth + (steps.length - 1) * gap + 8;
  const height = nodeHeight + 70;
  const y = 10;

  return (
    <figure className={styles.flowFigure}>
      <figcaption className={styles.timelineCaption}>
        Editorial Submission Workflow
      </figcaption>
      <div className={styles.flowScroll}>
        <svg
          className={styles.flowSvg}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Editorial submission workflow"
        >
          <title>Editorial submission workflow</title>
          {steps.map((step, index) => {
            const x = 4 + index * (nodeWidth + gap);
            const isLast = index === steps.length - 1;
            return (
              <g key={step}>
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="10"
                  fill={isLast ? "#681a2a" : "#fffaf4"}
                  stroke={isLast ? "#681a2a" : "#c9b8a8"}
                  strokeWidth="1.5"
                  className={
                    isLast ? styles.flowNodeFinal : styles.flowNode
                  }
                />
                <text
                  x={x + nodeWidth / 2}
                  y={y + nodeHeight / 2 + 5}
                  textAnchor="middle"
                  fill={isLast ? "#ffffff" : "#241b19"}
                  className={
                    isLast
                      ? `${styles.flowText} ${styles.flowTextOnAccent}`
                      : styles.flowText
                  }
                >
                  {step}
                </text>
                {!isLast && (
                  <g>
                    <line
                      x1={x + nodeWidth + 6}
                      y1={y + nodeHeight / 2}
                      x2={x + nodeWidth + gap - 10}
                      y2={y + nodeHeight / 2}
                      stroke="#766963"
                      strokeWidth="2"
                      className={styles.flowArrowLine}
                    />
                    <polygon
                      points={`${x + nodeWidth + gap - 12},${y + nodeHeight / 2 - 5} ${x + nodeWidth + gap - 2},${y + nodeHeight / 2} ${x + nodeWidth + gap - 12},${y + nodeHeight / 2 + 5}`}
                      fill="#766963"
                      className={styles.flowArrowHead}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className={styles.flowNote}>
        Not every sample is published — inclusion always remains an editorial
        decision.
      </p>
    </figure>
  );
}

function TradeSection({ data = tradeData }: { data?: TradeData }) {
  return (
    <>
      <p className={styles.lead}>{data.intro}</p>

      <div className={styles.twoColumn}>
        <div>
          <h3>What We Accept</h3>
          <ul className={styles.checklist}>
            {data.accepts.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>What We Don't Guarantee</h3>
          <ul className={styles.plainList}>
            {data.doesNotGuarantee.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.divider} />

      <SubmissionFlowchart steps={data.process} />

      <div className={styles.divider} />

      <h3>Editorial Independence</h3>
      <p>Receiving a wine sample does not guarantee a review, a score, publication or positive coverage.</p>
      {data.editorialPolicy.map((policy) => (
        <p key={policy.slice(0, 40)}>{policy}</p>
      ))}

      <div className={styles.divider} />

      <h3>Contact</h3>
      <p>
        For samples, tasting submissions and trade enquiries:{" "}
        <a className="text-link" href={`mailto:${data.contactEmail}`}>
          {data.contactEmail}
        </a>
      </p>
    </>
  );
}

export default TradeSection;
