# Key Paths

```
documine/                     # ← GIT ROOT
├── .bmad/                    # BMAD framework (mostly gitignored)
│   ├── _cfg/                 # gitignored (installer configs)
│   ├── core/                 # gitignored (framework engine)
│   ├── docs/                 # gitignored (framework docs)
│   └── bmm/
│       ├── agents/           # gitignored (stock personas)
│       ├── workflows/        # gitignored (stock workflows)
│       ├── docs/             # gitignored (module docs)
│       └── config.yaml       # TRACKED (project-specific)
├── docs/                     # TRACKED (all project artifacts)
│   ├── sprint-artifacts/     # Stories, tech specs, sprint status
│   ├── deployment/           # Deployment guides
│   ├── architecture.md
│   ├── prd.md
│   └── ...
├── src/                      # TRACKED (application code)
├── __tests__/                # TRACKED (test files)
├── supabase/                 # TRACKED (Supabase functions)
├── package.json
└── .git/
```

**BMAD Framework Note:** Framework files exist locally for BMAD operation but are gitignored (like `node_modules`). Only `config.yaml` is tracked. Project artifacts in `docs/` are always tracked.
