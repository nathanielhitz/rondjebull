Lees altijd eerst PRD.md. Scoring-logica blijft een pure functie met tests. Vraag akkoord voor je een nieuw scherm begint.

App heet "RondjeBull". De PWA-manifest naam wordt straks ook "RondjeBull" (nog aan te maken).

App moet werken op http://LAN-IP (geen secure context). Gebruik geen secure-context-only API's zonder fallback; test-doelgroep opent de app via netwerk-IP. Zie de inline polyfill in app/layout.tsx voor crypto.getRandomValues / crypto.randomUUID / crypto.subtle.
