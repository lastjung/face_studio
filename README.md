# Face Studio - AI Image Generator

> 🚧 **Work in Progress**: This application is currently under active development.


**Reference Video:** [AI로 웹서비스를 개발하는 전체 과정 (랜딩페이지부터 배포·DB·결제까지)](https://www.youtube.com/watch?v=fxi3G8kw87s)

Face Studio is a premium AI portrait generation application built with Next.js and Google Gemini API. It features a robust "Nano Banana" style consistent character generation mode.

![Face Studio UI](/Users/eric/.gemini/antigravity/brain/2061e830-8fbc-4c8d-af17-e0fdbf9ec9e7/final_face_studio_page_1765850056218.png)

## Features

- **AI Image Generation**: Powered by `imagen-4.0-generate-001` (Generation) and `gemini-2.5-flash` (Vision).
- **Nano Banana Mode**: Strict face consistency prompting for maintaining character identity across styles.
- **Dynamic UI**: Clear distinction between Image results and Text Analysis results.
- **Sample Gallery**: Browse and try styles from curated samples.

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your `.env.local`:
    ```env
    GEMINI_API_KEY=your_key_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000).

## Technologies
- Next.js 14 (App Router)
- Tailwind CSS via PostCSS
- Google Generative AI SDK (`@google/generative-ai`)
- Lucide React Icons

## 🚀 Verified & Available Models (2025-12-16)

### ✅ Currently Active Configuration
- **Primary (Image Generation)**: `imagen-4.0-generate-001` (REST API)
  - Capable of high-fidelity, photorealistic generation.
  - Supports "Nano Banana" style face consistency prompting.
- **Fallback (Text/Analysis)**: `gemini-2.5-flash` (SDK)
  - Used for deep text analysis or when image generation is not required.

### 📋 Available Models (For Future Use)
The following models were confirmed available in your account:
- **Image Generation (Imagen 4 Series)**
  - `imagen-4.0-ultra-generate-001` (Higher quality, slower)
  - `imagen-4.0-fast-generate-001` (Faster, optimized for speed)
  - `imagen-4.0-generate-preview-06-06`
- **Video Generation (Veo Series)**
  - `veo-2.0-generate-001`
  - `veo-3.0-generate-001` & `veo-3.0-fast-generate-001`
- **Research & Experimental**
  - `deep-research-pro-preview-12-2025`
  - `gemini-2.0-flash-exp`

> **Note**: To switch models, edit the `PRIMARY_MODEL` constant in `app/actions.ts`.


## 🧠 Model Characteristics & Architecture (Why this setup?)

Understanding the models is key to using Face Studio effectively:

### 1. The Challenge (Direct Multimodal)
- **Imagen 3/4** (`generate-001`): Powerful **Text-to-Image** models. They *cannot* "see" images directly via the public API (returns 400 Error if you send an image).
- **Gemini 2.5** (`preview-image`): Powerful **Vision** models. They can "see" images and describe them perfectly, but they *cannot* "draw" images (returns Text-only or 400 MIME Error).

### 2. The Solution: "Vision-to-Prompt Bridge" 🌉
Face Studio uses a smart 2-step pipeline to achieve "Face Consistency" without a trusted tester account:
1.  **Vision Phase**: `gemini-2.5-flash` analyzes your uploaded photo and extracts critical details (e.g., "Young woman, oval face, green eyes, wavy brown hair...").
2.  **Generation Phase**: These details are combined with your style prompt (e.g., "Cyberpunk warrior") and sent to `imagen-4.0-generate-001` as a highly detailed *text instruction*.
3.  **Result**: The image generator draws a person matching your description in the requested style.

### 3. Pricing & Quotas
- **Free Tier (AI Studio)**: If you use an API key from Google AI Studio, usage is often free but rate-limited.
- **Pay-as-you-go (Vertex)**: Standard rates apply (~$0.03-$0.06/image). Check your [Google Cloud Billing Console](https://console.cloud.google.com/billing).

## � Features & Commands

### 🔍 Check Available Models
Want to see which models your API key can access? Run this command in your terminal:
```bash
npm run check-models
```
This will print a list of all active models (like `imagen-4.0-generate-001`, `veo-2.0`, etc.) available to your account.

## �🚀 How to Enable "Nano Banana Pro" (High-Quality Mode)
To use the professional-grade models (higher resolution, better coherence), update the configuration in `app/actions.ts`:

1.  Open `app/actions.ts`.
2.  Locate the model optimization section.
3.  Change the `PRIMARY_MODEL` constant:

```typescript
// For Pro-level Image Generation (if available in your plan)
const PRIMARY_MODEL = "imagen-3.0-generate-001"; // or "gemini-1.5-pro"
```

*Note: Pro models may have different rate limits or pricing tiers.*

## 📊 Model Comparison Reference

| 모델명 (ID) | 역할 (비유) | 입력 능력 | 출력 능력 | 현재 상태 |
| :--- | :--- | :--- | :--- | :--- |
| `gemini-2.5-flash-preview-image` | 👁️ 눈 (Vision) | 텍스트 + 이미지 | 텍스트 | 사용 가능 (단, 그림은 못 그림) |
| `gemini-2.0-flash-exp` | 🧠 뇌 (All-in-One) | 텍스트 + 이미지 | 텍스트 + 이미지 | 사용 가능 (단, 이미지 생성 기능 제한됨) |
| `imagen-3.0` / `4.0` | 🎨 손 (Painter) | 텍스트 (+일부 이미지) | 고품질 이미지 | ❌ 사용 불가 (권한 없음) |
