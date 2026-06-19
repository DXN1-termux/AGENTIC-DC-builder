# <div align="center"> MADE WITH ❤️ BY DXN1
<div align="center">

<br/>

```
╔═══════════════════════════════════════════════════════════╗
║     🏰   D I S C O R D   S E R V E R   A R C H I T E C T ║
║          AI-Powered Guild Management via Natural Language  ║
╚═══════════════════════════════════════════════════════════╝
```

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-8A2BE2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![BYOK](https://img.shields.io/badge/BYOK-Bring_Your_Own_Keys-orange?style=flat-square)](#-configuration)
[![No Firebase](https://img.shields.io/badge/Firebase-Not_Required-red?style=flat-square&logo=firebase&logoColor=white)](#-architecture)

<br/>

**Describe what you want. The AI plans it. You confirm. It's done.**

*Channels, categories, roles, messages, moderation — all from a single sentence.*

<br/>

</div>

---

## 🎬 How It Works

```
You type:      "Create a gaming community server with lobbies, ranked channels and a staff team"

AI plans:      [1] Create Category: 🎮 GAMING
               [2] Create Channel: 💬-general       → 🎮 GAMING
               [3] Create Channel: 🏆-ranked-chat   → 🎮 GAMING
               [4] Create Channel: 📣-announcements → 🎮 GAMING
               [5] Create Category: 🎙️ VOICE LOBBIES
               [6] Create Channel: 🔊 Lobby 1       → 🎙️ VOICE LOBBIES
               [7] Create Channel: 🔊 Lobby 2       → 🎙️ VOICE LOBBIES
               [8] Create Role: @Staff   color: #e74c3c
               [9] Create Role: @Member  color: #3498db

You confirm:   y

Bot executes:  ✔ Category "🎮 GAMING" created
               ✔ Channel "💬-general" created
               ✔ Channel "🏆-ranked-chat" created
               ... and so on, live.
```

---

## ⚡ One-Line Install

```bash
curl -sSL https://raw.githubusercontent.com/DXN1-termux/AGENTIC-DC-builder/main/install.sh | bash
```

The installer handles everything:
- ✅ Checks Node.js 18+, git, and npm are installed
- ✅ Clones the repo
- ✅ Installs all dependencies
- ✅ Interactively walks you through your API keys → writes `.env.local`
- ✅ Offers to launch the CLI immediately

---

## 🛠️ Manual Setup

### Prerequisites

| Tool | Minimum Version | Where to get it |
|------|----------------|-----------------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| git | any | [git-scm.com](https://git-scm.com) |
| Google Gemini API Key | — | [aistudio.google.com](https://aistudio.google.com) *(free tier works)* |
| Discord Bot Token | — | [discord.com/developers](https://discord.com/developers/applications) |

### Clone & Install

```bash
git clone https://github.com/DXN1-termux/AGENTIC-DC-builder.git
cd AGENTIC-DC-builder
npm install
```

### Configure

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your keys:

```env
# Required — get yours at https://aistudio.google.com
GEMINI_API_KEY="your-gemini-api-key"

# Optional — CLI will prompt interactively if not set
DISCORD_TOKEN="your-discord-bot-token"
GUILD_ID="your-target-guild-id"
```

> 💡 `DISCORD_TOKEN` and `GUILD_ID` are optional in the file — if you leave them blank, the CLI will ask for them at startup. Great for switching between multiple servers.

---

## 🚀 Running It

### Option A — Terminal CLI *(recommended, zero browser)*

```bash
npm run cli
```

Full ANSI terminal UI with live spinners, server tree visualization, and a colored action plan. Every change is previewed and requires your confirmation before anything touches your server.

**Startup flags:**
```bash
npm run cli -- --help       # full help & usage
npm run cli -- --version    # print version
```

**Runtime commands** (type these at the prompt instead of an instruction):

| Command | What it does |
|---------|-------------|
| `refresh` | Re-fetch the server structure and redisplay the tree |
| `clear` | Clear the screen |
| `help` | Show command reference |
| `exit` / `quit` | Disconnect and exit cleanly |

### Option B — Web GUI

```bash
npm run dev
```

Opens a React-based web interface at [http://localhost:3000](http://localhost:3000). Same AI logic, same Discord execution engine — just wrapped in a browser UI with a visual action plan panel.

---

## 🧱 Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        User Instruction                            │
│         "Add a VIP role with gold color above Moderator"           │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
                 ┌────────────▼────────────┐
                 │    Google Gemini AI     │
                 │    (gemini-2.5-flash)   │
                 │  reads current server   │
                 │  state + your request   │
                 │  outputs structured     │
                 │  JSON action plan       │
                 └────────────┬────────────┘
                              │
                  ┌───────────▼───────────┐
                  │    Action Plan JSON   │
                  │  ─────────────────── │
                  │  CREATE_ROLE: VIP     │
                  │  color: #FFD700       │
                  │  position: above Mod  │
                  └───────────┬───────────┘
                              │
                     User reviews & types y
                              │
                 ┌────────────▼────────────┐
                 │      Discord.js v14     │
                 │   guild.roles.create()  │
                 │   role.setPosition()    │
                 │   live on your server   │
                 └─────────────────────────┘
```

**Two interfaces. One engine.**

```
discord-server-architect/
│
├── cli.ts          ← Terminal UI  ─────────────┐
│                                               ├── Both use the same
├── server.ts       ← Express API + Discord.js ─┤   Gemini prompt schema
│                                               │   and execution engine
└── src/App.tsx     ← React Web UI  ────────────┘
```

**AI Model Fallback Chain** — if one model is rate-limited or unavailable, it automatically falls through:

```
gemini-2.5-flash  →  gemini-2.0-flash-lite  →  gemini-2.0-flash  →  gemini-1.5-flash
```

---

## 🎯 Example Instructions

Just type these at the prompt — no special syntax:

```
"Restructure this into a professional gaming community server"
"Add a VIP role with gold color, hoist it above Moderator"
"Clean up all duplicate channels and organize them into proper categories"
"Send a welcome announcement to the general channel"
"Create a ticket support system with a dedicated category"
"Rename the server to 'The Void' and update the description"
"Timeout @username for 30 minutes for breaking rules"
"Give @username the Moderator role"
"Delete all empty channels"
"Create a complete anime server layout with different genre channels"
```

---

## 🔐 Supported Discord Actions

All 18 actions the AI can plan and execute:

| Action | Description |
|--------|-------------|
| `CREATE_CATEGORY` | Create a channel category group |
| `CREATE_CHANNEL` | Create a text or voice channel (with optional parent category) |
| `DELETE_CHANNEL` | Delete a channel by ID |
| `MODIFY_CHANNEL` | Rename a channel or change its topic |
| `CREATE_ROLE` | Create a role with optional color and permissions |
| `DELETE_ROLE` | Delete a role by ID |
| `MODIFY_ROLE` | Rename or recolor an existing role |
| `MODIFY_SERVER_NAME` | Rename the entire server |
| `SEND_MESSAGE` | Send a message to a specified channel |
| `DELETE_MESSAGES` | Bulk delete messages from a channel |
| `ASSIGN_ROLE` | Assign a role to a member |
| `REMOVE_ROLE` | Remove a role from a member |
| `TIMEOUT_MEMBER` | Timeout a member for N minutes |
| `KICK_MEMBER` | Kick a member from the server |
| `BAN_MEMBER` | Ban a member from the server |
| `VOICE_MUTE_MEMBER` | Server-mute a member in voice |
| `VOICE_DEAFEN_MEMBER` | Server-deafen a member in voice |
| `VOICE_DISCONNECT_MEMBER` | Disconnect a member from a voice channel |

---

## 🤖 Discord Bot Setup

If you haven't set up a Discord bot before, here's the full 2-minute guide:

**1. Create a bot application**

Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** → give it a name.

**2. Get your bot token**

Go to the **Bot** tab → click **Reset Token** → copy the token → paste it as `DISCORD_TOKEN` in `.env.local`.

**3. Enable required intents**

Still in the **Bot** tab, scroll down to **Privileged Gateway Intents** and enable:
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

**4. Invite the bot to your server**

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`
- Bot Permissions: `Administrator` *(or pick individual permissions — see below)*

Copy the generated URL, open it in your browser, and select your server.

**5. Get your Guild ID**

In Discord, enable **Developer Mode** (User Settings → Advanced → Developer Mode). Then right-click your server icon → **Copy Server ID**. Paste it as `GUILD_ID` in `.env.local` or enter it at the CLI prompt.

> **Minimum permissions needed** (if not using Administrator):
> Manage Channels, Manage Roles, Send Messages, Manage Messages, Kick Members, Ban Members, Moderate Members, Mute Members, Deafen Members, Move Members

---

## 🛡️ Security & Privacy

- **No data is ever stored or sent anywhere** except directly to Google's Gemini API and Discord's API.
- **BYOK** — Bring Your Own Keys. Your Gemini API key and Discord bot token never leave your machine.
- `.env.local` is in `.gitignore` and will never be committed.
- The web GUI applies Express rate-limiting (100 req / 15 min per IP) to prevent abuse if hosted.
- All destructive actions (delete channel, kick, ban) require explicit `y` confirmation in the CLI before executing.

---

## 🤝 Contributing

Contributions are very welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to add a new Discord action
- Project structure walkthrough
- Code style guide
- How to submit a PR

---

## 📄 License

[MIT](LICENSE) — free to use, fork, and build on. Just don't sue us.

---

<div align="center">

Made with 💜 and way too much Discord API documentation

</div>
