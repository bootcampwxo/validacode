"""AgentOps router — mock traces, spans, latency metrics"""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random
import hashlib

router = APIRouter()

rng = random.Random(42)


def _make_trace(idx: int) -> dict:
    r = random.Random(42 + idx)
    base_ts = datetime.now() - timedelta(minutes=r.randint(1, 1440 * 7))
    total_ms = r.randint(800, 4200)
    tool_calls = []

    tools = ["classify_complaint", "lookup_customer"]
    if r.random() > 0.3:
        tools.append("draft_response" if r.random() > 0.4 else "escalate_to_human")

    offset = 150
    for t in tools:
        dur = r.randint(80, 600)
        status = "ok" if r.random() > 0.05 else "error"
        tool_calls.append({
            "name": t,
            "start_offset_ms": offset,
            "duration_ms": dur,
            "status": status,
            "tokens_in": r.randint(100, 500),
            "tokens_out": r.randint(50, 200),
        })
        offset += dur + r.randint(20, 80)

    priorities = ["low", "medium", "high"]
    priority = r.choice(priorities)
    cid = f"CUST-{r.randint(1, 999):05d}"

    return {
        "trace_id": f"trace-{hashlib.md5(str(idx).encode()).hexdigest()[:16]}",
        "run_id": f"run-{hashlib.md5(str(idx + 1000).encode()).hexdigest()[:12]}",
        "agent_name": "governance_agent",
        "timestamp": base_ts.isoformat(),
        "total_duration_ms": total_ms,
        "status": "ok" if r.random() > 0.04 else "error",
        "customer_id": cid,
        "priority_decision": priority,
        "governance_flagged": r.random() < 0.08,
        "tool_calls": tool_calls,
        "tokens_total": sum(t["tokens_in"] + t["tokens_out"] for t in tool_calls),
        "llm_calls": len(tool_calls) + 1,
        "escalated": priority == "high" or r.random() < 0.15,
    }


_TRACES = [_make_trace(i) for i in range(200)]


@router.get("/traces")
def list_traces(
    limit: int = Query(20, ge=1, le=100),
    status: str | None = None,
    governance_flagged: bool | None = None,
):
    filtered = _TRACES
    if status:
        filtered = [t for t in filtered if t["status"] == status]
    if governance_flagged is not None:
        filtered = [t for t in filtered if t["governance_flagged"] == governance_flagged]
    return {
        "items": sorted(filtered, key=lambda x: x["timestamp"], reverse=True)[:limit],
        "total": len(filtered),
    }


@router.get("/traces/{trace_id}")
def get_trace(trace_id: str):
    for t in _TRACES:
        if t["trace_id"] == trace_id:
            return t
    return {"error": "Trace not found", "trace_id": trace_id}


@router.get("/metrics")
def metrics():
    total = len(_TRACES)
    errors = sum(1 for t in _TRACES if t["status"] == "error")
    gov_flags = sum(1 for t in _TRACES if t["governance_flagged"])
    escalated = sum(1 for t in _TRACES if t["escalated"])
    all_durations = [t["total_duration_ms"] for t in _TRACES]
    all_durations.sort()
    p50 = all_durations[int(len(all_durations) * 0.50)]
    p95 = all_durations[int(len(all_durations) * 0.95)]
    p99 = all_durations[int(len(all_durations) * 0.99)]
    avg_tokens = round(sum(t["tokens_total"] for t in _TRACES) / total)

    # Tool latency breakdown
    tool_latencies: dict = {}
    for t in _TRACES:
        for tc in t["tool_calls"]:
            name = tc["name"]
            if name not in tool_latencies:
                tool_latencies[name] = []
            tool_latencies[name].append(tc["duration_ms"])

    tool_summary = {
        name: {
            "avg_ms": round(sum(vals) / len(vals)),
            "p95_ms": sorted(vals)[int(len(vals) * 0.95)],
            "calls": len(vals),
            "error_rate": round(sum(1 for t in _TRACES for tc in t["tool_calls"] if tc["name"] == name and tc["status"] == "error") / len(vals) * 100, 1),
        }
        for name, vals in tool_latencies.items()
    }

    return {
        "total_runs": total,
        "error_rate_pct": round(errors / total * 100, 2),
        "governance_flag_rate_pct": round(gov_flags / total * 100, 2),
        "escalation_rate_pct": round(escalated / total * 100, 2),
        "latency": {"p50_ms": p50, "p95_ms": p95, "p99_ms": p99},
        "avg_tokens_per_run": avg_tokens,
        "tool_latencies": tool_summary,
        "disclaimer": "All data is synthetic.",
    }
