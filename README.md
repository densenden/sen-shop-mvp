<!-- Project Badges -->
<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb" alt="React" /></a>
  <a href="https://medusajs.com/"><img src="https://img.shields.io/badge/Medusa-000?logo=medusa&logoColor=white" alt="Medusa" /></a>
  <a href="https://stripe.com/"><img src="https://img.shields.io/badge/Stripe-635bff?logo=stripe&logoColor=white" alt="Stripe" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white" alt="Vercel" /></a>
</p>

# SenShop Commerce

[**Full Idea Statement (PDF) →**](concept/SenShop_idea_statement.pdf)

---

## 🚀 Live Demo

**Check it out live:** [https://commerce.sen.studio](https://commerce.sen.studio)

---

## 🛠️ Tech Stack
- Next.js
- React
- Medusa
- Stripe
- Tailwind CSS
- Vercel (Deployment)
- Printful / Gelato (POD)

---

## 📦 Project Structure
```text
Home
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
```

---

## 🖼️ Example Artworks
<p align="center">
  <img src="concept/images/slide1.jpg" alt="Artwork Example 1" width="250" style="margin:8px;" />
  <img src="concept/images/slide2.jpg" alt="Artwork Example 2" width="250" style="margin:8px;" />
  <img src="concept/images/slide3.jpg" alt="Artwork Example 3" width="250" style="margin:8px;" />
</p>

---

## ▲ Deploy on Vercel

1. [Sign up at Vercel](https://vercel.com/signup) and connect your GitHub repo.
2. Set the root directory to `sen-commerce-storefront`.
3. Add your environment variables (see `sen-commerce-storefront/README.md`).
4. Click **Deploy**.

> **Live URL:** [https://commerce.sen.studio](https://commerce.sen.studio)

---

<details>
<summary>📖 <strong>Project Details & User Flow</strong></summary>

# Idea Statement

This project is a curated e-commerce experience built on React and Medusa. Users browse digital art exhibitions and themed collections. Each artwork can be purchased as a digital download or physical product (framed print, apparel) fulfilled by Print-on-Demand partners like Printful or Gelato. The shopping experience focuses on storytelling, visual exploration, and easy checkout via Stripe with automated invoice generation. 

### User Flow
1. Browse by collection or exhibition
2. Dive into a specific artwork
3. Choose purchase format:
   - Digital Download
   - Framed Print
   - T-Shirt / Apparel
4. Checkout with Stripe
5. Auto-generated invoice + delivery via POD

</details>