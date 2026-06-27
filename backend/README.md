Status: draft
Doc Type: implementation note
Role: Reserve the backend boundary for future API, domain, and integration work.

This scaffold keeps backend concerns out of the Expo client. Future server-side work should stay under `backend/app/` and avoid leaking transport or persistence logic into the mobile UI layer.
