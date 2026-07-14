from flask import Flask, request, jsonify
from flask_cors import CORS
from recommendation import AyurvedicExpertEngine
import os

app = Flask(__name__)
CORS(app)  # Cross-Origin resource management for high security isolation

@app.route('/api/ai/analyze', methods=['POST'])
def analyze_health_profile():
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"status": "error", "message": "Missing execution payload context"}), 400
            
        # Call heuristic validation engine
        diagnostic_report = AyurvedicExpertEngine.evaluate_profile(payload)
        
        return jsonify({
            "status": "success",
            "data": diagnostic_report
        }), 200
        
    except Exception as e:
        return jsonify({"status": "error", "message": f"Execution fault encountered: {str(e)}"}), 500

if __name__ == '__main__':
    # Run server locally on isolated secure port 5001
    app.run(host='0.0.0.0', port=5001, debug=False)