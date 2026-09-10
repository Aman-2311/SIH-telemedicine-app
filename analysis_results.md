# Queue Mapping & End-to-End Tracing Report

I have traced a complete end-to-end patient submission from the ASHA worker tab to the Doctor queue. 

## 1. Flow Execution
1. **ASHA Submission:** I ran a script simulating the exact payload the ASHA UI sends. 
2. **Backend Insertion:** The `/api/intake/` endpoint correctly processed the payload, extracted fields, ran the Gemini fallback, and inserted the row into the Supabase `patient_intakes` table.
3. **Database State:** The row was successfully created with `status = "waiting"`, `department = "General Medicine"`, and an auto-generated `id` (e.g., `125`).
4. **Doctor Queue Fetch:** Calling `GET /api/queue/` successfully returned the exact case with `id: "125"`, `case_id: "125"`, and `status: "waiting"`.

## 2. Analyzing the 5 Suspect Areas in Doctor UI
I thoroughly analyzed the `useDoctorQueueStore.ts` and `DoctorDashboard.tsx` files against the hints you provided:

1. **Does it call `/api/queue`?**
   Yes. It calls `/api/queue/` and handles `response.data` natively. The fallback logic correctly catches arrays.
2. **Does it replace it with mock/static data?**
   No. There is no hardcoded mock replacement overriding the server state. The store prioritizes `serverItems` over `localItems`.
3. **Does it require a different status?**
   No. The API `queue.py` filters by `["waiting", "scheduled"]`, which perfectly matches the `"waiting"` status assigned upon ASHA submission. `DoctorDashboard.tsx` applies no additional status filters.
4. **Does it use a different case ID field?**
   No. The API `intake.py` maps the auto-incremented database `id` to both `"id"` and `"case_id"`. The frontend explicitly supports this via `String(item.case_id || item.id)`.

## 3. The Actual Culprit: UI Filtering & Display Slicing
If the case exists in `/api/queue` but is not visible to the doctor in the UI, the issue stems from the **Frontend UI Filtering Logic**:

- **Home Tab Truncation (`.slice(0, 4)`)**: The Doctor's Home view explicitly renders only the top 4 cases: `{displayedQueue.slice(0, 4).map((item) => ...)}`.
- **Priority Sorting**: The queue is sorted by Priority (Urgent -> Moderate -> Routine). If the AI algorithm (or its fallback) assigns a `"Routine"` priority to the new case, and there are already 4+ Urgent/Moderate cases in the database, **the new case will never appear on the Home tab**. It is pushed below the top 4 fold.
- **Department Filtering**: If the AI routes the patient to `"Pediatrics"`, but the Doctor's tab defaults to `"General Medicine"` or the Doctor applies a department filter, the case disappears from the list.

The backend mapping and API contract are completely correct and successfully relay the case. The case simply falls victim to the Doctor dashboard's sorting and pagination/slicing rules.
