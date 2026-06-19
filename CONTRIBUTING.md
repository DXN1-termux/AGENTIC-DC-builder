# Contributing to Discord Server Architect

First off — thanks for taking the time to contribute! 🎉

This is an open-source project and any contribution, from fixing a typo to adding a whole new Discord action, is welcome.

---

## Getting Started

```bash
git clone https://github.com/DXN1-termux/AGENTIC-DC-builder.git
cd AGENTIC-DC-builder
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
```

Run the CLI in dev mode:
```bash
npm run cli
```

Run the Web GUI:
```bash
npm run dev
```

Type-check the full codebase:
```bash
npm run lint
```

---

## Project Structure

```
discord-server-architect/
├── cli.ts              # Standalone terminal CLI — modify this for CLI changes
├── server.ts           # Express backend + Discord.js execution engine
├── src/
│   ├── App.tsx         # React web frontend
│   ├── components/     # Reusable UI components
│   └── types.ts        # Shared TypeScript types
├── install.sh          # One-liner curl installer script
├── .env.example        # Template for environment variables
└── README.md
```

---

## Adding a New Discord Action

1. **Add it to the Gemini `responseSchema` enum** in both `server.ts` and `cli.ts` under the `type.enum` array.
2. **Implement the case handler** in both:
   - `server.ts`: inside the `/api/execute-actions` route's `switch` block
   - `cli.ts`: inside the action execution loop's `switch` block
3. **Add a pretty-print case** in `cli.ts`'s `printActionPlan()` function.
4. **Document it** in this file and in `README.md`.

> ⚠️ Don't touch the Gemini prompt schema or the `generateContentWithRetry` logic unless you know what you're doing — it's fragile.

---

## Code Style

- TypeScript everywhere. No `any` if you can avoid it.
- Keep functions short and focused.
- Use ANSI color codes via the existing escape string pattern (e.g., `\x1b[32m`).
- No external UI libraries. CLI output should be pure ANSI terminal art.

---

## Submitting a PR

1. Fork the repo.
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes.
4. Run `npm run lint` and fix any TypeScript errors.
5. Open a PR with a clear description of **what** you changed and **why**.

---

## Reporting Bugs

Open an issue with:
- What you did
- What you expected
- What actually happened
- Node.js version (`node --version`) and OS

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
