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
    },
    {
        "title": "Miro Board Overview",
        "content": {
            "bullets": [
                "View the full concept visually on Miro:",
                "[Open Miro Board](https://miro.com/app/board/uXxMiroBoardLink/)"
            ],
            "image": "/static/images/miro_board.jpg"
        }
    },
    {
        "title": "User Journey – From Discovery to Delight",
        "content": {
            "bullets": [
                "Discovery: User sees a post or ad on Instagram featuring an artwork. (Curious, inspired)",
                "Exploration: User visits homepage, browses collections and exhibitions. (Engaged, exploratory)",
                "Evaluation: User clicks on a specific artwork, reads about it, checks purchase options. (Interested, comparing options)",
                "Decision: User selects framed print, adds to cart, and checks out. (Excited, ready)",
                "Fulfillment: Receives confirmation email and tracking details. (Satisfied)",
                "Sharing: Posts image of artwork on wall or t-shirt on social media. (Proud, joyful)"
            ],
            "image": "/static/images/user_journey.jpg"
        }
    },
    {
        "title": "User Flow – Purchase a Framed Print",
        "content": {
            "bullets": [
                "Visit Home Page",
                "Click on a Collection",
                "View Collection Overview",
                "Click on an Artwork",
                "Select 'Framed Print' Option",
                "Add to Cart",
                "Open Cart",
                "Proceed to Stripe Checkout",
                "Receive Order Confirmation",
                "Receive Delivery / Tracking Info"
            ],
            "image": "/static/images/user_flow.jpg"
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