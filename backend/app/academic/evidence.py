"""Pure evidence-state checks. No fetching, approval, scraping or publication."""

from .contracts import EvidenceState, Outcome, Release, Result


def source_problem(source_ids: tuple[str, ...], release: Release) -> Result | None:
    sources = {s.id: s for s in release.sources}
    for source_id in source_ids:
        source = sources.get(source_id)
        incoming = tuple(s.id for s in release.sources if source_id in s.conflicts_with)
        reason = None
        if source is None:
            reason = f"missing_source:{source_id}"
        elif source.conflicts_with or incoming:
            return Result(
                status=Outcome.UNRESOLVED,
                reason=f"conflicting_evidence:{source_id}",
                source_ids=tuple(
                    dict.fromkeys((*source_ids, *source.conflicts_with, *incoming))
                ),
            )
        elif source.state in (
            EvidenceState.PROVISIONAL,
            EvidenceState.CONFLICTING,
            EvidenceState.UNRESOLVED,
        ):
            reason = f"source_{source.state}:{source_id}"
        elif source.state == EvidenceState.VERIFIED and not source.year_confirmed:
            reason = f"unconfirmed_catalog_year:{source_id}"
        elif source.state == EvidenceState.SYNTHETIC and any(
            s.state != EvidenceState.SYNTHETIC for s in release.sources
        ):
            reason = "synthetic_rule_in_reference_release"
        if reason:
            return Result(
                status=Outcome.UNRESOLVED, reason=reason, source_ids=source_ids
            )
    return None
