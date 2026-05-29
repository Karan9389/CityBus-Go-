# CityBus Go - Design Document

## 1. Project Overview
**CityBus Go** is a Progressive Web Application (PWA) designed to provide live bus tracking and dedicated portals for both commuters and drivers. The platform facilitates real-time location tracking, route management, and seamless communication between the transit system and its users.

## 2. Tech Stack & Architecture
- **Frontend Framework:** React
- **UI Component Library:** shadcn/ui (Tailwind CSS)
- **Application Type:** Progressive Web App (PWA) configured for standalone mobile and desktop installation.

## 3. User Portals & Workflows

### 3.1 Commuter Portal
The commuter experience focuses on discoverability, tracking, and ease of use on mobile devices.
- **Search Screens:** Allows users to easily search for specific routes, stops, or buses.
- **Live Map:** Integrates real-time bus locations with an accessible ETA (Estimated Time of Arrival) button.
- **Commuter Dashboard:** A personalized view highlighting saved routes and recent activity.

### 3.2 Driver Portal
The driver experience focuses on secure access and accurate route management.
- **Driver Login:** Secure authentication flow with explicit, user-friendly error handling (e.g., specific errors for incorrect passwords) to prevent lockout confusion.
- **Driver Registration & Route Configuration:** New drivers undergo a streamlined registration process. Immediately following registration, drivers are prompted to add and configure their specific bus stops using the exact same interface utilized in the admin portal. Upon completion, they are automatically redirected to their dashboard.
- **Driver Dashboard:** A centralized hub for drivers to start/stop their shifts, broadcast their live location, and manage their current route.

## 4. UI/UX Guidelines & Principles

### Responsive & Scrollable Design
- **Aspect Ratio Independence:** All major components (dashboards, search screens, registration flows) feature responsive scrolling. This ensures that content exceeding the screen's aspect ratio—especially on mobile devices—remains accessible without breaking the layout.
- **Mobile-First PWA:** UI elements are sized for touch targets. The app is fully installable and functions with a native-like feel on iOS and Android devices.

### Component Reusability
- The application leverages **shadcn/ui** to maintain visual consistency across all forms, inputs, modals, and buttons. 
- Interfaces like the "Route Configuration / Bus Stop Addition" are shared between the Admin and Driver portals to minimize code duplication and ensure a uniform user experience.
