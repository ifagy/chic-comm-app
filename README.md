# Intramarital Telegraph (Web)

A minimal, real-time web application for synchronized dial-based signaling between remote users.

This project is a browser-based implementation of the physical dual-dial communication device created by **[Thumblegudget](https://www.youtube.com/@Thumblegudget)** in the video:  
[The intramarital telegraph: A hardware solution to marriage?](https://www.youtube.com/watch?v=wahZm0OqbiA)

---

## Live Demo

The project is deployed and ready to use:

- **[telegraph.hassectir.com](https://telegraph.hassectir.com)**
- **[www.telegraph.hassectir.com](https://www.telegraph.hassectir.com)**

Open the link, copy your room code or invitation link from the top bar, and share it with anyone to connect instantly.

---

## Overview

The interface mimics traditional ship engine order telegraphs. Clients in the same room share an interactive rotary wheel with 12 detented positions. Turning the wheel or ringing the signal bell on one client immediately updates the state, sound, and haptics on the connected device.

## Features

- **Real-Time State Synchronization:** Continuous pointer angle and detent position syncing over WebSockets.
- **Customizable Room Markers:** In-app bottom sheet to edit dial labels and section groups per room.
- **Room Routing:** Random 8-character room codes with clipboard link sharing.
- **Progressive Web App:** Offline asset caching and local system notifications.

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **APIs:** HTML5 Canvas, Web Audio API, Web Vibration API, WebSocket API
- **Backend:** Node.js WebSocket server (`ws`)

## Project Structure

```text
chic-comm-app/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   └── vite.svg
│   ├── components/
│   │   ├── StatusDisplay.vue
│   │   └── TelegraphWheel.vue
│   ├── composables/
│   │   ├── useHaptics.js
│   │   ├── useTelegraphAudio.js
│   │   ├── useTelegraphNotifications.js
│   │   ├── useTelegraphSocket.js
│   │   └── useTelegraphWheel.js
│   ├── config/
│   │   └── telegraphNotches.js
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── server.js
└── vite.config.js

```

## Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm

### Installation

1. Clone the repository:
```bash
git clone [https://github.com/ifagy/chic-comm-app.git](https://github.com/ifagy/chic-comm-app.git)
cd chic-comm-app

```


2. Install dependencies:
```bash
npm install

```


3. *(Optional)* Configure environment variables:
By default, the app falls back to `ws://localhost:8080`. For custom setups or deployment, create a `.env` file:
```env
VITE_WS_URL=ws://localhost:8080

```



### Development

1. Start the WebSocket server:
```bash
node server.js

```


2. In a separate terminal, start the Vite development server:
```bash
npm run dev

```


3. Open `http://localhost:5173` across two browser windows or devices to test real-time synchronization.

### Production Build

```bash
npm run build

```

## Credits

Original physical concept, hardware design, and mechanics by **Thumblegudget**.

Reference video: [https://www.youtube.com/watch?v=wahZm0OqbiA](https://www.youtube.com/watch?v=wahZm0OqbiA)

## License

MIT

```
http://googleusercontent.com/youtube_content/1

```