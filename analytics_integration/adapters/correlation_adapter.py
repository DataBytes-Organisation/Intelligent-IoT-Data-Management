def adapt_correlation_response(raw_response: dict, request_context: dict = None) -> list:
    if not isinstance(raw_response, dict):
        raise ValueError("raw_response must be a dictionary")
    
    # 1. Handle service errors
    if "error" in raw_response or raw_response.get("status") == "error":
        error_msg = raw_response.get("error") or raw_response.get("message") or "Unknown correlation service error"
        raise RuntimeError(f"CORRELATION_SERVICE_ERROR: {error_msg}")

    # 2. Validate request context
    if request_context is None or not isinstance(request_context, dict):
        raise ValueError("MISSING_REQUEST_CONTEXT: request_context must be provided")

    method = request_context.get("method", "Rolling_Pearson_Correlation")
    window_size = request_context.get("window_size", 30)
    step_size = request_context.get("step_size", 5)

    adapted_alerts = []
    
    # 3. Process alerts using Tommy's primary field names
    raw_alerts = raw_response.get("alerts", [])
    for item in raw_alerts:
        # stream_1 / stream_2 primary
        metric_1 = item.get("stream_1") or item.get("metric_a", "unknown_1")
        metric_2 = item.get("stream_2") or item.get("metric_b", "unknown_2")
        
        # end_time / start_time primary
        time_end = item.get("end_time") or item.get("timestamp")
        time_start = item.get("start_time") or item.get("window_start")
        
        # previous_corr / current_corr / delta primary
        prev_corr = item.get("previous_corr") if "previous_corr" in item else item.get("previous_correlation")
        curr_corr = item.get("current_corr") if "current_corr" in item else item.get("current_correlation")
        delta_val = item.get("delta") if "delta" in item else item.get("correlation_delta")
        
        alert_level = item.get("alert_level") or item.get("severity")
        msg = item.get("reason") or item.get("message") or f"Correlation between {metric_1} and {metric_2} changed by {delta_val}."
        win_idx = item.get("window_index")

        alert_obj = {
            "timestamp": time_end,
            "alert_type": "CORRELATION_CHANGE",
            "target": {
                "entity_id": item.get("entity_id", None),
                "metrics": [metric_1, metric_2]
            },
            "method": method,
            "score": delta_val,
            "score_metadata": {
                "type": "absolute_correlation_delta",
                "normalized": False
            },
            "severity": alert_level,
            "message": msg,
            "time_window": {
                "start": time_start,
                "end": time_end,
                "window_size": window_size,
                "step_size": step_size
            },
            "supporting_values": {
                "previous_correlation": prev_corr,
                "current_correlation": curr_corr,
                "delta": delta_val,
                "window_index": win_idx
            },
            "source": {
                "component": "correlation"
            },
            "alert_id": None
        }
        adapted_alerts.append(alert_obj)

    # Return only the list of alert objects for downstream envelope builder
    return adapted_alerts