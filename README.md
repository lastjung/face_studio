# Face Studio - AI Image Generator 🎨

> **"Turn yourself into anyone, anywhere."**

Created with reference to: https://www.youtube.com/watch?v=fxi3G8kw87s

Face Studio is a premium AI portrait generation web application built with **Next.js 14** and **Google Gemini/Imagen**. 
It features a sophisticated "Vision-to-Prompt" pipeline that allows users to create high-quality, face-consistent images in various styles.

![Face Studio UI](./public/face_studio_demo.jpg)

## ✨ Key Features

- **🎭 AI Character Generation**: Uses **Google Imagen 4.0** for state-of-the-art image synthesis.
- **👁️ Face Consistency**: Leverages **Gemini Vision (2.5-Flash)** to analyze your uploaded photo and generate a detailed description, ensuring the new image looks like you.
- **💰 Credit System**: 
    - Full **Purchase & Refund** flow.
    - **FIFO (First-In-First-Out)** credit deduction logic.
    - Pricing Plans (Starter, Basic, Pro).
- **🔐 Secure Architecture**: 
    - **Supabase Auth**: Secure Google & Kakao login.
    - **Row Level Security (RLS)**: Protects user data and images.
    - **Admin Client**: Secure server-side operations for credit management.
- **📱 Responsive Design**: A beautifully crafted UI that works on Mobile and Desktop.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
- **AI Core**: Google Generative AI SDK (`@google/generative-ai`)
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (Recommended)

## 🚀 Fast Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/face-studio.git
cd face-studio
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Google AI Studio (Get key at aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (Get details at supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Service Role (REQUIRED for Credit System & Admin Ops)
# WARNING: Keep this secret! Never expose to client.
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup (Supabase)
Run the SQL scripts located in `supabase/` in the following order:
1. `01_supabase_schema.sql`: Sets up Auth and Profiles tables.
2. `02_images_and_storage.sql`: Creates Images table and Storage Buckets.
3. `03_add_face_description.sql`: Adds columns for AI analysis.
4. `04_credit_system.sql`: **Crucial** - Sets up Credit Tables, RLS Policies, and Ledger.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 AI Model Architecture

Face Studio uses a **Dual-Model Strategy**:

1.  **Vision Phase (`gemini-2.5-flash`)**: 
    -   *Input*: User Photo + Prompt
    -   *Action*: Analyzes the user's face (eye color, hair style, ethnicity, age).
    -   *Output*: A dense text description (Face Description).

2.  **Generation Phase (`imagen-4.0-generate-001`)**:
    -   *Input*: Style Prompt + Face Description (Prioritized)
    -   *Action*: Generates a high-fidelity image merging the style and the person's description.
    -   *Output*: Final consistent character image.

## 💾 Storage & Persistence

- **Images**: Stored in Supabase Storage bucket `generated_images`.
- **Metadata**: Stored in `public.images` table.
- **Credits**: Managed via `credit_sources` (Balance) and `credit_transactions` (Ledger) tables.

## 👤 Author
Developed with ❤️ by **Face Studio Team**

## 📄 License
MIT License
