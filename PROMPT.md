# Landing Prompt

Next.js 16 App routing + TypeScript + Tailwind CSS v4로 AI 반응형 이미지 생성 서비스 "딸깍 스튜디오"를 만들어주세요.

## Header (상단 네비게이션 바)
- 왼쪽: 로고
- 가운데: 이미지 생성, 내 갤러리, 요금제, 사용내역 메뉴
- 오른쪽: 시작하기 버튼

## Hero
- 제목: "딸깍 스튜디오" (우측 상단 우측으로 30도 기울어진 "AI" 배지 포함)
- 부제: "내 얼굴은 그대로, 원하는 모습으로 변신!"

## 흰색 톤의 AI 이미지 생성 인터페이스
- 가로로 긴 프롬프트 입력창, 입력창 내 우측 하단에 이미지 업로드 아이콘
- 프롬프트 입력창과 좌우 너비가 같은 검정색 "생성하기" 버튼
- 모델 / 스타일 / 비율 선택 버튼 (드롭다운으로 옵션 선택)

## SAMPLE GALLERY
- 제목: "SAMPLE GALLERY"
- 부제: "프리미엄 AI 모데링 만든 놀라운 변화 (다음 줄)
- 크기가 작은 여성/남성/아이 정사각형 이미지 박스 3개가 가로로 나열
- 바로 아래 큰 원본 이미지, 이미지 위쪽에 검정색 "원본사진" 배지, 기본 세팅은 여성 이미지이며, 남성, 아이 클릭 시 해당 이미지로 변경
- 원본 이미지 아래 3x3 예시 이미지 그리드, 이미지 위쪽에 검정색 "AI 생성 이미지" 배지, (마찬가지로 기본은 여성, 남성, 아이 클릭 시 해당 이미지로 변경 )

# CTA
- "지금 바로 시작해보세요"
- 바로 시작하기 → 버튼

## Footer
- 푸터 좌측: 회사 기본 정보(상호명, 대표, 사업자등록번호, 통신판매업신고, 주소, 이메일을 푸터 좌측에,
- 푸터 우측: 이용 약관, 개인정보 처리 방침, © 2025 상호명. All rights reserved

## 기능
- 예시 이미지 클릭 시 프롬프트 입력창에 텍스트 자동 입력,

## 디자인
- 전체적으로 밝은 회색 배경
- 에메랄드색 Primary 버튼

# Login Prompt

## 로그인 창 구현 (팝업 모달)
- 별도의 로그인 페이지 이동이 아닌, 현재 화면 가운데 팝업되는 형태
- **트리거**: 로그인을 하지 않은 상태에서 다음 요소 클릭 시 로그인 창 팝업
  - 프롬프트 입력창, 생성하기 버튼, 모델/스타일/비율 드롭다운
  - 내 갤러리 메뉴, 상단 시작하기 버튼, 이미지 업로드 버튼
  - 샘플 갤러리 이미지, 하단 바로 시작하기 버튼

## 로그인 창 디자인
- **레이아웃**: 화면 정중앙 배치 (Backdrop blur 적용)
- **헤더 텍스트**:
  - 제목: "로그인/회원가입"
  - 설명: "딸깍 스튜디오에서 나만의 특별한 이미지를 만들어보세요"
- **소셜 로그인 버튼**:
  - **구글**: 회색 배경, 구글 로고 + "구글로 계속하기" 텍스트 (가운데 정렬)
  - **카카오**: 노란색(#FEE500) 배경, 카카오 로고 + "카카오로 계속하기" 텍스트 (가운데 정렬)
  - 로고와 텍스트는 버튼 중앙에 함께 배치 (아이콘과 텍스트를 그룹화하여 중앙 정렬)
- **기타**: 우측 상단 닫기(X) 버튼, 하단 약관 동의 문구

# Supabase Profile Table

## Database Schema (PostgreSQL)

### 1. Custom Types
- **Enum**: `public.app_role` ('Admin', 'User')
  - 대시보드에서 권한을 직관적으로 관리하기 위함

### 2. Profiles Table (`public.profiles`)
- **PK**: `id` (UUID, `auth.users` 테이블 참조, ON DELETE CASCADE)
- **Columns**:
  - `username` (text, 3자 이상)
  - `full_name` (text)
  - `avatar_url` (text)
  - `website` (text)
  - `role` (public.app_role, Default: 'User')
  - `updated_at` (timestamp with time zone)

### 3. Security (RLS)
- **Select**: 모든 사용자 허용 (`true`)
- **Insert/Update**: 본인(`auth.uid() = id`)만 가능

### 4. Encryption & Automation
- **Trigger**: `public.handle_new_user` 함수
  - `auth.users`에 INSERT 발생 시(회원가입), 자동으로 `profiles` 테이블에 해당 유저 행 생성
  - 메타데이터(`full_name`, `avatar_url`) 자동 복사 및 기본 롤 설정

# Supabase Integration Details

## 1. Stack & Libraries
- **Client**: `@supabase/supabase-js`
- **SSR/Server**: `@supabase/ssr` (Next.js 14 App Router 호환)
- **Role Management**: Custom `app_role` Enum (Admin/User)

## 2. Authentication Flow
1.  **Trigger**: User clicks "Login" button (Google/Kakao).
2.  **Client Action**: `supabase.auth.signInWithOAuth()` called with `redirectTo` param.
    - `redirectTo`: `${origin}/auth/callback?next=${currentPath}`
    - `next` 파라미터를 통해 로그인 시도 전 페이지 위치를 기억.
3.  **Provider**: Google/Kakao 로그인 페이지로 이동 및 인증 수행.
4.  **Callback**: `/app/auth/callback/route.ts`로 리다이렉트 (Code 포함).
5.  **Server Action**:
    - `exchangeCodeForSession(code)` 실행하여 쿠키에 세션 저장.
    - `next` 파라미터가 있으면 해당 경로로, 없으면 홈(`/`)으로 최종 리다이렉트.

## 3. Middleware (`middleware.ts`)
- 모든 요청에 대해 `updateSession` 실행.
- 쿠키 세션 만료 시 토큰 자동 갱신 (Silent Refresh).
- SSR 페이지 렌더링 전 유저 인증 상태 확정.

# 📸 첨부된 이미지 요구사항 (Supabase)

## 참조 문서
- **SSR Auth (Next.js)**:
  - https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
- **Social Login (Google/Kakao)**:
  - https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=web&queryGroups=environment&environment=client
  - https://supabase.com/docs/guides/auth/social-login/auth-kakao?queryGroups=environment&environment=client
- **User Data Management**:
  - https://supabase.com/docs/guides/auth/managing-user-data

## 핵심 요구사항
1.  **리다이렉트**: 로그인 성공 시 반드시 사용자가 로그인을 시도한 페이지로 돌아가야 함.
2.  **Profiles 테이블**:
    - 위 문서(managing-user-data) 참조하여 생성.
    - `role` 컬럼을 두고 **Admin, User, Null** 중 선택 가능하도록 Enum 설정.

# My Gallery Page Requirements (내 갤러리 페이지)

## 1. 페이지 구조 및 네비게이션
- **URL**: `/gallery`
- **접근**: 헤더바의 "내 갤러리" 버튼 클릭 시 이동 (헤더바는 그대로 유지)

## 2. 그리드 레이아웃 표시
- **항목**: 사용자가 생성한 모든 이미지를 격자 형태로 표시
- **반응형**:
  - **모바일**: 2줄 (2 Columns)
  - **컴퓨터**: 4줄 (4 Columns)
- **인터랙션**:
  - **호버**: 이미지 위에 마우스 올리면 우측 상단 다운로드/삭제 아이콘 표시
  - **무한 스크롤**:
    - 초기 로드: 최대 20개 이미지 표시
    - 스크롤 내리면 자동으로 다음 이미지들 불러오기

## 3. 이미지 상세 팝업 (모달)
- **트리거**: 이미지 클릭 시 두 영역으로 나눠진 팝업 띄움
- **구성**:
  - **왼쪽 영역**: 이미지 반영 (반드시 이미지 전체가 보여야 함)

## 4. 개발 환경 (Mock Data)
- **조건**: 개발 환경에서만 보이는 랜덤한 샘플 이미지 60개 반영
- **데이터 소스**: `https://picsum.photos/`에서 랜덤한 이미지 가져옴
- **설정**: `picsum.photos` 도메인을 `next.config.ts`에 추가

# Image Storage & Persistence Logic

## 1. Process Overview
1.  **Imagen API 호출**: 이미지 생성 (Base64 수신)
2.  **Supabase Storage 업로드**:
    -   `generated_images` 버킷에 이미지 파일 저장
    -   Content-Type: `image/png`
    -   Path: `{user_id}/{timestamp}_{uuid}.png`
3.  **Database 저장 (`public.images`)**:
    -   `storage_url`: Storage의 Public URL
    -   `prompt`: 생성 프롬프트
    -   `model`: 사용 모델
    -   `user_id`: 생성한 유저 ID
4.  **Client 응답**: 생성된 이미지의 Signed URL 또는 Public URL 반환

## 2. Database Schema (`public.images`)
-   `id`: UUID (PK)
-   `user_id`: UUID (FK to auth.users)
-   `storage_path`: Text (스토리지 경로)
-   `prompt`: Text
-   `model`: Text
-   `created_at`: Timestamptz (Default: now())
-   `face_description`: Text (Gemini Vision Analysis)
-   `final_prompt`: Text (Actual Prompt sent to GenAI)

# Feature Proposal: Low Vision Accessibility (저시력자 접근성)

## Goal
Improve the experience for users with low vision by providing detailed, descriptive alt text for generated images, going beyond simple prompts.

## Implementation Strategy: "AI Audio Description"
Use **Gemini Vision** to re-analyze the *generated output image* specifically for accessibility purposes.

### 1. Workflow
1.  **Generation**: User generates an image.
2.  **Post-Processing**: The system sends the generated image to Gemini Vision with a specialized prompt.
    -   *Prompt Example*: "Describe this image for a visually impaired user. Focus on detailed visual elements like lighting, facial expressions, colors, composition, and mood. Be descriptive and vivid."
3.  **Storage**: Save this description in a new column (e.g., `accessibility_desc`).

### 2. User Interface
-   **Alt Text**: Automatically inject this description into the `alt` attribute of the image tag.
-   **TTS (Text-to-Speech)**: Add a "Play Description" (Speaker icon) button in the Gallery/Modal.
    -   Clicking it reads out the vivid description using the Web Speech API or a cloud TTS service.
-   **Screen Reader Optimization**: Ensure this text is accessible to screen readers (ARIA labels).

