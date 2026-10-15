# Decisions

## One continuous work surface, no split inspector

The operator scans several related bookings at once; a permanently open details panel would steal horizontal space and spread related columns on a wide display. A modal is used only for the bounded edit transaction.

## Full-schedule validation even when filtered

Filtering is a presentation concern. A hidden conflicting session must still prevent an invalid reassignment. The domain module receives the entire schedule.

## Why half-open intervals?

`[start, end)` allows one session to end at 10:00 and the next to start at 10:00 without a false conflict. Working across time zones or daylight saving would require actual timestamps and explicit location policy.

## Why no backend?

This is a product slice that demonstrates a coherent interaction and executable rules. Adding fake authentication or a mock API would create complexity without providing a real persistence contract.
