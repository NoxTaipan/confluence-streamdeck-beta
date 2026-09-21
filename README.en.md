🇬🇧 **English** | [🇪🇸 Español](README.es.md)

# Confluence Stream Deck (Beta)

[Elgato Stream Deck](https://www.elgato.com/stream-deck) plugin to control **Confluence Suite** without touching the keyboard or mouse — start/stop streams, publish title/tags/category, and send chat messages, all from physical buttons.

Public build by [NOX TAIPAN](https://github.com/NoxTaipan). It connects to your own instance of [confluence-beta](https://github.com/NoxTaipan/confluence-beta) (and optionally [confluence-multistream](https://github.com/NoxTaipan/confluence-multistream) via obs-websocket) running on your own PC — no shared server or account.

<img src="tv.noxtaipan.confluence.sdPlugin/imgs/plugin/icon.png" width="96" alt="Confluence Suite icon" />

## Included actions

| Action | What it does | Needs |
|---|---|---|
| **Multistream Target** | Starts, stops or toggles an RTMP destination (Twitch/YouTube/Kick) configured in Confluence Multistream | obs-websocket + Confluence Multistream |
| **Main Stream (Twitch)** | Starts or stops OBS's native output (the one going to Twitch) | obs-websocket |
| **Start All** | Starts the main stream and every Multistream target at once | obs-websocket + Confluence Multistream |
| **Stop All** | Stops everything above at once | obs-websocket + Confluence Multistream |
| **Restart Confluence** | Restarts the Confluence server (stream info + chat) without opening OBS | your local confluence(-beta) checkout, see Installation |
| **Push Stream Info** | Publishes title/category/tags to Twitch, YouTube and Kick at once | confluence-beta running |
| **Send Chat Message** | Sends a predefined message to the unified chat, to the platforms you choose | confluence-beta running |
| **Create Clip (Twitch)** | Creates a clip of the live Twitch stream and opens the editor in your browser | confluence-beta running, Twitch channel live |
| **Confluence Status** | Shows chat and main-stream status on the dial screen (Stream Deck+) | confluence-beta + obs-websocket |

<p>
  <img src="tv.noxtaipan.confluence.sdPlugin/imgs/actions/start-all/key.png" width="64" />
  <img src="tv.noxtaipan.confluence.sdPlugin/imgs/actions/stop-all/key.png" width="64" />
  <img src="tv.noxtaipan.confluence.sdPlugin/imgs/actions/restart-confluence/key.png" width="64" />
  <img src="tv.noxtaipan.confluence.sdPlugin/imgs/actions/push-info/key.png" width="64" />
  <img src="tv.noxtaipan.confluence.sdPlugin/imgs/actions/chat-send/key.png" width="64" />
  <img src="tv.noxtaipan.confluence.sdPlugin/imgs/actions/create-clip/key.png" width="64" />
</p>

You don't need to use all of them — each action works on its own as long as you give it what's listed in the "Needs" column.

## Installation

**Requirements:** [Stream Deck app](https://www.elgato.com/downloads) 6.5+, [Node.js](https://nodejs.org) 20 (LTS), and [confluence-beta](https://github.com/NoxTaipan/confluence-beta) installed and running (for Push Stream Info / Send Chat Message / Restart Confluence / Status). [OBS Studio](https://obsproject.com/) with [obs-websocket](https://github.com/obsproject/obs-websocket) (bundled since OBS 28+) if you're going to use the streaming actions.

> ⚡ **Quick install:** if you already have (or are about to install) [confluence-beta](https://github.com/NoxTaipan/confluence-beta), run its `install.bat` and pick "Only Stream Deck" (or "Everything") — it downloads this repo, runs `npm install`/`npm run build`/`npm run link` and sets `CONFLUENCE_DIR` for you. Full guide to every way of installing the suite: [INSTALL.en.md](https://github.com/NoxTaipan/confluence-beta/blob/master/INSTALL.en.md) ([Español](https://github.com/NoxTaipan/confluence-beta/blob/master/INSTALL.md)). The manual steps below still work exactly the same.

### 1. Download and build

```bash
git clone https://github.com/NoxTaipan/confluence-streamdeck-beta.git
cd confluence-streamdeck-beta
npm install
npm run build
```

`npm run build` compiles `src/*.ts` into `tv.noxtaipan.confluence.sdPlugin/bin/plugin.js` (that file isn't in the repo, you need to generate it).

### 2. Configure the path to Confluence (only if you'll use "Restart Confluence")

That action needs to know where you cloned `confluence-beta` on your PC. Set it as a user environment variable:

```powershell
[Environment]::SetEnvironmentVariable("CONFLUENCE_DIR", "C:/path/to/your/confluence-beta", "User")
```

Restart the Stream Deck app afterwards so it picks up the new variable. If you don't set it, that specific action will show an alert (❌) when pressed instead of failing silently — the other actions don't need it.

### 3. Install the plugin in Stream Deck

```bash
npm run link
npm run restart
```

`link` registers the plugin in your Stream Deck app (a one-time step); `restart` reloads it every time you rebuild with `npm run build`. The 9 actions will show up under the **"Confluence Suite"** category in Stream Deck's action panel, ready to drag onto a button.

### 4. Connect to OBS and Confluence

Drag any of **"Push Stream Info"**, **"Send Chat Message"** or **"Multistream Target"** onto a button and open its Property Inspector (the panel that appears when you click the button you just placed):

- On **Push Stream Info** / **Send Chat Message**: **Confluence URL** field — defaults to `http://127.0.0.1:7773`, only change it if you run Confluence on a different port.
- On **Multistream Target**: **Host**, **Port** (4455 by default) and **Password** fields for obs-websocket (Tools → obs-websocket Settings inside OBS to view/generate the password).

These three fields are **global settings** — setting them once on any of those actions is enough for all of them.

### 5. Configure each button

- **Multistream Target**: in its Property Inspector, type the exact target name as you added it in the Confluence Multistream dock (e.g. "Youtube", "Kick").
- **Send Chat Message**: type the predefined message and choose which platforms it's sent to.
- **Push Stream Info**: no further configuration needed, it publishes whatever's already loaded in the Confluence dock.

## Full suite

This plugin is one piece of **Confluence Suite** — use it alone or together with the rest:

| Repo | What it is |
|---|---|
| [confluence-beta](https://github.com/NoxTaipan/confluence-beta) | The web panel (OBS dock): title/tags/category + unified Twitch/YouTube/Kick chat. Needs to be running for almost all of this plugin's actions. |
| [confluence-multistream](https://github.com/NoxTaipan/confluence-multistream) | Native OBS plugin for sending video to several RTMP destinations at once. Optional — only needed for the multistream/start-all/stop-all actions. |
| **confluence-streamdeck-beta** (this repo) | Controls all of the above from a Stream Deck. |

## Support

Everything I publish on GitHub — including this repo — is free and open source, always. If it's useful to you and you want to support its upkeep, buy me a coffee:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/noxtaipan)

Separately, on [Gumroad](https://noxtaipan.gumroad.com/) I sell other products — that one does cost money, to be clear.

Issues and PRs are welcome.

## License

[MIT](LICENSE)
