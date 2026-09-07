# SwasthyaSetu Frontend-to-Backend Integration Plan

## Executive conclusion

The current SwasthyaSetu interface is a polished frontend prototype, but its implementation is still a single-page, mock-state experience. The backend handover introduces a different production shape: authenticated role routes, server-generated ABHA sessions, AI-assisted intake extraction, a persistent doctor queue, e-prescriptions, facility search, and offline synchronization.

The frontend should therefore evolve in three stages. First, preserve the current visual system while separating the ASHA, doctor, patient, and authentication experiences into feature modules. Second, replace mock state with an API client, authentication store, intake store, and query/loading/error states. Third, add the offline-first and geographic features that are required by the backend contract.

The most important architectural change is to treat the backend as the source of truth for patient cases, triage priority, prescription status, and user sessions. The frontend should retain local drafts and offline submissions only as temporary synchronized state.

## 1. Current frontend versus target architecture

| Area | Current prototype | Required production change |
|---|---|---|
| Application structure | One large `client/src/App.tsx` with conditional views | Split by feature and role: `auth`, `asha`, `doctor`, `patient`, shared components, stores, database, and utilities |
| Navigation | State-based switching and demo query parameters | `react-router-dom` routes such as `/login`, `/asha`, `/doctor`, and `/patient` |
| Authentication | Mock OTP and local React state | API-generated ABHA session, persisted JWT, protected routes, logout, token expiry handling |
| Data | Hard-coded patient objects | API data from intake, queue, prescription, and facilities endpoints |
| State management | Local component state | Zustand stores for authentication, active intake, queue, and patient data |
| Offline behavior | Visual status only | Dexie draft/outbox storage, retry queue, online-event synchronization, conflict/error states |
| Voice intake | Mock recording toggle | Web Speech API transcription followed by `/api/intake/extract-voice` |
| Doctor workflow | Static patient details and mock actions | Live queue, selected-case fetch state, prescription submission, queue refresh, and completion state |
| Patient workflow | Mock health dashboard | Authenticated patient prescription view and facility map powered by backend data |
| Map | Not implemented | React Leaflet facility map with user location and nearby pharmacy/hospital markers |
| Configuration | No backend environment integration | `VITE_API_BASE_URL`, development fallback, and environment-safe API configuration |

## 2. Changes required by the database schema

The `patient_intakes` table should define the frontend data model for the case workflow. The UI should not create a second incompatible shape. A shared TypeScript or JavaScript model should represent each case consistently across ASHA, doctor, and patient views.

| Database field | Frontend use | Required UI behavior |
|---|---|---|
| `id` | Case identifier | Display a human-readable case reference while retaining the UUID internally |
| `abha_id` | Patient identity | Show masked or full ABHA only where appropriate; do not use a temporary mock ID after authentication is live |
| `voice_note_text` | Raw or translated intake narrative | Display in the ASHA review step and doctor clinical summary |
| `vitals` | Blood pressure, temperature, pulse | Use a normalized object with validation, units, empty states, and abnormal-value styling |
| `triage_priority` | AI-generated severity | Map backend values `High`, `Medium`, and `Routine` to the existing Urgent, Review soon, and Routine badges, or standardize the labels across backend and UI |
| `status` | Queue lifecycle | Show `waiting`, `completed`, and future states such as `draft`, `syncing`, or `sync_failed` locally |
| `prescription` | Doctor order and patient display | Render medicine name, dosage, frequency, duration, and instructions; support empty prescription states |
| `created_at` | Timeline and sorting | Format according to the selected language and local timezone |

### Priority-label decision

The current UI uses `Urgent`, `Review soon`, and `Routine`, while the backend specifies `High`, `Medium`, and `Routine`. The frontend should implement a single adapter rather than scattering conditionals throughout the UI.

```js
const priorityPresentation = {
  High: { label: "Urgent", tone: "urgent" },
  Medium: { label: "Review soon", tone: "review" },
  Routine: { label: "Routine", tone: "routine" },
};
```

The backend value should remain the canonical value sent to and received from the API. The presentation label may remain more user-friendly.

## 3. Authentication changes

The existing split-screen authentication design can be retained, but its submission behavior must change.

### Required flow

1. The user selects a role and enters the required identity details.
2. The frontend sends `phone_number`, `full_name`, and `role` to `/api/auth/generate-abha`.
3. The frontend stores the returned `access_token` in a session store and persistent storage.
4. The returned ABHA ID becomes the authenticated user identity.
5. The app redirects to the correct protected route.
6. A failed request shows a field-level error without discarding the form.

The current mock OTP screen can remain as a demonstration mode, but it should be isolated behind a clearly named mock adapter. The production API adapter should not depend on the mock OTP step.

### Required frontend files

```text
src/features/auth/AuthScreen.jsx
src/store/useAuthStore.js
src/utils/api.js
src/components/ProtectedRoute.jsx
src/components/RoleRedirect.jsx
```

### Token handling

The Axios client should attach the token to every protected request. The response interceptor should handle `401 Unauthorized` by clearing the session and redirecting to the login screen. The token should not be hard-coded in source files.

## 4. API client and environment configuration

Create a single Axios instance rather than calling Axios directly from components.

```js
// src/utils/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("swasthya_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

The environment file should contain the backend URL without embedding credentials.

```text
VITE_API_BASE_URL=https://sahara-cio2.onrender.com
```

The frontend should also define an explicit local development value and show a clear configuration error if the variable is missing.

## 5. ASHA workflow changes

The current Add Patient page should become the primary ASHA intake workflow. The page already has a suitable three-step visual structure, but it needs to become data-driven.

### Recommended flow

| Step | Frontend behavior | Backend interaction |
|---|---|---|
| Identity | Capture patient name, phone, village, ABHA ID, and optional demographics | No request required until the case is submitted, unless the backend adds patient lookup |
| Voice intake | Use native Web Speech API to capture speech and show live transcript | Send transcript to `/api/intake/extract-voice` |
| Review | Auto-fill voice text and extracted vitals; allow manual correction | Prepare the intake payload |
| Submit | Show online/offline status and sync state | POST `/api/intake/intake` or save the payload to Dexie when offline |
| Complete | Display case ID and triage result | Refresh the local queue and show the new case status |

### Voice extraction states

The modal or intake section should support the following states:

- Microphone idle
- Permission request
- Listening
- Transcribing
- Sending to AI
- AI extraction completed
- AI extraction failed
- Manual entry fallback

The frontend should never overwrite a manually corrected vital after the user edits it. AI extraction should populate fields, not permanently control them.

### Intake payload adapter

The UI may collect additional fields, but the API adapter should send the exact backend contract.

```js
const payload = {
  abha_id: auth.abhaId,
  voice_note_text: intake.voiceNoteText,
  vitals: {
    bp: intake.vitals.bp,
    temp: intake.vitals.temp,
    pulse: intake.vitals.pulse,
  },
};
```

## 6. Offline-first requirements

The current online badge is visual only. The backend plan requires a real offline outbox.

### Dexie tables

A practical local schema is:

```js
import Dexie from "dexie";

export const db = new Dexie("swasthya_local");
db.version(1).stores({
  intakes: "++localId, id, abha_id, status, created_at",
  syncQueue: "++queueId, localId, status, created_at",
});
```

The local record should include a client-generated identifier, payload, sync status, retry count, and error message. The frontend should distinguish these states:

| Local state | Visible UI |
|---|---|
| `draft` | Draft saved locally |
| `queued` | Waiting for connection |
| `syncing` | Upload in progress |
| `synced` | Successfully sent |
| `sync_failed` | Retry action and error explanation |

The synchronization manager should listen for the browser `online` event and retry queued records. It should use bounded retries and avoid duplicating submissions when a request times out after the backend has already accepted it.

## 7. Doctor dashboard changes

The current specialist dashboard already has the correct visual direction. Its data and action model should change as follows:

1. Fetch the live queue from `GET /api/queue/` when the doctor route loads.
2. Preserve backend ordering instead of sorting only in the browser.
3. Show loading skeletons while the queue is loading.
4. Show a retry state if the request fails.
5. Display the selected case from the queue response.
6. Add a prescription form with diagnosis and repeatable medicine rows.
7. Submit the form to `/api/queue/{case_id}/prescribe`.
8. Disable the submit button while saving.
9. Remove or mark the case completed after success.
10. Keep the selected case visible if submission fails.

### Prescription form fields

The e-prescription panel should include:

- Diagnosis
- Medicine name
- Dosage
- Frequency
- Duration
- Instructions
- Add medicine row
- Remove medicine row
- Submit prescription

The backend currently documents `name` and `dosage`. The frontend can collect the additional fields, but the request adapter should either send only fields accepted by the backend or wait for the backend contract to be expanded.

## 8. Patient portal changes

The existing patient page is a strong visual foundation, but it currently displays static ABHA, appointment, and timeline values. It should become an authenticated patient view.

### Required production sections

- Active prescription from the completed case
- Doctor name and diagnosis
- Medicine cards with dosage and instructions
- Case status and latest update
- ABHA identity summary
- Nearby pharmacy and hospital map
- Empty state when no prescription is available
- Loading state while the record is fetched
- Error state when the patient data cannot be loaded

The exact patient-specific endpoint is not included in the handover blueprint. The frontend team should request a dedicated endpoint such as `GET /api/patient/me` or `GET /api/patient/prescription`. The current queue endpoint should not be reused for patient access unless the backend explicitly authorizes and filters it by the authenticated patient.

## 9. Facility map and geographic routing

The new patient page should include a React Leaflet map beneath the prescription section. The map must use facility data from:

```text
GET /api/facilities/nearby?lat=18.5204&lon=73.8567
```

The frontend should:

- Request browser geolocation with permission handling.
- Fall back to a configured default location when permission is denied.
- Display the user location as a blue marker.
- Display hospitals and Jan Aushadhi pharmacies as separate marker types.
- Show name, distance, address, and a navigation action in the popup.
- Show a useful empty state when no facilities are returned.
- Avoid exposing a map API key because Leaflet does not require one for the map library itself.

The project must include Leaflet CSS and a marker-icon fix for Vite asset handling. Facility data should be normalized before reaching the map component.

## 10. Required routing structure

The current state-based demo should be replaced with routes that support protected role experiences.

```text
/login
/asha
/doctor
/patient
/asha/intake
/doctor/cases/:caseId
/patient/prescription
/patient/facilities
```

The route guard should verify that a token exists and that the user role is authorized for the route. The role should come from the authenticated session rather than a query parameter in production. Query parameters such as `?demo=1` and `?add=1` should be removed or isolated to development-only preview behavior.

## 11. Shared frontend components to extract

The current single-file prototype should be decomposed before the API integration grows. The following components are good extraction targets:

```text
src/components/BrandMark.jsx
src/components/AppShell.jsx
src/components/StatusPill.jsx
src/components/PatientAvatar.jsx
src/components/PriorityBadge.jsx
src/components/LoadingState.jsx
src/components/ErrorState.jsx
src/components/EmptyState.jsx
src/components/ProtectedRoute.jsx
src/components/FacilityMap.jsx
src/features/auth/AuthScreen.jsx
src/features/asha/AshaDashboard.jsx
src/features/asha/VoiceRecorder.jsx
src/features/asha/IntakeReview.jsx
src/features/doctor/DoctorDashboard.jsx
src/features/doctor/PatientQueue.jsx
src/features/doctor/PrescriptionForm.jsx
src/features/patient/PatientView.jsx
src/features/patient/PrescriptionCard.jsx
src/features/patient/FacilitySearch.jsx
src/store/useAuthStore.js
src/store/useIntakeStore.js
src/store/useQueueStore.js
src/db/dexieConfig.js
src/db/syncManager.js
src/utils/api.js
src/utils/formatters.js
src/utils/adapters.js
```

## 12. Backend questions to resolve before integration

The handover is sufficient for a prototype integration, but the following points should be clarified before production wiring:

1. Does `generate-abha` validate roles server-side, and which fields are returned besides `access_token` and `abha_id`?
2. Is the JWT token a standard bearer token with an expiration claim?
3. Which endpoint retrieves a patient’s own prescription and case history?
4. Does `/api/queue/` return `voice_note_text`, vitals, prescription, and timestamps in the same response?
5. Does the prescription endpoint accept only `name` and `dosage`, or also frequency, duration, and instructions?
6. How does the backend prevent duplicate offline submissions?
7. Are CORS requests from the deployed frontend domain allowed?
8. Are facility objects guaranteed to contain latitude, longitude, distance, category, and address?
9. What error format does FastAPI return for validation failures?
10. Should ABHA IDs and patient names be masked in screenshots, logs, and analytics?

## 13. Recommended implementation order

The safest implementation order is to preserve the visual work while replacing one mock boundary at a time.

| Phase | Deliverable | Completion condition |
|---|---|---|
| 1 | Extract shared components and add React Router | Existing screens render through role routes |
| 2 | Add Axios client and authentication store | Login returns a stored token and redirects by role |
| 3 | Connect ASHA voice extraction | Transcript and returned vitals populate the intake form |
| 4 | Connect intake submission | Online submission creates a backend case |
| 5 | Add Dexie outbox | Offline submission survives refresh and syncs after reconnect |
| 6 | Connect doctor queue | Queue loads from the backend and handles loading/error states |
| 7 | Add prescription form | Successful prescription marks the case completed |
| 8 | Add patient prescription endpoint | Patient sees only their authorized care information |
| 9 | Add facility map | Nearby hospitals and generic pharmacies render from API data |
| 10 | Harden UX and security | Role guards, errors, accessibility, CORS, and privacy behavior are verified |

## Final recommendation

Do not rewrite the current UI from scratch. The visual system is already suitable for the hackathon. Refactor it into feature modules, preserve the branded components and responsive layouts, and replace mock data behind adapters. The highest-risk work is not styling. It is defining stable API response adapters, protecting role routes, handling token expiration, and making offline submissions idempotent.

The frontend is ready to begin backend integration after the backend team confirms the unresolved patient endpoint, prescription payload shape, JWT behavior, CORS configuration, and duplicate-submission strategy.

## References

[1]: https://axios-http.com/docs/interceptors "Axios interceptors documentation"

[2]: https://dexie.org/docs/ "Dexie.js documentation"

[3]: https://reactrouter.com/home "React Router documentation"

[4]: https://react-leaflet.js.org/ "React Leaflet documentation"

[5]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API "MDN Web Speech API documentation"
