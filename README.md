# Face Studio - AI Image Generator 🎨

> **"Turn yourself into anyone, anywhere."**

Face Studio is a premium AI portrait generation web application built with **Next.js 14** and **Google Gemini/Imagen**. 
It features a sophisticated "Vision-to-Prompt" pipeline that allows users to create high-quality, face-consistent images in various styles without needing complex LoRA training.

![Face Studio UI](./public/face_studio_demo.jpg)

## ✨ Key Features

- **🎭 AI Character Generation**: Uses **Google Imagen 4.0** (or 3.0) for state-of-the-art image synthesis.
- **👁️ Face Consistency**: Leverages **Gemini Vision (2.5-Flash)** to analyze your uploaded photo and generate a detailed description, ensuring the new image looks like you.
- **🔐 Cloud Gallery**: 
    - **Supabase Auth**: Secure Google & Kakao login.
    - **Cloud Storage**: Automatic global hosting of your creations.
    - **Your Database**: All prompts and metadata are saved to your private gallery.
- **📱 Responsive Design**: A beautifully crafted UI that works on Mobile and Desktop, featuring "Glassmorphism" aesthetics.
- **♿ Accessibility Ready**: Built-in support for High Contrast and Screen Readers, with an architecture ready for AI Audio Descriptions.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
- **AI Core**: Google Generative AI SDK (`@google/generative-ai`)
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (Recommended)

## 🚀 fast Start

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
```

### 3. Database Setup (Supabase)
Run the SQL scripts located in `supabase/` to set up your project:
- `supabase_schema.sql`: Sets up Auth, Profiles, and Image tables.
- `03_add_face_description.sql`: Adds advanced columns for prompt tracking.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 AI Model Architecture

Face Studio uses a **Dual-Model Strategy** to overcome common API limitations:

1.  **Vision Phase (`gemini-2.5-flash`)**: 
    -   *Input*: User Photo + Prompt
    -   *Action*: Analyzes the user's face (eye color, hair style, ethnicity, age, bone structure).
    -   *Output*: A dense text description (Face Description).

2.  **Generation Phase (`imagen-4.0-generate-001`)**:
    -   *Input*: Style Prompt + Face Description
    -   *Action*: Generates a high-fidelity image merging the style and the person's description.
    -   *Output*: Final consistent character image.

## 💾 Storage & Persistence

- **Images**: Stored in Supabase Storage bucket `generated_images`.
- **Metadata**: Stored in `public.images` table, including:
    -   Public URL
    -   Original Prompt
    -   Face Description (Vision Analysis)
    -   Final Prompt (Actual instruction sent to AI)

## 👤 Author
Developed with ❤️ by **Face Studio Team**

## 📄 License
MIT License
