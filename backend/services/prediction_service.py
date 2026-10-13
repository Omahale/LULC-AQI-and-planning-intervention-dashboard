"""
Prediction service layer.

NOTE: No forecasting model is trained yet. This returns a simple
placeholder forecast so the Prediction page renders real-looking data.
When you build an actual model (e.g. a time-series model trained on
historical AQI + LULC change), replace get_forecast() with a call to
that model instead - keep the same return shape.
"""

from datetime import datetime, timedelta
import random


def get_forecast(days=6):
    today = datetime.utcnow()
    base = 142
    forecast = [{"day": "Today", "actual": base, "predicted": base}]
    for i in range(1, days + 1):
        day_label = f"Day {i}"
        predicted = max(40, base + random.randint(-25, 30))
        forecast.append({"day": day_label, "actual": None, "predicted": predicted})
    return {"source": "placeholder", "data": forecast}
