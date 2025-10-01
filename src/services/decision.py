"""Loan decision rules based on risk score and applicant metrics."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from .predictor import LoanApplication


@dataclass(frozen=True)
class LoanDecision:
    approved: bool
    decision: str
    reason: str
    default_risk_score: float


def _normalize_dti(value: float) -> float:
    """Convert debt-to-income inputs to ratio form (0-1)."""
    if value <= 1:
        return value
    return value / 100.0


def evaluate_lending_rules(
    default_risk_score: float,
    application: "LoanApplication",
    risk_threshold: float = 0.20,
    dti_threshold: float = 0.45,
) -> LoanDecision:
    """Apply deterministic lending rules.

    Approve if risk score < 20% and debt-to-income ratio < 45%.
    Otherwise deny and explain which thresholds were exceeded.
    """

    reasons: list[str] = []
    dti_ratio = _normalize_dti(application.dti)

    risk_ok = default_risk_score < risk_threshold
    dti_ok = dti_ratio < dti_threshold

    if risk_ok and dti_ok:
        reason = "Risk score and debt-to-income ratio are within acceptable limits."
        return LoanDecision(
            approved=True,
            decision="Approved",
            reason=reason,
            default_risk_score=default_risk_score,
        )

    if not risk_ok:
        reasons.append(
            f"Default risk score ({default_risk_score:.0%}) exceeds the lender threshold of {risk_threshold:.0%}."
        )
    if not dti_ok:
        reasons.append(
            f"Debt-to-income ratio ({dti_ratio:.0%}) is above the allowed maximum of {dti_threshold:.0%}."
        )

    reason = " ".join(reasons) if reasons else "Application does not meet lending criteria."
    return LoanDecision(
        approved=False,
        decision="Denied",
        reason=reason,
        default_risk_score=default_risk_score,
    )


__all__ = ["LoanDecision", "evaluate_lending_rules"]
