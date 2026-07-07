# Flare External Support Channel V0 Live Validation

- Date: 2026-07-07
- Scope: Manual live GroupMe validation for External Support Channel V0
- Network use: Real GroupMe flow; not part of automated tests

## Observed Live Results

- GroupMe connection completed successfully.
- Group selection completed successfully.
- Provider configuration persisted successfully.
- A test Flare posted successfully.
- A real Flare posted successfully.
- The visible sender displayed as `Luke's Flare`.
- A second real send reused the persisted bot identity and retained the same sender display.

## Notes

- This record is manual evidence only and intentionally excludes live tokens, group ids, bot ids, and other secrets.
- Automated tests for this feature mock provider calls and do not depend on the GroupMe network.
