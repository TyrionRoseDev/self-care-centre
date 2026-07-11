# Restructure the single-purpose Skincare app into a multi-Routine hub

The app began as a Skincare-only guide (nav: Today / The week / Needling, driven by a
microneedling-cycle engine). The owner wants to add Workout now and Haircare, Body care
and Bath care later, and to open **one** app that tells her what to do today across all
of them — while still being able to drill into each Routine on its own.

**Decision:** Evolve into a single hub. Add a top-level Routine switch; keep a unified
**Today** view that aggregates what's due across every Routine; give each Routine its own
sub-screens underneath. Reject the alternative of separate standalone HTML files per
Routine — it would duplicate the theme, navigation and settings for every routine and
force re-doing each change five times. The hub pays for itself the moment the second
Routine (Workout) exists.

**Consequences:** The existing skincare-shaped data model and the `Today` renderer must
generalise to hold more than one Routine. The build still emits one static file.
