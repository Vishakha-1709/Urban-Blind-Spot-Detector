from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tempfile, os, shutil
from ultralytics import YOLO
import cv2
import numpy as np
from collections import Counter

app = FastAPI()

# Allow requests from your React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")


def detect_objects(results):
    counts = Counter()
    for result in results:
        for box in result.boxes:
            cls = int(box.cls[0])
            label = model.names[cls]
            counts[label] += 1
    return counts


def get_brightness(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray))


def calculate_score(persons, cars, traffic_lights, brightness):
    score = 50
    score += persons * 5
    score += traffic_lights * 8
    score += min(cars * 2, 10)
    if brightness < 80:
        score -= 25
    return int(max(0, min(score, 100)))


def get_risk_level(score):
    if score >= 80:
        return "🟢 Community Friendly"
    elif score >= 60:
        return "🟡 Moderate Risk"
    else:
        return "🔴 High Risk"


def get_issues(data):
    issues = []
    if data["brightness"] < 80:
        issues.append("Poor lighting conditions")
    if data["persons"] < 3:
        issues.append("Low pedestrian activity")
    if data["traffic_lights"] == 0:
        issues.append("No traffic infrastructure")
    if not issues:
        issues.append("No major safety concerns detected")
    return issues


def get_recommendations(data):
    recommendations = []
    if data["brightness"] < 80:
        recommendations.append("Install additional streetlights")
    if data["persons"] < 3:
        recommendations.append("Improve pedestrian accessibility")
    if data["traffic_lights"] == 0:
        recommendations.append("Add traffic signals or crossings")
    if not recommendations:
        recommendations.append("Maintain current infrastructure")
    return recommendations


def night_assessment(data):
    night_score = data["score"]
    if data["brightness"] > 120:
        night_score -= 10
    elif data["brightness"] > 80:
        night_score -= 20
    else:
        night_score -= 35
    night_score = max(0, night_score)

    if night_score >= 75:
        status = "🟢 Safe at Night"
    elif night_score >= 50:
        status = "🟡 Use Caution"
    else:
        status = "🔴 Avoid if Possible"

    return night_score, status


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # Save uploaded file to a temp path
    suffix = os.path.splitext(file.filename)[-1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        results = model(tmp_path)
        counts = detect_objects(results)
        brightness = get_brightness(tmp_path)

        persons = counts["person"]
        cars = counts["car"]
        traffic_lights = counts["traffic light"]

        score = calculate_score(persons, cars, traffic_lights, brightness)
        risk_level = get_risk_level(score)

        data = {
            "score": score,
            "risk_level": risk_level,
            "brightness": brightness,
            "persons": persons,
            "cars": cars,
            "traffic_lights": traffic_lights,
        }

        data["issues"] = get_issues(data)
        data["recommendations"] = get_recommendations(data)

        night_score, night_status = night_assessment(data)
        data["night_score"] = night_score
        data["night_status"] = night_status

        return data
    finally:
        os.unlink(tmp_path)
