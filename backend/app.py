from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Prism API running"


@app.route("/health")
def health():
    return {"status": "ok", "service": "prism-backend"}


if __name__ == "__main__":
    app.run()
