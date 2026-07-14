import json

class AyurvedicExpertEngine:
    @staticmethod
    def evaluate_profile(health_data):
        """
        Calculates diagnostic vectors based on physical biomarkers and vitals.
        Returns mapped therapeutic interventions, lifestyle adjustments, and yoga workflows.
        """
        symptoms = [s.strip().lower() for s in health_data.get('symptoms', '').split(',')]
        stress = health_data.get('stress_level', 'Medium')
        sleep = health_data.get('sleep_pattern', 'Normal')
        bmi = float(health_data.get('bmi', 22.0))
        
        # Dosha Vector Initialization
        vata, pitta, kapha = 1, 1, 1
        
        # 1. Symptom parsing engine
        for s in symptoms:
            if s in ['insomnia', 'anxiety', 'joint pain', 'constipation', 'dry skin', 'bloating']:
                vata += 2
            if s in ['acidity', 'heartburn', 'skin rash', 'inflammation', 'anger', 'acne']:
                pitta += 2
            if s in ['lethargy', 'weight gain', 'congestion', 'sinusitis', 'slow digestion']:
                kapha += 2
                
        # 2. Metric updates
        if stress == 'High': vata += 2; pitta += 1
        if sleep == 'Poor': vata += 2
        elif sleep == 'Excessive': kapha += 2
        
        if bmi > 25.0: kapha += 2
        elif bmi < 18.5: vata += 2

        # Compute dynamic clinical results matrix
        max_dosha = max(vata, pitta, kapha)
        primary_dosha = "Vata" if max_dosha == vata else "Pitta" if max_dosha == pitta else "Kapha"
        
        therapies = []
        diet = []
        yoga = []
        duration_days = 7

        if primary_dosha == "Vata":
            therapies = [
                {"therapy": "Shirodhara", "rationale": "Calms the nervous system and rebalances elevated hyper-Vata stress curves."},
                {"therapy": "Abhyanga", "rationale": "Lubricates dry tissues, reduces systemic neural pain."},
                {"therapy": "Basti", "rationale": "Addresses primary Vata accumulation located within the colon."}
            ]
            diet = ["Warm, unctuous, grounding foods", "Incorporate healthy fats like Ghee", "Avoid raw, cold salads and dry snacks"]
            yoga = ["Nadi Shodhana Pranayama", "Balasana (Child's Pose)", "Paschimottanasana"]
            duration_days = 14
        elif primary_dosha == "Pitta":
            therapies = [
                {"therapy": "Virechana", "rationale": "Safely purges excessive metabolic heat and biliary toxins from the small intestine."},
                {"therapy": "Shirodhara", "rationale": "Cools down psychophysiological heat indices."},
                {"therapy": "Raktamokshana", "rationale": "Indicated if concurrent systemic inflammatory dermatological expressions are active."}
            ]
            diet = ["Cooling, refreshing sweet and bitter foods", "Coconut water and fresh seasonal fruits", "Strict avoidance of hot spices, alcohol, and fermented items"]
            yoga = ["Sheetali Pranayama", "Bhujangasana (Cobra Pose)", "Savasana"]
            duration_days = 10
        else: # Kapha dominant
            therapies = [
                {"therapy": "Vamana", "rationale": "Ejects stubborn congestive mucus clusters directly from upper physiological sites."},
                {"therapy": "Nasya", "rationale": "Purges deep sinuses and eliminates accumulated cranial stagnation."},
                {"therapy": "Abhyanga", "rationale": "Utilizes vigorous dry rubbing variants to accelerate inert metabolic baselines."}
            ]
            diet = ["Light, warm, pungent, and astringent profiles", "Warm ginger water throughout waking hours", "Eliminate dairy products, heavy sweets, and processed fats"]
            yoga = ["Kapalabhati Pranayama", "Surya Namaskar (Accelerated speed)", "Dhanurasana"]
            duration_days = 21

        return {
            "dominant_dosha": primary_dosha,
            "diagnostic_scores": {"Vata": vata, "Pitta": pitta, "Kapha": kapha},
            "suggested_therapies": therapies,
            "treatment_duration_days": duration_days,
            "dietary_regimen": diet,
            "yoga_asanas": yoga,
            "lifestyle_adjustments": [
                "Maintain a consistent sleep-wake routine matching solar cycles.",
                "Incorporate mindfulness practices to reduce systemic physiological stress markers.",
                "Engage in brief daily self-massage protocols to stabilize cellular recovery."
            ]
        }