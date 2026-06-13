# Content Authoring Guide

## Directory Structure

```
content/
├── <subject>/                 # e.g. algebra, linear-algebra
│   ├── en/                    # English locale
│   └── th/                    # Thai locale (future)
│       ├── <lesson>/            # kebab-case lesson slug, e.g. linear-equations
│       │   └── lesson.yaml      # Lesson content (YAML file)
│       └── ...
```

Each lesson is a folder containing a single `lesson.yaml` file. The folder name becomes the URL path: `/learn/<subject>/<lesson>`.

## Lesson YAML Structure

```yaml
title: Linear Equations
subject: algebra
subjectTitle: Algebra
description: "A short summary shown on the TOC and lesson page, supports $LaTeX$."
order: 1
topics:
  - title: One-Step Equations
    description: "$x + 3 = 7$ or $2x = 10$"
practiceModule: null          # null or a PracticeModuleId (see below)
comingSoon: false
relatedTopics:
  - title: Rearranging Equations
    path: /learn/algebra/rearranging-equations
concepts: []                  # Array of Concept (see below)
examples: []                  # Array of Example (see below)
```

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | Display name of the lesson |
| `subject` | string | yes | URL slug for the subject (matches folder name) |
| `subjectTitle` | string | yes | Human-readable subject name |
| `description` | string | yes | Short summary, supports `$LaTeX$` |
| `order` | number | yes | Sort order within the subject (1-based) |
| `topics` | array | yes | List of topics covered, each `{title, description}` |
| `practiceModule` | string / null | no | ID of the practice game (see Practice Modules) |
| `comingSoon` | boolean | yes | `true` = placeholder, `false` = active lesson |
| `relatedTopics` | array | yes | Links to related lessons, each `{title, path}` |
| `concepts` | array | yes | Array of Concept objects |
| `examples` | array | yes | Array of Example objects |

### Concept

```yaml
concepts:
  - title: Inverse Operations
    body: |
      Your explanation here. Supports **bold**, $LaTeX$, icons, lists, and tables.
```

The `body` field supports rich text (see Rich Text Syntax below).

### Example

```yaml
examples:
  - title: One-Step Equation
    problem: "Solve $x + 3 = 7$"
    solution: "$x = 4$"
    steps:
      - "$x + 3 = 7$"
      - "Subtract $3$ from both sides: $x + 3 - 3 = 7 - 3$"
```

## Rich Text Syntax

Use these inside `body`, `description`, `problem`, `steps`, and `solution` fields:

### LaTeX

| Syntax | Renders as |
|---|---|
| `$x + 1$` | Inline math |
| `$$\\int x^2 dx$$` | Display math (block) |

Use `\\` for backslashes inside YAML strings.

### Bold

`**important**` renders as **important**.

### Inline Icons

`{fa:icon-name}` renders a Font Awesome icon.

Available icons: `lightbulb`, `pencil`, `arrow-right`, `play`, `check`, `star`, `times`, `warning`, `info`, `question`, `cog`, `calculator`, `chart-line`, `square-root`, `book`, `bullseye`, `flag`, `graduation`, `infinity`, `minus`, `plus`, `equals`, `arrow-up`, `arrow-down`, `exchange`.

### Paragraphs

Separate paragraphs with a blank line (`\n\n` in YAML double-quoted strings, or a blank line in `|` block scalars).

### Unordered Lists

```
- Item one
- Item two
- Item three
```

Lines starting with `- ` are grouped into a `<ul>`.

### Ordered Lists

```
1. First step
2. Second step
3. Third step
```

Lines matching `/^\d+\.\s/` are grouped into an `<ol>`.

### Tables

```
| Header 1 | Header 2 |
|---|---|
| Cell A1 | Cell B1 |
| Cell A2 | Cell B2 |
```

A separator row (`|---|---|`) marks the first row as a table header. All content inside cells supports inline syntax (bold, icons, LaTeX).

## Practice Modules

To attach a practice game to a lesson:

1. Choose an ID string or add a new one in `src/lib/practice/types.ts`
2. Set `practiceModule: <id>` in the lesson frontmatter
3. Create the game component in `src/components/practice/`
4. Register it in `src/lib/practice/registry.ts`

Current module IDs: `equation-transformation`, `multivariable-equation-system`, `gaussian-elimination`.

## Coming Soon Lessons

For placeholder lessons not yet written:

```yaml
title: Systems of Equations
subject: algebra
subjectTitle: Algebra
description: "Brief description..."
order: 3
topics: []
practiceModule: null
comingSoon: true
relatedTopics: []
concepts: []
examples: []
```

## Adding a New Subject

1. Create `content/<subject>/en/` directory
2. Add subject entry in `src/lib/content/catalog.ts` (if needed)
3. Add lessons under the directory

## Adding a New Lesson (No Code Required)

1. Create `content/<subject>/en/<lesson-slug>/`
2. Create `lesson.yaml` with the fields above
3. Run the build — the new lesson appears automatically on the TOC

## Important Notes

- YAML double-quoted strings: use `\\n\\n` for blank lines, `\\` for LaTeX backslashes; use `|` block scalars for multi-line body text (newlines are literal, no escaping)
- Lesson folder name = URL slug — use kebab-case
- `comingSoon: true` lessons skip concept/example validation
