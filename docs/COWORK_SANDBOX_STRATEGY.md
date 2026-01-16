# Cowork Sandbox Strategy: The "Copy-Work-Approve-Merge" Protocol

> **Status:** Draft Analysis
> **Date:** January 16, 2026
> **Context:** Cowork Mode + LiquidContainer Integration

## 1. The Core Problem
Agents need access to user files to perform useful work, but giving them direct write access to a user's primary project folder is dangerous. A single hallucinated `rm -rf` or malformed regex replace could be catastrophic.

## 2. The Proposed Workflow: "Isolated Staging"

Instead of direct access, we implement a strict **Isolation Protocol**:

1.  **Selection**: User selects `~/projects/MyApp`.
2.  **Staging**: System **copies** `~/projects/MyApp` -> `/tmp/liquid-sandbox-[id]`.
3.  **Mounting**: LiquidContainer starts with `/tmp/liquid-sandbox-[id]` mounted as `/app`.
4.  **Execution**: Agent runs tools, edits files, and runs tests inside the container. All changes happen in the `/tmp` copy.
5.  **Verification**: User reviews changes (Diff View).
6.  **Merge**: User clicks "Apply Updates". System syncs `/tmp/liquid-sandbox-[id]` back to `~/projects/MyApp`.

---

## 3. Technical Architecture

### 3.1 Session Lifecycle vs. Container Lifecycle

We must decouple the **Sandbox Session** from the **Docker Container**.
*   **Sandbox Session**: Persists for the duration of the task (minutes/hours). Holds the state of the *filesystem*.
*   **Container**: Ephemeral (seconds/minutes). Can be recycled or restarted. Simply mounts the Sandbox Session path.

### 3.2 File System Architecture

```
/tmp/liquid-sandboxes/
  └── session_[uuid]/           <-- The "Zero Point"
      ├── source/               <-- Unmodified copy (for diffing)
      ├── work/                 <-- Active working directory (Mounted to Container)
      └── artifacts/            <-- Generated outputs (logs, images)
```

**Why keep a `source` copy?**
To generate accurate diffs for the user *before* they verify, without relying on git (which might be dirty or uninitialized in the project).

### 3.3 New Backend Service: `SandboxManager`

We need a dedicated service in `server/src/cowork/sandbox.ts` to manage this lifecycle.

**Responsibilities:**
1.  **`createSandbox(sourcePath: string)`**:
    - Validates `sourcePath` (security check).
    - Creates `/tmp/liquid-sandboxes/session_[id]`.
    - Performs `cp -r` to populate `work` and `source`.
    - Returns `sandboxId`.

2.  **`getDiff(sandboxId: string)`**:
    - Runs a directory diff between `source` and `work`.
    - Returns list of modified files and patch content.

3.  **`applyChanges(sandboxId: string)`**:
    - Copies changed files from `work` back to the original `sourcePath` on the host.
    - **Crucial Safety Step**: Creates a backup of the target files before overwriting (e.g., `filename.bak`).

4.  **`cleanup(sandboxId: string)`**:
    - Removes the temporary directory.

---

## 4. Integration with LiquidContainer

The `CoworkOrchestrator` will coordinate the `SandboxManager` and `ContainerPool`.

**Modified Execution Flow:**

```typescript
// 1. User submits task with path
const sandbox = await sandboxManager.createSandbox(userPath);

// 2. Orchestrator requests container with mount
const container = await containerPool.acquire({
    mounts: [{
        source: sandbox.workPath, // The temp dir on host
        target: '/app',           // The work dir in container
        readonly: false
    }]
});

// 3. Agent Works
await container.execute({ command: 'npm test' }); // Runs in /app (which is sandbox.workPath)

// 4. Verification
const diffs = await sandboxManager.getDiff(sandbox.id);
// User sees diffs in UI...

// 5. Approval
if (userApproves) {
    await sandboxManager.applyChanges(sandbox.id);
}
```

---

## 5. Security Implications

| Threat | Mitigation |
| :--- | :--- |
| **Agent deletes files** | Agent only deletes files in `/tmp`. Original is safe. |
| **Agent exposes secrets** | `.env` files can be excluded from the initial copy via `.gitignore` or explicit blacklist. |
| **Recursive Copy Bomb** | Validate source size before copying. Hard limit (e.g., 500MB). |
| **Symlink Attacks** | Use `cp -r` flags that dereference or ignore symlinks safely to avoid escaping the sandbox. |

---

## 6. Performance Considerations

*   **Copy Overhead**: Copying `node_modules` is slow.
    *   **Optimization**: Use `rsync` with exclusion filters. Ignore `node_modules`, `.git`, `.next`, etc., unless explicitly needed.
*   **Mount Performance**: Docker Bind Mounts on macOS (VirtioFS) are fast enough for most agent tasks.

## 7. User Experience (Frontend)

1.  **File Picker**: User selects specific subfolder (e.g., `src/`) to minimize copy time.
2.  **Sandbox Indicator**: UI shows "Sandboxed Environment: Safe to Edit".
3.  **Diff Reviewer**: Before "Complete", a modal shows "X files modified".
    *   [View Diff]
    *   [Discard Changes]
    *   [Apply to Project]

## 8. Recommendation

Implement this **Staging** approach. It allows the agent to be "destructive" (formatting, refactoring, deleting) without anxiety. It requires building the `SandboxManager` service effectively as a "Transaction Manager" for the filesystem.
