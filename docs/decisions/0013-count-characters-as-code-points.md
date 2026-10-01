# 0013. Count text length in Unicode code points

- Status: Accepted
- Date: 2026-09-30
- Classification: Reversible

## Context

The spec limits joke content to 1000 characters and passwords to 12 to 128 characters. JavaScript `String.length` counts UTF-16 code units, so one emoji counts as 2.

## Decision

Count characters as Unicode code points (`[...text].length`) on the server and in the browser character counter. The server trims joke fields before it counts.

## Consequences

- An emoji counts as one character in the form counter, in the validation and in the password rules.
- A combined character (for example, a letter with a separate accent mark) can still count as 2.
