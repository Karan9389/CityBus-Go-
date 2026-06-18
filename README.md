<div align="center">
  <h1>🚌 CityBus Go</h1>
  <p><em>A real-time transit tracking and fleet management platform.</em></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="WebSockets" />
    <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  </p>
</div>

---

## 📖 About The Project

**CityBus Go** is a comprehensive, full-stack transit solution designed to bridge the gap between daily commuters and city transportation fleets. Built to eliminate the uncertainty of public transit wait times, the platform provides seamless, real-time bus tracking synchronized via WebSockets. 

The application serves three distinct user groups through dedicated interfaces:
1. **Commuters:** Can search for routes, view bus schedules, and track their incoming buses live on an interactive map.
2. **Drivers:** Have a specialized dashboard to securely log in, broadcast their live GPS location, and configure their active routes.
3. **Administrators:** Can access a secure command center to manage the fleet, create driver accounts, and monitor overall transit operations.

By combining modern web technologies with Progressive Web App (PWA) capabilities, CityBus Go delivers a native-app-like experience directly through the browser, ensuring accessibility for users on the go.

---

### 🚀 Key Features

* **Real-Time GPS Tracking:** Utilizes WebSockets to instantly broadcast and update bus locations on the commuter's map without requiring page refreshes.
* **Progressive Web App (PWA):** Fully installable on mobile devices with a custom manifest and service workers (`sw.js`) for an optimized, native feel.
* **Role-Based Access Control:** Secure, separate routing and dashboards for Admins, Drivers, and Commuters.
* **Modern UI Architecture:** Built with accessible, highly responsive UI components (shadcn/ui) and Tailwind CSS for a clean, intuitive user experience.
* **Driver Configuration:** Real-time toggles for drivers to start/stop broadcasting and update their current bus capacity or route status.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **UI Components:** Radix UI / shadcn/ui
* **Backend Framework:** Node.js, Express.js
* **Database:** MongoDB
* **Real-Time Communication:** WebSockets
* **Architecture:** PWA (Progressive Web App)

---

## 💻 Getting Started

Follow these steps to run the CityBus Go client locally.

### Prerequisites
* Node.js (v18+ recommended)
* npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/karan9389/citybus-go-.git
   cd citybus-go-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

*The application will be accessible at `http://localhost:5173` (or your configured Vite port).*

---

## 📂 Project Structure Highlights

```text
src/
├── components/          
│   ├── AdminDashboard.tsx      # Fleet management interface
│   ├── CommuterSearch.tsx      # Route and bus search
│   ├── DriverDashboard.tsx     # Location broadcasting hub
│   ├── MapScreen.tsx           # Real-time tracking interface
│   └── PWAFeatures.tsx         # Progressive Web App installation logic
├── public/                     # PWA manifest, service workers, and icons
├── styles/                     # Global Tailwind configurations
└── App.tsx                     # Main routing and layout
```

---

## 👨‍💻 Author

**Karan Kumar**

* **Role:** Full-Stack Developer
* **GitHub:** [@karan9389](https://github.com/karan9389)
* **Email:** [karan.kumar2023@glbajajgroup.org](mailto:karan.kumar2023@glbajajgroup.org)

---
