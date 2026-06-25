from backend import analyze_street

try:
    result = analyze_street("street.jpg")
    print(result)
except Exception as e:
    print("Error:", e)