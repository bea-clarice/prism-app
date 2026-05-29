from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Prism API running"


@app.route("/health")
def health():
    return {"status": "ok", "service": "prism-backend"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)