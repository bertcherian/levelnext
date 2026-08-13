# Leader Intelligence Routing and Dark-Surface Contrast Audit

## Routing correction

The public landing page’s Leader Intelligence journey card previously targeted `/diagnostics/lii`, which opens a diagnostic rather than the Leader Intelligence platform home. The journey card and the footer’s Leader Intelligence link now both target `/home`.

## Dark-surface audit

The audit reviewed the public landing page, Launch Intelligence, Career Transition Intelligence, and Manager Effectiveness pages at desktop and mobile widths. The public landing’s scoped styles already deliberately inherit text color and set readable light text on dark sections. The Career and Manager landing pages use explicit white text utilities on their dark surfaces.

The confirmed systemic risk was the global base stylesheet forcing all headings to navy and all paragraphs to dark text. Those declarations now inherit the surrounding surface color, while the Launch dark outputs section retains explicit warm-ivory text. Automated checks protect the route, the inherited-color safeguard, and contrast ratios for key dark-surface pairs.
