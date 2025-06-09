from flask import Flask, render_template, url_for
import json

app = Flask(__name__, static_url_path='/static')

# Load presentation data
SLIDES = [
    {
        "title": "The Art of Commerce",
        "content": {
            "bullets": [
                "Explore digital art as curated collections",
                "Buy digital downloads or physical products",
                "Storytelling meets commerce via POD",
                "Seamless checkout, instant download"
            ],
            "image": "/static/images/slide1.jpg"
        }
    },
    {
        "title": "User Experience Structure",
        "content": {
            "bullets": [
                "Full-width site tree",
                "Visual mapping",
                "Color-coded sections"
            ],
            "image": "/static/images/slide2.jpg"
        }
    },
    {
        "title": "Technology Foundation",
        "content": {
            "bullets": [
                "Frontend: React & Tailwind",
                "Backend: Medusa & PostgreSQL",
                "Deployment: Vercel & Stripe"
            ],
            "image": "/static/images/slide3.jpg"
        }
    },
    {
        "title": "Print-on-Demand Fulfillment",
        "content": {
            "bullets": [
                "Printful Integration",
                "Gelato Partnership",
                "Printify Solutions"
            ],
            "image": "/static/images/slide4.jpg"
        }
    },
    {
        "title": "Seamless Purchase Experience",
        "content": {
            "bullets": [
                "Auto-invoicing",
                "Digital downloads",
                "Tax-compliant billing",
                "Real-time status updates"
            ],
            "image": "/static/images/slide5.jpg"
        }
    }
]

@app.route('/')
def presentation():
    return render_template('presentation.html', slides=SLIDES)

@app.route('/api/slides')
def get_slides():
    return json.dumps(SLIDES)

if __name__ == '__main__':
    app.run(debug=True) 