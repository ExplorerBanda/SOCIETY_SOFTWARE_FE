# EasyBook Web frontend preview

This React, TypeScript and Vite application expands the supplied standalone HTML design into a routeable preview of recovered EasyBook screens.

## Run locally

From PowerShell:

    cd frontend
    npm install
    npm run dev

Open the localhost URL printed by Vite. The dev server binds to 127.0.0.1.

## Source traceability

- src/data/legacyScreens.json contains screen, control, action, grid and source-location metadata extracted from recovered/decompiled.
- src/data/legacyNavigation.json contains recovered MainForm menu groups, click handlers and direct form destinations.
- scripts/extract_legacy_metadata.py regenerates those metadata files from recovered source.
- ../docs/frontend/feature-parity-matrix.md tracks every recovered form and MainForm navigation/action entry.

## Preview boundaries

This is frontend-only. It does not authenticate, connect to SQL, load society data, save or post transactions, calculate interest/loan values, print reports, or export records. Grid rows are synthetic development values and are labelled as such. Controls whose option lists or runtime columns depend on the database remain visibly unconnected.

The original HTML prototype and recovered application source remain unchanged.
