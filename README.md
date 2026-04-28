<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/globe-2.svg" width="120" height="120" alt="Campus Connect Logo" />
  
  <h1 align="center">Campus Connect <strong><span style="color:#7C3AED">Nexus</span></strong></h1>
  <p align="center">
    <strong>A next-generation, zero-latency distributed computing system for institutional communication.</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="License" />
  </p>
  
  <br/>
</div>

Welcome to the definitive engineering documentation for **Campus Connect**. Built at the bleeding edge of modern web architecture, this platform replaces archaic academic portals with a fluid, massively scalable real-time SPA (Single Page Application).

This document outlines the theoretical, mathematical, and architectural foundations of the system.

---

<details open>
<summary><b>📖 Table of Contents</b></summary>

1. [System Theoretical Formulation](#1-system-theoretical-formulation-category-theory)
2. [Architectural Topology](#2-architectural-topology)
3. [Real-time State Machine Engine](#3-real-time-state-machine-engine)
4. [NoSQL Graph Data Structures](#4-nosql-graph-data-structures)
5. [Mathematical Zero-Trust Security (ABAC)](#5-mathematical-zero-trust-security-abac)
6. [Frontend Rendering Pipeline & Functors](#6-frontend-rendering-pipeline--functors)
7. [Physical Deployment & CI/CD](#7-physical-deployment--cicd)

</details>

---

## 1. System Theoretical Formulation (Category Theory)

We model the internal logic and state transitions of Campus Connect using mathematical abstractions mathematically grounded in **Category Theory**. This ensures a provably deterministic state representation across thousands of concurrent clients.

### 1.1 The Domain Category $\mathbf{Data}$

Let $\mathbf{Data}$ be the category where **Objects** are system entities and **Morphisms** are state transitions.

$$ \text{Obj}(\mathbf{Data}) = \{ \mathcal{U}, \mathcal{C}, \mathcal{A}, \mathcal{M} \} $$
Where:

- $\mathcal{U}$ = Users Space
- $\mathcal{C}$ = Classrooms / Digital Spaces
- $\mathcal{A}$ = Global Alerts
- $\mathcal{M}$ = Asynchronous Messages

The **Morphisms** $f : X \to Y$ denote functional relationships and access patterns:

```mermaid
graph TD
    classDef obj fill:#1e1e2e,stroke:#cba6f7,stroke-width:2px,color:#cba6f7,font-size:18px,font-family:serif;
    classDef func fill:none,stroke:none,color:#a6e3a1,font-style:italic,font-family:serif;

    U(𝓤 : Users):::obj
    C(𝓒 : Classrooms):::obj
    A(𝓐 : Alerts):::obj
    P(𝓟 : Posts):::obj
    M(𝓜 : Messages):::obj

    U -->|ƒ_enroll| C
    U -->|ƒ_broadcast| A
    C -->|π_contains| P
    U -->|ƒ_author| P
    U -->|ƒ_send| M
```

### 1.2 The Rendering Functor $\mathcal{F}_{UI}$

The React DOM is treated as a strictly covariant Functor $\mathcal{F}_{UI} : \mathbf{Data} \to \mathbf{View}$.

For any state mutation mapping $\Delta : S_t \to S_{t+1}$ powered by WebSocket invalidations, the commutative property holds:
$$ \mathcal{F}_{UI}(S_{t+1}) = \mathcal{F}\_{UI}(\Delta(S_t)) $$

This guarantees that our UI is merely a pure, immutable projection of the backend matrix stream.

---

## 2. Architectural Topology

Campus Connect employs a **Serverless Edge + Reactive Stream** topology. This completely removes standard REST HTTP latency overhead.

### 2.1 C4 Level-2 Container Diagram

```mermaid
C4Context
    title "Architecture Workspace // Campus Connect Nexus"

    Person(student, "Campus User", "Student, Faculty, or Admin accessing the platform via Web/Mobile.")

    System_Boundary(c1, "Client SPA Boundary (Vite + React)") {
        Container(router, "Routing Engine", "React Router", "Handles URI navigation locally.")
        Container(state, "Context Machine", "React Context", "Maintains local memory heap & JWTs.")
        Container(ui, "View Engine", "React + Framer", "Paints the DOM via Virtual DOM diffing.")
    }

    System_Boundary(c2, "Cloud Infrastructure (Firebase)") {
        ContainerDb(firestore, "Graph Database", "Firestore", "Global edge-replicated NoSQL Store.")
        Container(auth, "Identity Server", "Google OAuth", "Issues secure JWT tokens.")
        Container(rules, "Validation Gateway", "Security Rules", "Denies/Permits AST payloads.")
    }

    Rel(student, ui, "Interacts", "Touch / Mouse")
    Rel(ui, state, "Dispatches Intents", "JS")
    Rel(state, router, "Navigates", "History API")

    Rel_R(state, auth, "Authenticates via OAuth", "HTTPS")
    Rel_U(firestore, state, "Streams gRPC WebSockets", "WSS://")
    Rel_D(state, rules, "Pushes mutations", "HTTPS/gRPC")
    Rel_R(rules, firestore, "Writes if Allowed", "Internal RPC")
```

---

## 3. Real-time State Machine Engine

The application does not use typical HTTP long-polling. Instead, it utilizes **Firestore `onSnapshot` multiplexing**.

### The Web Socket Frame Sequence

```mermaid
sequenceDiagram
    autonumber
    box rgba(124, 58, 237, 0.1) Client A (Alice)
    participant AC as React VDOM
    participant AM as MemCache (Hooks)
    end
    box rgba(6, 182, 212, 0.1) Cloud Persistence
    participant WSS as Edge Gateway
    participant DB as Firestore
    end
    box rgba(239, 68, 68, 0.1) Client B (Bob)
    participant BM as MemCache (Hooks)
    participant BC as React VDOM
    end

    BM->>WSS: SUB: /chat/123/messages
    WSS-->>BM: ACK (Steady State `S_0`)

    AC->>WSS: POST: { text: "Hello Bob!" }
    WSS->>DB: Atomically Commit (S_0 -> S_1)

    par Edge Multi-cast
        DB-->>WSS: Trigger Diffs
        WSS-->>AM: PUSH: Δ Diff (Local Optimistic Validation)
        WSS-->>BM: PUSH: Δ Diff (added "Hello Bob!")
    end

    BM->>BC: Intersect Virtual DOM
    BC->>BC: Paint HTML (Diff Applied)
```

---

## 4. NoSQL Graph Data Structures

Our database strictly avoids join-latency. We heavily denormalize properties to achieve **$O(1)$** exact-match document reads.

### 4.1 Schema Matrix (ERD)

```mermaid
erDiagram
    Users ||--o{ Classrooms : "members of"
    Users ||--o{ Posts : "authors"
    Users ||--o{ Alerts : "broadcasts"

    Classrooms ||--o{ Posts : "contains 1:N"
    Posts ||--o{ Replies : "contains 1:N thread"
    Posts ||--o{ Reactions : "embeds object"

    Chats ||--o{ Messages : "contains 1:N"

    Users {
        string uid PK "Deterministic UID"
        string email "Indexed"
        string fcmToken "Nullable Token"
    }

    Alerts {
        string tag "Categorization Enum"
        timestamp epoch "Sort Key"
        int velocity "Upvote tracking"
    }
```

---

## 5. Mathematical Zero-Trust Security (ABAC)

Our database is directly exposed to the internet. We employ **Attribute-Based Access Control (ABAC)** mathematically mapped in `firestore.rules`.

### 5.1 The Safety Theorem

For any operation $\mathcal{O}$ on document $D$ by user $U$:

$$ Permitted(\mathcal{O}, D, U) \iff Auth(U) \land Role(U, D) \land ValidShape(\mathcal{O}\_{payload}) $$

**In Practice (The "Anti-Update-Gap" implementation):**

```javascript
// Validating a Chat Room Update
allow update: if isAuthenticated()
    && request.auth.uid in resource.data.participants
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['lastMessage', 'lastUpdatedAt', 'lastMsgSenderId', 'participantNames']);
```

_If a client attempts to inject an unexpected key into the payload AST (e.g. `isAdmin: true`), the intersection evaluates to False, terminating the request._

---

## 6. Frontend Rendering Pipeline & Functors

The frontend directory architecture maps domain boundaries isolating the Presentation Layer from the I/O layer.

### 6.1 Component Hierarchy tree

```mermaid
mindmap
  root((Campus Connect))
    Network Layer
      firebase.ts (SDK & Gateway configs)
      AuthContext.tsx (Global Session Engine)
    Persistence Layer
      Hooks (useAlerts, useChats)
      Local Storage Mutators
    Presentation Layer (View)
      Layouts
        MainLayout (Gradient Frame)
      Screens
        Spline & Board
        Inbox 1:1
      Atoms
        AlertCard
        MarkdownRender
        EmojiPicker
    Theming
      Tailwind Config
      Lucide Icons
```

### 6.2 Motion Design & Fluidity

We map `<AnimatePresence>` to mount/unmount lifecycles.

- **$\Delta$ State Transitions:** We map $DOM_{exit}$ to `opacity: 0, y: -20` and $DOM_{enter}$ to `opacity: 1, y: 0`.
- This ensures cognitive spatial continuity for the user. When alerts slide in, they displace elements gracefully using spring physics rather than abrupt Boolean state switches.

---

## 7. Physical Deployment & CI/CD

The build system is orchestrated by **Vite** converting TypeScript and TSX into highly minified, chunk-split module files.

### The Build Pipeline

```mermaid
graph LR
    classDef build fill:#312e81,stroke:#6366f1,color:#fff;
    classDef target fill:#14532d,stroke:#22c55e,color:#fff;

    A[Source Code: TS/TSX]:::build --> B(Vite Rollup Bundler):::build
    B --> C{Chunk Spliting}:::build
    C -->|Vendor| D[vendor.js]:::target
    C -->|App| E[index.js]:::target
    C -->|CSS| F[index.css]:::target
    D --> G(Google Cloud CDN Edge)
    E --> G
    F --> G
```

### Server Variables mapping:

`firebase-applet-config.json` is fundamentally responsible for pointing the stateless React artifact towards the correct Cloud Provider backend.

---

<div align="center">
  <img src="https://img.shields.io/badge/Architecture-Solidified-0aa64b?style=for-the-badge&logo=okta&logoColor=white" />
  <img src="https://img.shields.io/badge/Latency-Zero-eb4034?style=for-the-badge&logo=fastly&logoColor=white" />
  <p><i>The algorithm is the application.</i></p>
</div>
