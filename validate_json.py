import json
import sys

def validate_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            json.load(f)
        print("OK")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    validate_json(sys.argv[1])
