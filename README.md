# Idea Statement

This project is a curated e-commerce experience built on React and Medusa. Users browse digital art exhibitions and themed collections. Each artwork can be purchased as a digital download or physical product (framed print, apparel) fulfilled by Print-on-Demand partners like Printful or Gelato. The shopping experience focuses on storytelling, visual exploration, and easy checkout via Stripe with automated invoice generation. 

\Home  
├── About  
├── Collections  
│   ├── [Collection Overview Page]  
│   │   ├── Story / Theme  
│   │   └── Artworks Grid  
│   └── [Artwork Page]  
│       ├── Artwork Details  
│       ├── Image Preview  
│       ├── Purchase Options  
│       │   ├── Download  
│       │   ├── Print  
│       │   ├── Framed  
│       │   └── Apparel  
│       └── Add to Cart  
├── Exhibitions (Optional)  
├── Search / Filter  
├── Cart  
├── Checkout (Stripe)  
├── My Orders / Downloads  
└── Legal  
    ├── Terms  
    ├── Privacy  
    └── Imprint  

User Flow:
	1.	Browse by collection or exhibition
	2.	Dive into a specific artwork
	3.	Choose purchase format:
	•	Digital Download
	•	Framed Print
	•	T-Shirt / Apparel
	4.	Checkout with Stripe
	5.	Auto-generated invoice + delivery via POD