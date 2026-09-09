#!/usr/bin/env bash
# Structure pin for docs/structure-pass. Exit 0 only when ownership, calendar home,
# UX demotion, TEST-SPEC honesty, and Gate A lock phrases all hold.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
fail=0

ok() { printf 'OK  %s\n' "$1"; }
bad() { printf 'FAIL %s\n' "$1"; fail=1; }

# Ownership table only (AGENTS §0), not casual mentions elsewhere.
ownership_block=$(awk '/^## 0\. Where each doc lives$/,/^## /{if(/^## 0/) next; if(/^## / && !/^## 0/) exit; print}' AGENTS.md)
# Include through end of table: stop at next ## that is not 0
ownership_block=$(awk '
  /^## 0\. Where each doc lives$/ {p=1; next}
  /^## / && p {exit}
  p {print}
' AGENTS.md)

for doc in 'docs/UX-DESIGN.md' 'deploy/INVENTORY.md' 'docs/TEST-SPEC.md'; do
  if printf '%s\n' "$ownership_block" | grep -Fq "\`$doc\`"; then
    ok "AGENTS §0 lists $doc"
  else
    bad "AGENTS §0 ownership missing $doc"
  fi
done

if grep -Eqi 'non-normative|not normative' docs/UX-DESIGN.md \
  && grep -Eq 'UX\.md' docs/UX-DESIGN.md; then
  ok "UX-DESIGN demoted to non-normative and points at UX.md"
else
  bad "UX-DESIGN header must say non-normative and point at UX.md"
fi
if grep -Eqi 'phone and PC|signed UX' docs/UX-DESIGN.md; then
  ok "UX-DESIGN defers to phone+PC / signed UX"
else
  bad "UX-DESIGN must defer to phone+PC matrix / signed UX.md"
fi

if grep -Eq 'Gate A.*Docs freeze|Docs freeze' docs/IMPL-PLAN.md \
  && grep -Eq 'Gate B' docs/IMPL-PLAN.md \
  && grep -Eq 'Gate C' docs/IMPL-PLAN.md; then
  ok "IMPL-PLAN owns Gates meanings"
else
  bad "IMPL-PLAN must contain Gates A/B/C meanings"
fi

agents_gate_rows=$(grep -cE '^\| Gate [ABC] \|' AGENTS.md || true)
if [[ "$agents_gate_rows" -eq 0 ]]; then
  ok "AGENTS has no Gates meanings table rows"
else
  bad "AGENTS still has $agents_gate_rows Gates table rows; move meanings to IMPL-PLAN"
fi
if grep -Fq 'docs/IMPL-PLAN.md' AGENTS.md; then
  ok "AGENTS points at IMPL-PLAN for phase/gate depth"
else
  bad "AGENTS must point at docs/IMPL-PLAN.md for gate/phase depth"
fi

if grep -Eqi 'not (yet )?on (this branch|main)|Phase 0 deliverable|when (the )?code lands|targets until|do not (exist|treat).*(present|checked.in)' docs/TEST-SPEC.md; then
  ok "TEST-SPEC states harness paths are targets until code lands"
else
  bad "TEST-SPEC §2 must say frontend/e2e and backend/tests are targets until code exists"
fi

for f in deploy/docker-compose.yml docs/DEPLOYMENT.md; do
  if grep -Eqi 'Phase 0 deliverable|not (yet )?in (the )?tree|aspirational|scaffold target' "$f"; then
    ok "$f labels Phase 0 scaffold targets"
  else
    bad "$f must label frontend/backend paths as Phase 0 targets"
  fi
done
if grep -Eqi 'Phase 0|check-structure|IMPL-PLAN' README.md; then
  ok "README points at Phase 0 / structure pin / IMPL-PLAN"
else
  bad "README must point at Phase 0 build path or check-structure"
fi

while IFS= read -r phrase; do
  [[ -z "$phrase" ]] && continue
  if grep -Fq "$phrase" AGENTS.md; then
    ok "lock phrase present: $phrase"
  else
    bad "missing lock phrase in AGENTS.md: $phrase"
  fi
done <<'LOCKS'
bdft = sqft × thickness_in
SLAB-UAT-*
WOO_BASE_URL
https://
is authoritative for math; server **stores** client-sent numbers
Confidence 0.7
draft → calibrated → ready → publishing → published
LOCKS

if [[ "$fail" -ne 0 ]]; then
  printf '\ncheck-structure: FAILED\n'
  exit 1
fi
printf '\ncheck-structure: PASSED\n'
exit 0
