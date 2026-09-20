# Kaung Sett Burmese Restaurant

A responsive restaurant website for Kaung Sett, a Burmese restaurant concept. The project includes a public menu and story experience, a reservation form, an admin reservation view, and a small Python backend for local reservation storage.

## Features

- Responsive restaurant website with home, story, menu, and visit pages
- Reservation form with name, date, time, and guest count
- Admin view for reviewing, confirming, deleting, and exporting reservations
- Local Python HTTP server that serves the website and exposes a reservation API
- Supabase integration in the frontend with browser-based fallbacks for development

## Tech Stack

- HTML, CSS, and vanilla JavaScript
- Python standard library: `http.server`, `json`, and `pathlib`
- Supabase REST API for the hosted reservation data path
- JSON and `localStorage` fallbacks for local development

## Run Locally

From this project directory, run:

```bash
python3 server.py
```

Then open:

- Public site: http://localhost:4173/index.html
- Menu: http://localhost:4173/menu.html
- Admin view: http://localhost:4173/admin.html

Stop the server with `Ctrl+C`.

## Backend API

The local backend is implemented in `server.py` and listens on `127.0.0.1:4173`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/reservations` | Return all reservations |
| `POST` | `/api/reservations` | Create a reservation |
| `PATCH` | `/api/reservations/:id` | Toggle a reservation between `New` and `Confirmed` |
| `DELETE` | `/api/reservations/:id` | Delete one reservation |
| `DELETE` | `/api/reservations` | Delete all reservations |

Example request:

```bash
curl -X POST http://localhost:4173/api/reservations \
  -H 'Content-Type: application/json' \
  -d '{"name":"Aung Sett","date":"2026-10-05","time":"19:00","guests":"2"}'
```

Reservations created through this local API are stored in `reservations.json`. The file is created or updated by the server and is not a production database.

## Current Data Flow

The frontend currently attempts to use Supabase first for creating and managing reservations. If that request is unavailable:

- The reservation form saves to browser `localStorage`.
- The admin page reads `reservations.json` or browser `localStorage` as a fallback.
- The local Python API remains available for testing the backend directly with `curl` or another client.

This means the current UI does not yet send reservation form submissions directly to `server.py`. That is an intentional development-stage limitation to be completed when choosing one source of truth for reservations.

## Project Structure

```text
index.html          Public home page
menu.html           Menu and ordering interface
story.html          Restaurant story page
visit.html          Reservation and location page
admin.html          Private reservation management view
script.js           Frontend behavior and data requests
styles.css          Shared responsive styles
server.py           Local static file server and reservation API
reservations.json   Local reservation data file
```

## Known Limitations

- The local API has no authentication or authorization.
- Input validation is minimal and should be added before production use.
- JSON-file storage is suitable for a demo or local prototype, not concurrent production traffic.
- Supabase credentials and deployment configuration should be moved to environment-specific configuration.
- The admin page should be protected before handling real customer data.
- The order form currently creates an email draft rather than processing a payment or order in the backend.

## Interview Summary

This project demonstrates a complete frontend workflow and a working backend prototype. I built the local backend with Python's standard library to keep the project lightweight: it serves static files, exposes REST-style reservation endpoints, assigns IDs and timestamps, and persists data to JSON. The next production step would be to connect the browser directly to one backend source of truth, add validation and authentication, and replace JSON storage with a database.