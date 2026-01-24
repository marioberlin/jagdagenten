---
description: "Start building a new LiquidOS app from natural language"
argument-hint: "DESCRIPTION [--deep] [--agent] [--resources]"
---

# Build App

You are initiating a new app build in LiquidOS. Follow these steps:

1. Parse the user's description from $ARGUMENTS
2. Determine options:
   - If `--deep` is present: use researchMode "deep"
   - If `--agent` is present: set hasAgent to true
   - If `--resources` is present: set hasResources to true
3. Create a build request via the Builder API:
   ```
   POST http://localhost:3000/api/builder/create
   Body: { "description": "<parsed description>", "researchMode": "standard|deep", "hasAgent": true|false, "hasResources": true|false }
   ```
4. Display the returned build plan (appId, phase, features)
5. Ask for approval before proceeding
6. On approval, start the build:
   ```
   POST http://localhost:3000/api/builder/{buildId}/execute
   ```
7. Monitor progress by polling:
   ```
   GET http://localhost:3000/api/builder/{buildId}/status
   ```
8. Report completion or failure to the user

## Drop Folder

Before approving, remind the user they can drop context files into:
`.builder/context/{appId}/`

Files like design.md, api-spec.yaml, screenshots, or custom skills will be included in the build context.
