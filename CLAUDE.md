Lees altijd eerst PRD.md. Scoring-logica blijft een pure functie met tests. Vraag akkoord voor je een nieuw scherm begint.

App heet "RondjeBull". PWA-manifest staat in public/manifest.json (naam + thema-kleur #f59e0b + SVG-icoon). Service worker in public/sw.js.

Versienummer in Home komt uit package.json op build-tijd (server component). Update package.json vóór elke release zodat het klopt in productie.

Screen Wake Lock: feature-gedetecteerd met 'wakeLock' in navigator. Vrijgegeven bij unmount GameScreen (win of stop).

App moet werken op http://LAN-IP (geen secure context). Gebruik geen secure-context-only API's zonder fallback; test-doelgroep opent de app via netwerk-IP. Zie de inline polyfill in app/layout.tsx voor crypto.getRandomValues / crypto.randomUUID / crypto.subtle.
