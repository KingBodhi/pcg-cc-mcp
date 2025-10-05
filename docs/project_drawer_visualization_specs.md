# Project Drawer Visualization Implementation Specs

These specs expand three high-utility concepts into actionable feature blueprints. Each section covers goals, primary data requirements, UI behaviour, and a suggested implementation stack so engineering and design can iterate quickly.

---

## 1. Flowfield Atlas

**Purpose**
- Provide an at-a-glance sense of workload distribution across boards and pods.
- Highlight pods that act as cross-board bridges and boards accumulating stale tasks.

**Core Metaphor**
- Project node at the centre.
- Boards orbit as anchor nodes.
- Pods and tasks become animated currents; current width = volume, glow = recency.

**Data Mapping**
- `Project`: single root node (id, name).
- `Boards`: `id`, `name`, `board_type`, aggregate metrics (task count, avg age, active pods).
- `Pods`: `id`, `name`, associated board(s), task counts by status.
- `Tasks/Assets`: optionally sampled for tooltips (id, title, due date, status).
- Edge weights: preferred order—(board ↔ pod): sum of pod tasks scoped to board, (pod ↔ task): number of tasks/assets, or recency decay.

**Interactions**
- Hover board: emphasise currents feeding that board, surface metrics (tasks open, % done, most recent asset).
- Hover pod: highlight connected boards + present pod stats.
- Click board: drill-in link to canonical board view; optionally freeze simulation.
- Time slider: decay edge brightness based on `updated_at`.

**Visual System**
- Force-directed layout (D3-force or regl + force atlas).
- Board orbit radius proportional to strategic weight or static (executive furthest, brand mid, etc.).
- Currents as Catmull–Rom splines with noise offsets for organic flow.
- Colour palette tied to board_type (`executive` amber, `brand` rose, `dev` sky, `social` emerald, `custom` slate).

**Implementation Notes**
- Use WebGL via regl or Pixi.js for performant particle animation.
- Pre-compute metrics through existing API or add `/projects/:id/boards/summary` endpoint returning board and pod aggregates (counts, recency buckets).
- Cache simulation positions per session to avoid re-layout thrash.

---

## 2. Multiverse Timelines

**Purpose**
- Clarify sequencing across the four primary boards.
- Reveal cross-board dependencies and timing gaps.

**Core Metaphor**
- Four parallel horizontal lanes (Executive, Brand, Dev, Social).
- Nodes plotted by start/end/due dates.
- Wormhole connectors show linked tasks/assets across boards (shared pods, dependencies).

**Data Mapping**
- `Boards`: `id`, `type` (for lane ordering), colour.
- `Tasks/Assets`: `id`, `title`, `status`, `start_at`, `due_at`, `updated_at`, `board_id`, `pod_id`.
- `Dependencies`: adjacency list (task ↔ task, asset ↔ task) or deduced via `related_ids`.
- `Pods`: for tooltips (owner, members) and to tint connector lines.

**Interactions**
- Horizontal pan/zoom with timeline scrubber (week/month/quarter).
- Hover node: display mini-card (title, owner, due date, confidence) and highlight connectors.
- Click wormhole: open dependency modal with full details.
- Filter chips: status, pod, tag, priority.
- Optional mini-map overview for long timelines.

**Visual System**
- Each lane = coloured band with subtle gradient; nodes styled as capsules (status-coded border).
- Wormholes: Bézier curves between lanes, thickness based on dependency strength (# shared pods or asset size).
- Background grid (time markers), vertical markers for today, milestone events.

**Implementation Notes**
- React + d3-scale + react-zoom-pan-pinch for interaction.
- Introduce API endpoint `/projects/:id/timeline` returning tasks/assets with temporal metadata + dependency matrix.
- Use virtualization (e.g. react-use-measure + canvas) if nodes >1k.
- Provide export (PNG/PDF) for exec reporting.

---

## 3. Pod Metro Map

**Purpose**
- Communicate pod coverage and shared responsibilities across boards.
- Quickly identify pods without active tasks or boards with thin coverage.

**Core Metaphor**
- Transit map: each pod is a coloured line with stations representing board-specific tasks/assets.
- Intersections show shared responsibilities (pod touches multiple boards).

**Data Mapping**
- `Pods`: `id`, `name`, optional `line_color`, roster, primary board.
- `Boards`: `id`, `name`, `board_type`.
- `Stations` (tasks/assets grouped by board + pod): aggregate metrics (# active tasks, next due, backlog age).
- `Transfers`: pods that jointly handle a board; encode as interchange nodes.

**Interactions**
- Hover line: dim others, show pod summary (members, throughput, current sprint).
- Hover station: show board + task stats; click opens filtered board view.
- Toggle: show assets vs tasks vs combined.
- Legend for pods, board icons at termini.

**Visual System**
- SVG with cubic Bézier paths for pod lines; discrete station nodes (circles or diamonds).
- Board icons at endpoints; interchange nodes rendered as concentric circles.
- Optional animated “train” tokens representing active work-in-progress flowing along lines.

**Implementation Notes**
- Precompute layout to avoid manual coordinates: use metro-map-layout algorithms or manual JSON config stored per project.
- Provide API `/projects/:id/pods/metro` returning lines, stations, metrics.
- Render with React + SVGR; consider exporting to PNG for status decks.
- Accessibility: each station/line has descriptive aria-labels; provide colourblind-safe palette (distinct hues + patterns).

---

## Next Steps

1. Align with design on fidelity (wireframe vs high-polish) for each map.
2. Extend backend summaries so the necessary aggregates are readily available.
3. Prototype Flowfield Atlas first (fast feedback on data shape), then Timelines, then Metro Map.
4. Add entries to roadmap and link this spec in Linear/Jira for tracking.
