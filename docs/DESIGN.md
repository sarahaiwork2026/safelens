# SafeLens design

The interface is inspired by incident.io: calm, editorial, lots of white space, serif display headings over a clean sans, hairline borders, pill buttons, product UI shown as real components on warm cream panels, and a vertical timeline as the hero of the incident view. SafeLens borrows structure, spacing, type hierarchy and tone. It never copies incident.io's logo, wording, illustrations or code.

One deliberate difference: incident.io's brand color is orange-red (`#F25533`). In SafeLens red means danger, so the brand is ink and cream, and red, amber and green are reserved for severity.

19 October 2026 update: light is the initial theme regardless of the device preference. A keyboard-accessible sun/moon button stays visible in the header on desktop and mobile. An explicit choice is remembered and controls map styling too. Publicly visible fixture incidents show a neutral Demo badge and a simulated-data notice in the list, detail and map views; alert entries also identify them as demos.

## 1. Reference screenshots

Captured from incident.io on 2026-10-18 at 1440 px wide, in `docs/design/reference/`. Open them before building any screen. Where a screenshot and this file disagree on feel, follow the screenshot. Where they disagree on a SafeLens rule (color, copy, scope), follow this file.

| File | Look at |
|---|---|
| `01-home-hero.png` | Hero: serif headline, one muted sentence, two pill buttons (filled and cream), generous space above and below. |
| `16-crop-hero-type.png` | Close-up of the headline type: weight 400, tight tracking, line height about 1.1. |
| `02-home-full.png` | Page rhythm: product frames on cream panels, hairline section dividers, large serif section headings. Ignore the logo wall, testimonial and orange band. |
| `03-respond.png` | Feature rows: heading left, product UI on a cream panel right. Ignore the orange band. |
| `04-status-pages.png` | Status components and an updates timeline. |
| `10-crop-incident-banner.png` | Incident banner: tinted header, tinted tags, hairline card, meta line with middle dots. Model for the SafeLens alert and severity tints. |
| `11-crop-updates-timeline.png` | Timeline: small colored node, thin vertical line, bold state label, body text, muted timestamp with "(17m later)". Model for the SafeLens timeline. |
| `12-crop-incident-card.png` | Incident card: icon tile, small label above the ID, tabs, status pill with a dot, progress bar. |
| `13-crop-incident-header.png` | Product header: breadcrumb, status pill, compact secondary buttons, document-like body. |
| `14-crop-alert-list.png` | Alert list rows: colored dot, title, "Just now" meta, white cards with hairline borders and generous padding. |
| `15-crop-segmented-control.png` | Segmented control: cream track, white selected pill. Model for the severity toggle. |
| `05-on-call.png`, `06-changelog.png` | More rhythm and spacing examples. Changelog shows the serif page title and cream image panels. |

Measured from the live site:
- Headline: STK Bureau Serif, weight 400, 44 px at a 1024 px viewport (larger at 1440), letter spacing -0.03em, line height 1.1.
- Section heading (h2): same serif, 36 px, letter spacing -0.025em.
- Card heading (h3): STK Bureau Sans, weight 500, 24 px, letter spacing -0.01em.
- Body: STK Bureau Sans 16 px, line height 24 px, muted paragraphs `rgba(22, 22, 24, 0.66)`.
- Ink `#161618`. Cream surfaces `#F8F5F0` and `#F1EBE2`. Hairlines `rgba(22, 22, 24, 0.08)`.
- Buttons: fully rounded, 38 px tall, padding 8 px 16 px, 16 px weight 500. Primary filled, secondary on cream.
- Radii in use: 6, 8, 12, 16 px and full pills. Content max width about 1192 px, text blocks about 840 px.

STK Bureau is a commercial typeface. SafeLens uses free equivalents (section 4).

## 2. Principles

1. **Calm by default, loud only for danger.** The page is ink on white and cream. Color appears only when severity is involved, so a red pulse means something.
2. **Product is the hero.** The landing page shows the real incident view rendered from real pipeline output, framed on a cream panel. No illustrations.
3. **Evidence weight equals visual weight.** Supported looks solid, Contradictory looks split, Unconfirmed looks dashed.
4. **The timeline tells the story.** Every incident reads top to bottom as an evolving account.
5. **Say less.** Headings without subtitles. Labels of one to three words. One supporting sentence on the whole site, in the hero.
6. **Never color alone.** Severity is always color plus icon plus word.

## 3. Color

### 3.1 Tokens (`apps/web/src/styles/tokens.css`)

```css
:root {
  color-scheme: light;
  --bg: #FFFFFF;
  --cream: #F8F5F0;          /* panels, secondary buttons, segmented track */
  --cream-2: #F1EBE2;        /* hover on cream, active segments */
  --surface: #FFFFFF;        /* cards */
  --ink: #161618;            /* text, primary buttons, icons */
  --ink-2: #2A2A2E;          /* primary button hover */
  --muted: #64646A;          /* secondary text, meets AA on white and cream */
  --subtle: #A1A1A6;         /* disabled, decorative dots only, never body text */
  --line: rgba(22, 22, 24, 0.08);
  --line-strong: rgba(22, 22, 24, 0.14);
  --focus: #2F5BDA;          /* focus rings, selected map marker ring, Test Lab progress */
  --overlay: rgba(22, 22, 24, 0.40);

  --high: #D92D20;   --high-tint: #FEF3F2;   --high-tint-2: #FEE4E2;   --high-text: #B42318;   --high-line: #FDA29B;
  --mod: #DC6803;    --mod-tint: #FFFAEB;    --mod-tint-2: #FEF0C7;    --mod-text: #93370D;    --mod-line: #FEC84B;
  --low: #079455;    --low-tint: #ECFDF3;    --low-tint-2: #DCFAE6;    --low-text: #067647;    --low-line: #75E0A7;

  --shadow-frame: 0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px -12px rgb(0 0 0 / 0.14);
  --shadow-pop: 0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -8px rgb(0 0 0 / 0.18);
  --shadow-seg: 0 1px 2px rgb(0 0 0 / 0.08);
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg: #0E0E10;  --cream: #18181B;  --cream-2: #222226;  --surface: #141416;
    --ink: #F2F2F3; --ink-2: #FFFFFF;  --muted: #A0A0A8;    --subtle: #6B6B73;
    --line: rgba(255, 255, 255, 0.08); --line-strong: rgba(255, 255, 255, 0.14);
    --focus: #7B9BFF; --overlay: rgba(0, 0, 0, 0.6);
    --high: #F04438; --high-tint: rgba(240, 68, 56, 0.10); --high-tint-2: rgba(240, 68, 56, 0.18); --high-text: #FDA29B; --high-line: rgba(240, 68, 56, 0.45);
    --mod: #F79009;  --mod-tint: rgba(247, 144, 9, 0.10);  --mod-tint-2: rgba(247, 144, 9, 0.18);  --mod-text: #FEC84B;  --mod-line: rgba(247, 144, 9, 0.45);
    --low: #17B26A;  --low-tint: rgba(23, 178, 106, 0.10); --low-tint-2: rgba(23, 178, 106, 0.18); --low-text: #75E0A7;  --low-line: rgba(23, 178, 106, 0.45);
  }
}
```

In dark mode the primary button inverts: background `--ink` (near white), text `--bg`.

Map these into Tailwind v4 with `@theme inline { --color-ink: var(--ink); ... }` so classes like `bg-cream`, `text-muted`, `border-line`, `text-high-text` exist. Do not use Tailwind's default palette classes (`bg-red-500`, `text-gray-600`, `indigo-*`) anywhere. A lint check fails the build if they appear.

### 3.2 Color rules

- Red, amber and green appear only in: severity pills, the beacon, map markers, timeline nodes, toasts and the red alert, the activity strip, and Test Lab pass and fail.
- Pass and fail in the Test Lab use the low and high tokens, always with "Pass" and "Fail" words and icons.
- Status pills (Open, Escalated, Monitoring, Resolved) are neutral: cream background, ink text, an icon. Never severity colors.
- Links are ink with an underline on hover. No blue body links.
- Contrast: body text 4.5:1 minimum, large text and UI glyphs 3:1. `--muted` passes on `--bg` and `--cream`. Verify every pill's text against its tint.

## 4. Typography

### 4.1 Families

| Role | Family | Source | Notes |
|---|---|---|---|
| Display | Newsreader, weight 400 only | `@fontsource/newsreader` (latin, 400 normal) | Closest free match to STK Bureau Serif. Used for landing headlines, landing section headings, app page titles (`Incidents`, `Test Lab`) and big empty-state headings. |
| UI and body | Inter Variable (weights 400 to 600) | `@fontsource-variable/inter` (latin, wght) | Everything else. Use `tabular-nums` for times, counts and IDs. |
| Urdu script | System fonts | none downloaded | Fallback chain after Inter: `"Noto Nastaliq Urdu", "Urdu Typesetting", "Jameel Noori Nastaleeq", "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif`. Inter has no Arabic glyphs, so the browser picks Urdu glyphs per character. |

```css
--font-display: "Newsreader", "Iowan Old Style", "Georgia", serif;
--font-sans: "Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
  "Noto Nastaliq Urdu", "Urdu Typesetting", "Jameel Noori Nastaleeq", "Noto Naskh Arabic", Tahoma, sans-serif;
```

No monospace font anywhere. Not for IDs, not for times, not for code-like values. The build fails if `font-mono`, `monospace`, `ui-monospace` or `Mono` appears in `apps/web/src`.

Preload the Newsreader woff2 (it renders the LCP headline). Use `font-display: swap` with a metric-adjusted fallback (`size-adjust`, `ascent-override`) to avoid layout shift.

### 4.2 Scale

| Token | Size / line height | Tracking | Family, weight | Use |
|---|---|---|---|---|
| `display-xl` | clamp(44px, 2.4rem + 3vw, 72px) / 1.06 | -0.03em | Newsreader 400 | Landing hero |
| `display-l` | clamp(32px, 1.6rem + 1.6vw, 44px) / 1.1 | -0.025em | Newsreader 400 | Landing section headings |
| `display-m` | 32px / 1.15 (28px mobile) | -0.02em | Newsreader 400 | App page title |
| `title` | 24px / 30px (20px mobile) | -0.01em | Inter 600 | Incident title |
| `heading` | 16px / 24px | -0.005em | Inter 600 | Card and section headings in the app |
| `lead` | 18px / 28px (16px mobile) | -0.01em | Inter 400, muted | The single hero sentence |
| `body` | 16px / 24px | -0.01em | Inter 400 | Forms, landing lists |
| `ui` | 14px / 20px | 0 | Inter 400 or 500 | Tables, panels, timeline body |
| `meta` | 13px / 18px | 0 | Inter 400, muted | Timestamps, captions, table secondary text |
| `pill` | 12px / 16px | 0 | Inter 500 | Pills and badges |

Rules: sentence case everywhere, no all caps, no letter-spaced small labels, weights 400, 500 and 600 only.

### 4.3 User text (reports in any script)

- Every element that shows report text gets `dir="auto"` and `lang` from the detected language: English `en`, Urdu `ur`, Roman Urdu `ur-Latn`, Mixed `ur`.
- Add class `user-text`: `unicode-bidi: plaintext; line-height: 1.7;`. When the language is Urdu or Mixed also add `user-text-urdu`: `line-height: 2; font-size: 1.08em;` (Nastaliq glyphs are tall and look small).
- Never truncate Urdu text mid-glyph with CSS ellipsis on one line. Use `line-clamp` (2 lines in tables, 4 in cards).

## 5. Space, layout and shape

- 4 px grid. Allowed spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- Container: max width 1192 px, side padding 24 px (16 px under 640 px). No horizontal page scroll at 320 px.
- Landing sections: 128 px vertical padding desktop, 80 px mobile. Hairline divider between sections inside the container.
- App pages: 40 px top padding desktop, 24 px mobile. Page title row: title left, controls right, 32 px below.
- Grids: report page `1fr 380px`, incident page `1fr 360px`, gap 32 px. Single column under 1024 px, right column moves below.
- Radii: 6 px chips, 8 px inputs, 12 px cards, 16 px frames and dialogs, full pills for buttons, pills and segmented controls.
- Borders: 1 px `--line` on cards, inputs and tables. Tables have row dividers only, no vertical lines.
- Elevation: cards are flat (border only). Shadows only on the framed product window (`--shadow-frame`), popovers, toasts and dialogs (`--shadow-pop`), and the selected segment (`--shadow-seg`).
- Heights: buttons 40 px (32 small, 48 hero), inputs 40 px, table rows 56 px, top bar 64 px, mobile tab bar 64 px plus safe area.

## 6. Icons and marks

- `lucide-react` only, 16 px in UI text, 14 px in pills, 20 px in buttons with no label, stroke width 1.75.
- Severity icons: High `ShieldAlert`, Moderate `TriangleAlert`, Low `ShieldCheck`.
- Type icons (incident icon tile, map tooltip): suspicious `Eye`, theft `PackageX`, snatching `Smartphone`, robbery `Banknote`, harassment `UserX`, assault `Hand`, firing `Crosshair`, kidnapping `Car`, fire `Flame`, accident `CarFront`, hazard `Zap`, unclear `CircleHelp`. If a name does not exist in the installed lucide version, pick the closest neutral icon and keep the mapping in one file (`components/incident/type-icons.ts`).
- Outcome icons: new `Plus`, added `GitMerge`, escalated `TrendingUp`. Status icons: Open `Circle`, Escalated `TrendingUp`, Monitoring `Activity`, Resolved `CircleCheck`.
- Logo: wordmark "SafeLens" in Inter 600, 18 px, -0.01em, preceded by a 20 px mark: a 2 px ink ring with a 6 px filled dot offset to the upper right (a lens). Inline SVG of at most 6 elements. `favicon.svg` is the mark. `favicon-alert.svg` adds a small `--high` dot in the corner.
- No other custom SVG. Charts are CSS.

## 7. Components

Build each once in `components/ui` or its feature folder, with variants through `cva`. No duplicate button or pill implementations.

### 7.1 Button
| Variant | Look | Use |
|---|---|---|
| primary | `--ink` background, white text, pill, 40 px, padding 0 18 px, 15 px weight 500. Hover `--ink-2`. Press scale 0.98. | One per view region: the main action. |
| secondary | `--cream` background, ink text. Hover `--cream-2`. | Second action, destructive actions with a confirm dialog. |
| ghost | Transparent, ink text. Hover `--cream`. | Tertiary actions, toolbars. |
| icon | 36 px circle, ghost. Always has `aria-label`. | Close, sound toggle. |

Loading: a 16 px spinner replaces the leading icon, the label changes ("Analyzing"), `aria-busy="true"`, disabled. Disabled: 40 percent opacity, no hover. There are no red buttons.

### 7.2 Pills
Height 24 px, padding 0 8 px, pill radius, `pill` type, icon 14 px, gap 4 px.
- **SeverityPill**: tint-2 background, `-text` color, severity icon, word "High", "Moderate" or "Low". Large variant (28 px) in the alert dialog and incident header.
- **StatusPill**: cream background, ink text, status icon.
- **UnverifiedPill**: cream background, muted text, `Info` icon, "Unverified".
- **ClaimLabel**: Supported is solid (ink background, white text, `CheckCheck` icon). Contradictory is outlined (1 px ink border, ink text, `Split` icon). Unconfirmed is dashed (1 px dashed `--line-strong`, muted text, `CircleDashed` icon).
- **EngineBadge**: cream, muted text, `Cpu` icon, "Groq · gpt-oss-120b" or "Local rules". Tooltip explains a fallback.
- **LanguageBadge**: cream, muted text, `Languages` icon, the language name.

### 7.3 SegmentedControl (severity toggle)
Model: `15-crop-segmented-control.png`. Cream track, 4 px padding, 36 px tall. Items are pills, 28 px tall, padding 0 12 px. The selected item has a white background, `--shadow-seg` and ink text. Others are muted, hover ink. Severity items show an 8 px dot in the severity color before the label and the count after it ("High 3"). Radix ToggleGroup (single, roving focus, arrow keys). The selection slides: a white indicator moves with `transform` over 180 ms.

### 7.4 Fields
Label above the field (14 px weight 500), 8 px gap. Inputs: 40 px, 8 px radius, 1 px `--line-strong` border, white background, 12 px padding. Focus: border `--ink` and a 2 px `--focus` ring at 2 px offset. Error: message under the field in `--high-text` with an `AlertCircle` icon, `aria-describedby` and `aria-invalid`. Textarea: 5 rows, grows to 10, then scrolls.

Combobox (area): Radix Popover plus `cmdk`. Each option shows the English name and the Urdu name in muted text on the right (`dir="rtl"`). The last option is `Use "Clifton Block 5"` when the typed text matches nothing.

### 7.5 Cards and frames
- **Card**: white, 1 px `--line`, 12 px radius, 20 px padding (24 px on desktop panels). Card heading uses `heading` type, 16 px below it.
- **CreamPanel**: `--cream` background, 16 px radius, 40 px padding (24 px mobile). Holds product frames on the landing page, like incident.io.
- **FramedWindow**: white, 12 px radius, 1 px `--line`, `--shadow-frame`, a 36 px top bar with three 8 px `--line-strong` dots (neutral gray, never red, amber, green) and a muted page title.

### 7.6 Data display
- **StatTile**: card, 16 px padding, label `meta` muted, value Inter 600 28 px `tabular-nums`. Clickable tiles set the severity filter and show a 2 px ink ring when selected.
- **ActivityStrip**: label "Last 24 hours" (`meta`). 24 bars in a flex row, 3 px gap, 40 px track. Height `4 + 36 * reports / max` px, color is the hour's max severity, empty hours are 4 px `--line-strong`. 2 px radius. Tooltip "9 pm · 3 reports". Model: the uptime bars in `10-crop-incident-banner.png`.
- **DistributionBar**: one 6 px tall pill split into High, Moderate and Low segments by count, under the stat tiles.
- **IncidentRow**: severity pill (96 px column), then `INC-0012` in muted `tabular-nums` and the title "Robbery in Clifton" (14 px, 600), with the summary below in `meta`, clamped to 1 line. Then status pill (with `TrendingUp` when escalated), reports count, relative update time. Row 56 px, hover `--cream`, the whole row navigates (the title is the real link, the row forwards clicks). High rows carry a 2 px `--high` bar on the left edge.
- **ConfidenceMeter**: three 24 x 4 px segments per field. Filled segments: 3 at 0.8 or more, 2 at 0.5 or more, 1 above 0, ink colored. Label and value read by screen readers ("Type confidence high").

### 7.7 Timeline
Model: `11-crop-updates-timeline.png`.
- Vertical 1 px `--line-strong` line, 6 px from the left edge of the list.
- Node: 10 px circle in the severity color of the incident after the event, with a 3 px ring of `--bg`.
- Item: title 14 px weight 600 ("Report added"), body 14 px (report summary, then the original text in `user-text`, 2 lines, with a "Show original" toggle), meta 13 px muted: "9:20 pm · 12 min later · Roman Urdu · Local rules".
- Escalated item: 14 px node with a pulse-free ring of its severity's tint-2, the row on a `-tint` background with 8 px radius and 12 px padding, title "Escalated" and the EscalationPath under it.
- Status changed: "Status set to Monitoring". Opened: "Incident opened". Reopened: "Reopened".
- Order: oldest at the top, so the incident reads as a story. The newest item gets "Latest" in muted text.
- New items (after a refresh) fade in and slide 4 px down, 180 ms.

### 7.8 EscalationPath
Inline: `[type icon] Suspicious activity · Low  →  [type icon] Robbery · High`, each side as a small cream chip with its severity dot, the arrow an `ArrowRight` icon in `--muted`.

### 7.9 EvidencePanel
- Heading "Evidence". Summary row of four compact stats: Reports, Supported, Disputed, Needs verification (number above the word, `tabular-nums`).
- One row per label: ClaimLabel pill, claim name (14 px), and on the right one 8 px ink dot per backing report (max 8, then "+3"). Contradictory rows show `Weapon involved ●● vs ● No weapon`.
- Clicking a row highlights the backing report cards: each flashes its `-tint` background for 1 s and the first scrolls into view.
- Empty: "No claims yet".

### 7.10 Structured result and follow-up
- **StructuredResult**: card. Header: "Report analyzed" plus the EngineBadge on the right. Outcome banner on the incident's severity tint: outcome icon, "New incident INC-0012", "Added to INC-0012" or "INC-0012 escalated", and the EscalationPath when escalated. Then a two-column definition list (label `meta` muted, value `ui`): Language, Type, Area (with `from "Clifton Block 5"` in muted when typed text differs), Time ("Today, 9:20 pm · 10 min ago"), Severity (pill and the reason in muted), Summary, Recommended action, Claims (chips), Confidence (three meters). Footer: "Open incident" (primary), "View on map" (secondary), "New report" (ghost). Rows enter with a 30 ms stagger.
- **FollowUpCard**: card with a 1 px `--mod-line` border. Heading "A few details missing". "Understood" row of chips with check icons for what is already known. Then only the missing fields (Type select, Area combobox, When input with chips). Primary "Continue". It replaces the submit area, the description stays visible above it.
- **Understanding panel** (before submit): cream card, heading "Understanding", four rows (Language, Type, Area, Time). Found values in ink with a `Check` icon. Missing shows "Not found" in muted with a `CircleDashed` icon. Values cross-fade when they change.

### 7.11 Feedback states
- **Skeleton**: `--cream` blocks with a slow opacity shimmer (1.6 s), shaped like the final content. No spinners for page loads.
- **EmptyState**: centered in its container, `display-m` heading, then one or two buttons. No illustration, no paragraph.
- **ErrorState**: heading "Couldn't load {thing}" and a "Try again" button.
- **OfflineBanner**: full-width cream bar under the top bar, `WifiOff` icon, one line.

## 8. Pages

### 8.1 App shell
```
+--------------------------------------------------------------------------------+
| (o) SafeLens      Incidents   Map   Test Lab   About        [● All clear]  [Report] |
+--------------------------------------------------------------------------------+
| page                                                                           |
+--------------------------------------------------------------------------------+
| footer                                                                         |
```
Top bar: 64 px, white, 1 px bottom `--line`, sticky. Nav links 15 px weight 500, active link ink with a 2 px underline offset 6 px, others muted. Right: SeverityBeacon (opens AlertCenter) and the primary "Report" button. Under 768 px: logo and beacon on top, a bottom tab bar with Report, Incidents, Map, Test Lab (icon over label, 64 px, safe-area padding). About moves to the footer.

Footer: 1 px top line, 48 px padding. Left: logo. Middle: About, Test Lab. Right: Police 15, Rescue 1122, Edhi 115, Fire Brigade 16 as `tel:` links. Bottom line in `meta`: the disclaimer sentences from the copy deck.

### 8.2 Landing `/`
```
            Scattered reports, one clear incident story            (display-xl, centered, 2 lines)
   SafeLens reads reports in English, Urdu and Roman Urdu ...       (lead, muted, max 600 px)
              [Report an incident]   [View incidents]               (48 px pills)

  +-------------------------- CreamPanel -------------------------------+
  |   +---------------- FramedWindow: INC-0001 ----------------------+   |
  |   | Robbery in Clifton  [High] [Escalated] [Unverified]          |   |
  |   | Suspicious activity · Low -> Robbery · High                  |   |
  |   | Timeline                         | Evidence                  |   |
  |   |  ● Incident opened               |  [Contradictory] Weapon.. |   |
  |   |  ● Report added (Roman Urdu)     |  [Supported] Motorbike .. |   |
  |   |  ◉ Escalated                     |  [Unconfirmed] Still ..   |   |
  |   +--------------------------------------------------------------+   |
  +----------------------------------------------------------------------+
  -------------------------------------------------------------- hairline
  Write it the way you speak            [CreamPanel: textarea with Urdu text + Understanding panel]
  -------------------------------------------------------------- hairline
  [CreamPanel: timeline with escalation]            Related reports join one thread
  -------------------------------------------------------------- hairline
  Evidence, not verdicts                [CreamPanel: evidence panel]
  -------------------------------------------------------------- hairline
                          From report to responder
   Report -> AI extraction -> Structured incident -> Database -> Related reports -> Escalation -> Map -> Responder view
  -------------------------------------------------------------- hairline
  Limitations                              six items, two columns, hairline between rows
  +---------------------------- CreamPanel ------------------------------+
  |                           See it work                                |
  |              [Run the Test Lab]   [Report an incident]               |
  +----------------------------------------------------------------------+
  footer
```
- Everything inside the frames is real components rendered from `demo-incident.json` (generated by `scripts/build-demo-snapshot.ts` from fixture cluster C01). Frames are `inert` (not focusable) and `aria-hidden`, with a visually hidden text summary for screen readers.
- Feature rows: heading (`display-l`) on one side, CreamPanel on the other, alternating. No paragraph under the heading.
- Pipeline rail: eight small cream pills joined by `ArrowRight` icons, wrapping onto two or three rows on small screens. The current product step is not highlighted. No animation.
- The landing page loads no map, no Test Lab and no report code. It must be the fastest page.

### 8.3 Report `/report`
```
Report an incident                                                   (display-m)
+---------------------------- Card -------------------+   +--- Understanding ---+
| What happened                                        |   | Language  Roman Urdu ✓ |
| [ textarea, dir=auto                              ] |   | Type      Suspicious ✓ |
| Examples  (English) (اردو) (Roman Urdu) (Mixed)      |   | Area      Clifton ✓    |
| Where [ combobox ]          When [ input ]           |   | Time      Not found ○  |
|                             (Just now)(15 min)(1 h)  |   +--------------------+
|                             Today, 9:30 pm           |
| [Analyze report]                                     |
+------------------------------------------------------+
```
After submit, the right column shows StructuredResult (desktop) or the result appears under the form (mobile) and focus moves to its heading. With missing fields, FollowUpCard replaces the submit row.

### 8.4 Incidents `/incidents`
```
Incidents                                   [All | ● High 3 | ● Moderate 4 | ● Low 2]  [Active v]
[Active 9]  [High 3]  [Moderate 4]  [Low 2]
[==========red=====|=====amber========|====green====]           distribution bar
Last 24 hours  ▁ ▁ ▃ ▁ ▁ ▆ ▁ ▁ ▁ ▂ ...                           activity strip
----------------------------------------------------------------------------------
Severity   Incident                                   Status        Reports  Updated
[High]     INC-0012 Robbery in Clifton                [Escalated]   5        2 min ago
           Shop robbery in Clifton by two people...
```
Sorted by severity, then most recent update. The filter is in the URL. The list animates row changes (new rows fade in, removed rows fade out, 150 ms).

### 8.5 Responder view `/incidents/:ref`
```
Incidents / INC-0012
[type icon tile]  Robbery in Clifton                         [View on map]  [Status: Escalated v]
[High] [Escalated] [Unverified]
Suspicious activity · Low  ->  Robbery · High
----------------------------------------------------------------------------------------------
Timeline (card)                                    | Evidence (card)
 ● Incident opened              8:10 pm            |  Reports 5  Supported 2  Disputed 1  Needs verification 1
 ● Report added                 8:25 pm · 15 min   |  [Contradictory] Weapon involved ●● vs ● No weapon
 ◉ Escalated  Suspicious · Low -> Robbery · High   |  [Supported] Motorbike involved ●●
 ● Report added (Urdu)          8:55 pm · 5 min    |  [Supported] More than one person ●●●●
                                                   |  [Unconfirmed] Still ongoing ●
Reports (5)                                        | Details: Area, First report, Latest report, Reports, Languages
 [card] original text (dir=auto) · Urdu · Groq     | Mini map (lazy, 200 px, radius halo)
 ...                                               | Guidance: recommended action for the type
                                                   | Emergency contacts (from JSON, tel: links, source link)
                                                   | Unverified community reports. Follow official guidance.
```
The icon tile is 40 px, 8 px radius, severity tint-2 background with the type icon in the severity text color (model: `12-crop-incident-card.png`). The status control is a Radix Select styled as a secondary pill. There is no dispatch button.

### 8.6 Map `/map`
```
+-- In view (320 px) --+---------------------- map, full bleed ------------------+
| ● Robbery, Clifton   |                                 [All|High|Moderate|Low] |
| ● Fire, Gulshan      |          ◉ (pulsing red)                                |
| ● Theft, Johar       |     ●                       +---- panel (360 px) ----+  |
|                      |               ●             | [High] Robbery in Clifton|  |
|                      |                             | summary, 5 reports       |  |
|                      |                             | [Open incident]          |  |
|                      |                             +--------------------------+  |
|                      |                                   © OpenFreeMap © OSM    |
+----------------------+---------------------------------------------------------+
```
The segmented control floats top right on a white pill with `--shadow-pop`. The panel slides in from the right (240 ms). On mobile, the list is a bottom sheet with a drag handle and the panel replaces it when a marker is selected.

### 8.7 Test Lab `/test-lab`
```
Test Lab                                           [Rules | AI]   [Run 25 reports]  [Reset]
[============================--------] 18 of 25
[Passed 18/18] [Stored 16] [Held 2] [Threads 10]
Coverage (card)                 ✓ Minor, moderate and major incidents
                                ✓ English, Urdu, Roman Urdu and mixed language
                                ○ Escalating incidents ...
Results (table)  ID | Report | Language | Type | Severity | Area | Outcome | Result
                 actual value in ink, expected value under it in muted only when it differs
Threads (table)  Cluster | Incident | Type | Severity | Status | Reports | Labels
```
Rows appear as each step returns (fade in). Failing rows have a `--high-tint` background and list the differences. Reset opens a confirm dialog.

### 8.8 About `/about`
Title, then sections with `display-l` headings: How it works (the pipeline rail), Ethics (four items), Limitations (six items), Free services (name and link per service), Emergency contacts (from JSON, with the source link and the checked date). Max width 840 px.

### 8.9 Not found
`display-m` "Page not found" and a primary "Go to incidents" button.

## 9. Alerts and severity motion

The only attention-seeking motion in the product. Everything else is quiet.

| Level | Beacon | Map marker | Alert |
|---|---|---|---|
| High | Red dot, expanding ring every 0.9 s | Red, expanding ring every 0.9 s | RedAlertDialog |
| Moderate | Amber dot, expanding ring every 2 s | Amber, ring every 2 s | Toast with amber accent, icon pulses 3 times |
| Low | Green dot, steady | Green, steady | Toast with green accent, no pulse |
| None active | Green dot, "All clear" | none | none |

### 9.1 SeverityBeacon (top bar)
Cream pill, 32 px tall: 8 px dot plus label ("All clear", "1 high", "2 moderate", "3 low", always the highest active level). Click opens AlertCenter (Radix Popover, 360 px): heading "Alerts", the session's alerts newest first (severity icon, "{type} in {area}", relative time, link), and an "Alert sound" toggle (`aria-pressed`). Empty: "No alerts yet".

### 9.2 RedAlertDialog
```
+------------------------------------------------ 440 px, 16 px radius ---+
|  (ShieldAlert in a 48 px high-tint-2 circle, two radar rings)   [sound] |
|  High severity incident                               (20 px, 600)      |
|  Robbery in Clifton                                   (16 px, 500)      |
|  Suspicious activity · Low -> Robbery · High          (when escalated)  |
|  Shop robbery in Clifton by two people with pistols.  (14 px, muted)    |
|  INC-0012 · 5 reports · 2 min ago                     (13 px, muted)    |
|  (i) Unverified community report. Follow official guidance.            |
|  Police 15 · Rescue 1122                              (tel: links)      |
|  [Open incident]  [Dismiss]                           +2 more high      |
+-------------------------------------------------------------------------+
```
- Radix AlertDialog: `role="alertdialog"`, focus trapped, initial focus on "Open incident", Escape dismisses.
- Border 1 px `--high-line` plus `box-shadow: 0 0 0 4px var(--high-tint-2)`. The ring pulses three times on open, then stays still.
- Enter: overlay fades in 160 ms, card scales 0.96 to 1 and fades in 200 ms, then one short shake (translateX 4 px, two cycles, 280 ms). Radar rings on the icon expand three times, staggered 0.6 s.
- Title is "Incident escalated" when the alert comes from an escalation.
- Sound toggle (`Volume2` or `VolumeX`): off by default. When on, a two-tone cue (880 Hz then 660 Hz, 0.25 s each, gentle attack and release) is synthesized with Web Audio. No audio files. Played once per dialog, never on page load.
- More than one high alert at once: one dialog, and a "+2 more high" link to `/incidents?level=high`.

### 9.3 Toasts (sonner, custom render)
White card, 12 px radius, 1 px `--line`, `--shadow-pop`, 360 px wide, a 3 px left bar in the severity color. A 28 px tint-2 circle with the severity icon, title 14 px 600 ("Snatching in Saddar"), description 13 px muted ("Moderate · Unverified", or "New incident · Low · Unverified" for the reporter's own submission), and a ghost "View" action. Moderate icons pulse 3 times (2 s). Duration 8 s for Moderate, 5 s for Low, paused on hover. Position top right on desktop, top center on mobile. At most 3 visible.

### 9.4 Tab signals
While an unseen high alert exists: the favicon switches to `favicon-alert.svg` and the document title becomes `(1) SafeLens`. Both reset when the dialog is dismissed or the AlertCenter is opened.

### 9.5 Keyframes (`styles/base.css`)
```css
@keyframes sl-ring { from { transform: scale(1); opacity: 0.55; } to { transform: scale(2.6); opacity: 0; } }
@keyframes sl-radar { from { transform: scale(1); opacity: 0.5; } to { transform: scale(1.9); opacity: 0; } }
@keyframes sl-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes sl-enter { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes sl-flash { from { background: var(--flash, var(--cream-2)); } to { background: transparent; } }

@media (prefers-reduced-motion: no-preference) {
  .pulse-high::after { animation: sl-ring 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
  .pulse-mod::after  { animation: sl-ring 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
}
```
The ring is a pseudo-element with the severity color, `border-radius: 50%`, `inset: 0`, `pointer-events: none`. Animate only `transform` and `opacity`.

## 10. Map styling

- Base style: OpenFreeMap Positron (light) or Dark (dark scheme). Hide POI and transit symbol layers after load. Keep road and area labels.
- Marker: a `<button>` 14 px circle (18 px for 3 to 5 reports, 22 px for 6 or more), severity fill, 2 px `--bg` ring, `--shadow-seg`. Report count inside when 22 px (11 px, white, 600). Pulse ring for High and Moderate as in section 9. Hover or focus: scale 1.15, 120 ms. Selected: 3 px `--focus` outer ring.
- Tooltip: white card, 8 px radius, `--shadow-pop`, 13 px: "Robbery in Clifton", then "5 reports · 2 min ago" in muted.
- Grouping radius halo for the selected incident: fill `--focus` at 8 percent, 1.5 px dashed line `--focus` at 60 percent, label "1.5 km grouping radius" in the panel, not on the map.
- Filtering: non-matching markers fade to 0 and scale to 0.6 over 150 ms, then are removed.
- Camera: `easeTo` 600 ms to a selected marker, `jumpTo` under reduced motion. Never animate on first load.

## 11. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(0.2, 0.8, 0.2, 1) | Enter, expand |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Move, slide |
| `--dur-1` | 120 ms | Hover, press, focus |
| `--dur-2` | 180 ms | Small enter and exit, segmented indicator |
| `--dur-3` | 240 ms | Panels, popovers, sheets |
| `--dur-4` | 320 ms | Dialogs |

Page transitions: 150 ms cross-fade with the View Transitions API where supported. Lists: 30 ms stagger, at most 8 items. Under `prefers-reduced-motion: reduce`: no loops, no shake, no slides, no camera animation, opacity transitions of 120 ms or less only. Severity stays readable through color, icon and word.

## 12. Copy

### 12.1 Rules
- Minimal. Headings of at most 6 words. Buttons of 1 to 3 words. No subtitle or description line under any heading. No eyebrow labels or decorative tags above headings. The landing hero sentence is the only supporting sentence in the product.
- Functional pills (severity, status, claim labels, engine, language, "Unverified") are data, not decoration, and are allowed.
- Sentence case. No exclamation marks. No emoji. No em dashes (use a comma, colon or full stop). Digits for numbers.
- Times in Karachi time: "9:30 pm", "Today, 9:30 pm", "Yesterday, 9:30 pm", relative "Just now", "5 min ago", "2 h ago".
- Describe events, never people. No blame.
- Banned in UI copy: seamless, revolutionary, cutting-edge, unlock, empower, leverage, harness, delve, robust, elevate, supercharge, game-changing, AI-powered, magic, effortless, world-class, next-gen, journey, smart. For reports and claims also: verified, confirmed, proven, true, false, criminal, suspect, culprit.

### 12.2 Copy deck
Every user-facing string lives in `apps/web/src/copy.ts`, keyed as below. Do not invent new strings in components. If a new string is needed, add it to `copy.ts` following these rules.

Global
- Nav: "Incidents", "Map", "Test Lab", "About", button "Report". Mobile tabs: "Report", "Incidents", "Map", "Test Lab". Skip link: "Skip to content".
- Beacon: "All clear", "{n} high", "{n} moderate", "{n} low".
- Footer: "SafeLens complements official emergency services and does not replace them." "Reports are unverified community information." "Academic prototype with simulated data." Contacts: "Police 15", "Rescue 1122", "Edhi 115", "Fire Brigade 16". Map attribution is shown by the map.
- Offline: "You're offline. Your report is kept here."

Landing
- H1: "Scattered reports, one clear incident story"
- Sentence: "SafeLens reads reports in English, Urdu and Roman Urdu, groups related ones into a single incident, and shows what is supported, disputed and still unverified."
- Buttons: "Report an incident", "View incidents".
- Feature headings: "Write it the way you speak", "Related reports join one thread", "Evidence, not verdicts".
- Pipeline heading: "From report to responder". Steps: "Report", "AI extraction", "Structured incident", "Database", "Related reports", "Escalation", "Map", "Responder view".
- Limitations heading: "Limitations". Items: "The prototype uses simulated data." "AI may misunderstand incomplete, unclear or heavily mixed-language reports." "Location accuracy depends on what users provide." "Analysis depends on internet and API availability." "Alerts are basic system alerts, not full emergency notifications." "SafeLens is for academic demonstration and does not replace official emergency services."
- Closing panel: "See it work", buttons "Run the Test Lab", "Report an incident".

Report
- H1 "Report an incident". Labels "What happened", "Where", "When".
- Placeholders: "Describe what you saw", "Area or landmark", "10 min ago, abhi, 9:30 pm".
- "Examples" with chips "English", "اردو", "Roman Urdu", "Mixed". Time chips "Just now", "15 min ago", "1 hour ago".
- Time preview: "Today, 9:30 pm". Unreadable: "Couldn't read that time".
- Combobox: "Search areas", "No matching area", `Use "{text}"`.
- Button "Analyze report", loading "Analyzing".
- Understanding: heading "Understanding", rows "Language", "Type", "Area", "Time", missing "Not found".
- Errors: "Add a few more words about what happened." "Keep it under 1,000 characters." "SafeLens records what happened, not who did it. Remove names or labels about people and try again." "This report can't be accepted. Describe the event only." "Too many reports from this connection. Try again in a minute." "Couldn't verify this browser. Try again." "Couldn't reach SafeLens. Check your connection and try again." "Something went wrong. Try again."
- Follow-up: "A few details missing", "Understood", fields "Type", "Area", "When", select placeholder "Choose a type", button "Continue". Old time: "Use a time within the last 24 hours." Expired: "This report expired. Submit it again." with button "Submit again".
- Result: "Report analyzed". Outcomes "New incident {code}", "Added to {code}", "{code} escalated", duplicate "Already received". Labels "Language", "Type", "Area", "Time", "Severity", "Summary", "Recommended action", "Claims", "Confidence". Engine "Groq · {model}", "Gemini · {model}", "Local rules", tooltip "AI unavailable, analyzed with local rules". Typed location `from "{text}"`. Buttons "Open incident", "View on map", "New report".

Incidents
- H1 "Incidents". Toggle "All", "High", "Moderate", "Low". Status "Active", "Resolved", "All".
- Tiles "Active", "High", "Moderate", "Low". Strip "Last 24 hours", bar tooltip "{hour} · {n} reports".
- Columns "Severity", "Incident", "Status", "Reports", "Updated".
- Empty "No incidents yet" with "Report an incident" and "Run the Test Lab". Filtered "No {level} incidents" with "Show all". Error "Couldn't load incidents" with "Try again".

Responder view
- Breadcrumb "Incidents". Pills "Open", "Escalated", "Monitoring", "Resolved", "Unverified".
- "View on map". Status label "Status", options "Open", "Monitoring", "Resolved".
- Sections "Timeline", "Reports", "Evidence", "Details", "Guidance", "Emergency contacts".
- Timeline "Incident opened", "Report added", "Escalated", "Status set to {status}", "Reopened", "Latest", "{gap} later", "Show original", "Hide original".
- Details "Area", "First report", "Latest report", "Reports", "Languages".
- Evidence "Reports", "Supported", "Disputed", "Needs verification", labels "Supported", "Unconfirmed", "Contradictory", empty "No claims yet".
- Hidden text "Text hidden: contains personal details".
- Disclaimer "Unverified community reports. Follow official guidance."
- Contacts source "Source: Karachi Police emergency directory, checked {date}".
- Not found "Incident not found" with "Back to incidents". Status toasts "Status set to {status}", "Couldn't change the status. Try again."

Map
- Hidden H1 "Map". List "In view", empty "No incidents in view" with "Show all levels".
- Tooltip "{type} in {area}", "{n} reports · {relative}". Panel "Open incident", close label "Close", "1.5 km grouping radius".
- Failure "The map couldn't load" with "Open incident list".

Test Lab
- H1 "Test Lab". Engine "Rules", "AI", AI disabled tooltip "Add a Groq key to enable". Buttons "Run 25 reports", "Reset", running "Running". Progress "{n} of 25". Waiting "Waiting for the free tier limit, {s} s".
- Tiles "Passed", "Stored", "Held", "Threads". Cards "Coverage", "Results", "Threads".
- Coverage items as in `docs/specs/TEST-DATA.md` section 4.
- Columns "ID", "Report", "Language", "Type", "Severity", "Area", "Outcome", "Result", "Cluster", "Incident", "Status", "Reports", "Labels". Pills "Pass", "Fail". "Expected {value}".
- Reset dialog "Reset test data?" with "Reset" and "Cancel".

About
- H1 "About SafeLens". Sections "How it works", "Ethics", "Limitations", "Free services", "Emergency contacts".
- Ethics: "Reports are evidence, not proof." "No facial recognition, no labelling people as criminals, no accusations, no crime prediction and no automatic police dispatch." "Emergency contacts come only from official sources." "Alerts always say when information is unverified."

Alerts
- Dialog "High severity incident" or "Incident escalated", "{type} in {area}", "{code} · {n} reports · {relative}", "Unverified community report. Follow official guidance.", "+{n} more high", "Open incident", "Dismiss", sound labels "Turn alert sound on", "Turn alert sound off".
- Toasts "{type} in {area}", "{Level} · Unverified", own "{Outcome} · {Level} · Unverified", combined "{n} new incidents" with "View all", away "{n} updates while you were away" with "View".
- AlertCenter "Alerts", "No alerts yet", "Alert sound".

Not found: "Page not found", "Go to incidents".

## 13. Visual anti-slop rules

Do not ship any of these:
- Gradients, glows, glassmorphism, background blur, noise textures, blobs, particles, decorative dot grids.
- Emoji, sparkle or "AI" icons, "AI-powered" badges, robot imagery.
- Stock photos, illustrations, 3D renders, avatars, fake logos, testimonials, fake metrics ("Trusted by 10,000 users").
- Eyebrow labels, subtitle lines under headings, "New" or "Beta" tags.
- Red, amber or green used for decoration, including window-chrome dots.
- Shadows on ordinary cards. Borders thicker than 1 px except focus and selection rings.
- Monospace fonts, all-caps labels, letter-spaced small caps.
- More than one primary button in a view region. Centered body text outside the hero and empty states.
- Infinite animations other than the High and Moderate pulses. Parallax, scroll-jacking, typing effects, counting-up numbers, confetti.
- Hand-written SVG beyond the logo mark and two favicons. No SVG charts, no traced illustrations, no inline SVG longer than about 20 lines.
- Placeholder content of any kind: lorem ipsum, "Coming soon", `href="#"`, buttons that do nothing.

## 14. Accessibility

- WCAG 2.2 AA. Axe runs on every page in Playwright with zero violations.
- Visible focus on every interactive element: 2 px `--focus` ring at 2 px offset.
- Skip link, landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, ordered headings.
- Full keyboard use: segmented controls with arrow keys, combobox with arrows and Enter, dialogs trap focus and restore it, map markers are buttons reachable by Tab, the map list mirrors the markers for keyboard and screen reader users.
- `aria-live="polite"` on the Understanding panel, result and follow-up regions. Toasts are announced by sonner. The red alert is an `alertdialog`.
- Touch targets at least 40 by 40 px (pills inside rows are not targets on their own).
- Severity is never color alone. Pass and fail are never color alone.
- `lang` and `dir="auto"` on all user text. Respect `prefers-reduced-motion` and `prefers-color-scheme`.
