# Neoned

[![GitHub Release](https://img.shields.io/github/v/release/emerikaji/neoned?style=flat-square)](https://github.com/emerikaji/neoned/releases)
[![GitHub Stars](https://img.shields.io/github/stars/emerikaji/YOUR_REPO?style=flat-square)](https://github.com/emerikaji/neoned/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A fast, responsive real-time public transit companion Progressive Web App for Nantes (Naolib). Designed to provide commuters with instant live arrival times, platform/quay assignments, multi-line filtering, and critical service disruption alerts.

🌐 **[Try the Public Instance Live →](https://neoned.hoolheyak.com)**

---

## ✨ Features

- **Live Departures & Arrivals**: Real-time bus and tram timetables.
- **Smart Filtering**: Filter departures dynamically by individual transit lines or destination directions.
- **Service Disruption Alerts**: GTFS-RT integration that flags impacted lines and displays detailed warning banners with schema/map attachments.
- **Nearby Stops**: Geolocation-based discovery to find the closest transit stations around you.
- **Personal Dashboard**: Save and manage your frequently used stops locally for quick access.
- **Lightning Fast & Optimized**: Backend proxy with built-in response caching to prevent rate-limiting and ensure sub-second load times.

---

## 🚀 Getting Started & Installation

To run your own self-hosted instance of the application, I recommend using Docker Compose with Traefik:

### 1. Clone the Repository

```bash
git clone https://github.com/emerikaji/neoned.git
cd neoned
```

### 2. Populate the database

First let prisma initialize the sqlite database:

```bash
npx prisma db push
```
The `dev.db` file should appear.

Download the [latest version of the gtfs data](https://transport.data.gouv.fr/resources/84101) and extract it in the datasets folder. The structure should be:
```
/
-  datasets/
  - gtfs_lumidata_id/
      ...
    - stops.txt
      ...   
```

Populate the database with the script:
```bash
npx tsx scripts/seed.ts
```

### 3. Configure Environment Variables

Using the Naolib API requires obtaining API keys for their [staging environment](https://api.staging.okina.fr) first, then their [production environment](https://api.okina.fr/).

Rename `.env.example` to `.env` in the root directory and supply your Naolib gateway API keys, then set the PRODUCTION var based on which environment you are using.

### 4. Start the container

Edit the `docker-compose.yml` file based on the specifics of your environment and your desired URL. Then run:

```bash
docker compose up -d --build
```

## 🤝 Contributing

Contributions are welcome and greatly appreciated! Whether it's reporting a bug, proposing a feature, or submitting a pull request, here is how you can help:

1. **Fork the Repository**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

Please ensure your code follows the existing style guidelines and includes clear commit messages.

---

## 📄 License

This project is open-source and available under the MIT License.