# LevelNext Tech Intelligence — Claim Research Notes

## Approved landing-page evidence

| Claim | How it may be used | Source |
|---|---|---|
| The World Economic Forum’s 2025 Future of Jobs Report draws on data from more than 1,000 companies; it states that nearly 40% of job skills are expected to change and 63% of employers cite skills gaps as the principal barrier to business transformation. | Establish the external urgency around technology and human skills, without asserting that every technical organisation has the same gap. | [WEF press release, 2025](https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/) |
| A 2023 workplace-coaching meta-analysis reports prior meta-analytic evidence with significant effects ranging from **g = 0.43** for coping to **g = 0.74** for goal-directed self-regulation; its review concludes that workplace coaching is associated with positive organisational outcomes. | Use a careful evidence statement about research results. Do **not** convert these effect sizes into an unqualified return-on-investment or a guaranteed organisational outcome. | [Cannon-Bowers et al., *Frontiers in Psychology*, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10597717/) |
| WEF lists AI and big data, networks and cybersecurity, and technological literacy among the fastest-growing skills; it also highlights analytical thinking, resilience, flexibility, and collaboration as important human capabilities. | Position Tech Intelligence as combining technical context with judgment and collaboration rather than treating coaching as technical training. | [WEF press release, 2025](https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/) |

## Copy guardrails

- Do not claim that coaching will cause a fixed percentage improvement in productivity, delivery speed, retention, or revenue.
- Attribute all evidence cards to their source and link to the primary source in the page’s sources panel.
- Present the “cost of no coaching” as plausible operational risks—such as slower decisions, unresolved cross-functional friction, and repeated rework—not as unsubstantiated financial savings.
- State that LevelNext Tech Intelligence is part of the broader LevelNext platform, and distinguish currently available components from future or organisation-configured modules.

## External coaching evidence for the buyer-resource library

| Finding | Publication-safe use | Source |
|---|---|---|
| ICF reports that 72% of respondents to the 2023 ICF/HCI *Defining New Coaching Cultures* study acknowledged a relationship between coaching and increased employee engagement. | Describe as external, survey-based evidence of a reported relationship; do not present it as a guaranteed LevelNext outcome. | [ICF, “Coaching Statistics: The ROI of Coaching in 2024” (2024)](https://coachingfederation.org/blog/coaching-statistics-the-roi-of-coaching-in-2024/) |
| An ICF-published case discussion of Microsoft Customer and Partner Solutions cites more than USD 77 million in estimated cost savings and 670.4% ROI for that coaching ecosystem. | Attribute precisely to Microsoft Customer and Partner Solutions and the ICF page. Note that it is an external case example, not a LevelNext forecast or typical result. | [ICF, “The ROI of Coaching: Why It’s Worth the Investment” (2026)](https://coachingfederation.org/blog/the-roi-of-coaching-why-its-worth-the-investment/) |
| The 2023 coaching meta-analysis reports significant prior meta-analytic effects from g = 0.43 (coping) to g = 0.74 (goal-directed self-regulation). | Retain the effect-size terminology and avoid translating it into an ROI claim. | [Cannon-Bowers et al., *Frontiers in Psychology* (2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10597717/) |

Gartner was considered but no publicly accessible Gartner ROI figure was found that could be directly verified for this page. No quantitative ROI or outcome claim is attributed to Gartner unless a primary, publishable Gartner source is later supplied.

## Live scheduling implementation note

TidyCal’s official documentation states that a supported website embed uses its JavaScript loader together with a `div.tidycal-embed` whose `data-path` matches a booking page or booking-type slug. A direct iframe alone is not the documented integration. The booking destination `https://tidycal.com/metaresults/pilot` is publicly reachable. The Tech Intelligence booking section should use TidyCal’s documented embed loader and retain a direct booking-page link as a reliable fallback. Source: <https://help.tidycal.com/article/141-embeding-tidycal-on-your-site>
