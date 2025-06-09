import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Debug: Print if token exists and its first few characters
access_token = os.getenv("MIRO_ACCESS_TOKEN")
print(f"Token exists: {bool(access_token)}")
if access_token:
    print(f"Token starts with: {access_token[:10]}...")
    print(f"Token length: {len(access_token)}")
    print(f"Full token for debugging: {access_token}")  # Temporary for debugging

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Bearer {access_token}"
}

# First, let's get the teams
print("\nFetching teams...")
teams_resp = requests.get(
    "https://api.miro.com/v2/teams",
    headers=headers
)
print(f"Teams response status: {teams_resp.status_code}")
print(f"Teams response: {teams_resp.text}")

if teams_resp.status_code == 200:
    teams = teams_resp.json()
    print("\nAvailable teams:")
    for team in teams.get('data', []):
        print(f"Team name: {team.get('name')}, ID: {team.get('id')}")
    
    # Use the first team's ID for now
    team_id = teams['data'][0]['id'] if teams.get('data') else None
    if team_id:
        print(f"\nUsing team ID: {team_id}")
        
        # Create board with team ID
        print("\n1. Creating board...")
        board_resp = requests.post(
            "https://api.miro.com/v2/boards",
            headers=headers,
            json={
                "name": "SenShop Concept Board",
                "description": "Project concept overview: idea, journey, sitemap, flow",
                "teamId": team_id
            }
        )
        print(f"Board creation response status: {board_resp.status_code}")
        print(f"Board creation response: {board_resp.text}")

        if board_resp.status_code == 200:
            board = board_resp.json()
            board_id = board["id"]
            print("Board created successfully:", board["viewLink"])
        else:
            print("\nError creating board. Response:", board_resp.text)
            exit(1)
    else:
        print("No teams found in the response")
        exit(1)
else:
    print("Failed to fetch teams. Please check your token permissions.")
    print("Make sure your token has 'teams:read' permission")
    exit(1)

# 2. Add main section sticky notes
sections = [
    {"title": "🧠 Idea Statement", "content": "This project is a curated e-commerce experience built on React and Medusa. Users browse digital art exhibitions and themed collections. Each artwork can be purchased as a digital download or physical product (framed print, apparel) fulfilled by Print-on-Demand partners like Printful or Gelato. The shopping experience focuses on storytelling, visual exploration, and easy checkout via Stripe with automated invoice generation.", "x": 0, "y": 0, "color": "light_yellow"},
    {"title": "🧭 User Journey Map", "content": "Discovery → Exploration → Evaluation → Decision → Fulfillment → Sharing\n(See details below)", "x": 500, "y": 0, "color": "light_blue"},
    {"title": "🗂️ Sitemap", "content": "Home > About, Collections, Exhibitions, Search/Filter, Cart, Checkout, User Account, Legal\n(See details below)", "x": 0, "y": 400, "color": "light_green"},
    {"title": "🔄 User Flow", "content": "Visit Home Page → Click Collection → View Overview → Click Artwork → Select 'Framed Print' → Add to Cart → Open Cart → Stripe Checkout → Order Confirmation → Delivery/Tracking", "x": 500, "y": 400, "color": "light_pink"},
]

for section in sections:
    resp = requests.post(
        f"https://api.miro.com/v2/boards/{board_id}/sticky_notes",
        headers=headers,
        json={
            "data": {"content": f"<b>{section['title']}</b><br>{section['content']}"},
            "position": {"x": section["x"], "y": section["y"]},
            "style": {"fillColor": section["color"]}
        }
    )
    print(f"Added section: {section['title']}")

# 3. Add details for User Journey Map as sticky notes
journey_stages = [
    ("Discovery", "User sees a post or ad on Instagram featuring an artwork.", "Curious, inspired", "Social Media (Instagram, Pinterest)"),
    ("Exploration", "User visits homepage, browses collections and exhibitions.", "Engaged, exploratory", "Website"),
    ("Evaluation", "User clicks on a specific artwork, reads about it, checks purchase options.", "Interested, comparing options", "Website"),
    ("Decision", "User selects framed print, adds to cart, and checks out.", "Excited, ready", "Website (Stripe Checkout)"),
    ("Fulfillment", "Receives confirmation email and tracking details.", "Satisfied", "Email"),
    ("Sharing", "Posts image of artwork on wall or t-shirt on social media.", "Proud, joyful", "Instagram, WhatsApp, Threads"),
]
x_journey = 900
y_journey = 0
for stage, action, emotion, channel in journey_stages:
    content = f"<b>{stage}</b><br>Action: {action}<br>Emotion: {emotion}<br>Channel: {channel}"
    requests.post(
        f"https://api.miro.com/v2/boards/uXjVIuLa7Ww=/sticky_notes",
        headers=headers,
        json={
            "data": {"content": content},
            "position": {"x": x_journey, "y": y_journey},
            "style": {"fillColor": "light_blue"}
        }
    )
    y_journey += 120

# 4. Add details for Sitemap as sticky notes (tree structure, simplified)
sitemap_items = [
    ("Home", 0, 800),
    ("About", -200, 950),
    ("Collections", 0, 950),
    ("Exhibitions", 200, 950),
    ("Cart", -200, 1100),
    ("Checkout", 0, 1100),
    ("User Account", 200, 1100),
    ("Legal", 0, 1250),
]
for label, x, y in sitemap_items:
    requests.post(
        f"https://api.miro.com/v2/boards/{board_id}/sticky_notes",
        headers=headers,
        json={
            "data": {"content": label},
            "position": {"x": x, "y": y},
            "style": {"fillColor": "light_green"}
        }
    )

# 5. Add details for User Flow as sticky notes (vertical)
user_flow_steps = [
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
]
x_flow = 900
y_flow = 400
for step in user_flow_steps:
    requests.post(
        f"https://api.miro.com/v2/boards/{board_id}/sticky_notes",
        headers=headers,
        json={
            "data": {"content": step},
            "position": {"x": x_flow, "y": y_flow},
            "style": {"fillColor": "light_pink"}
        }
    )
    y_flow += 100

print("All sections and details added! Open your board at:", board["viewLink"])