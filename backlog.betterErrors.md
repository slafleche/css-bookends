# Backlog: Better Runtime Errors

## Problem
- Runtime failures like calling subtract on undefined values surface as generic
  TypeError messages in bundlers, which are hard to trace.

## Goal
- Provide clearer, structured runtime errors when measurement values or media
  query inputs are undefined or invalid.

## Ideas
- Add optional runtime guards for measurement operations to throw descriptive
  errors when operands are undefined or invalid.
- Add optional input validation in media query builders to catch undefined
  values and report the query key and feature.

## Considerations
- Should be on by default with an opt out flag.
- Needs minimal overhead in hot paths.
- Must include clear error messages with context labels when provided.

