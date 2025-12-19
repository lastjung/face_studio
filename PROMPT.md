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

## 요금제 및 할인 관리 기능

### 1. 요금제 관리 페이지
- Supabase `pricing_plans` 테이블과 연동하여 관리자 페이지에서 요금 및 크레딧 직접 관리
- **할인 기능 추가**:
    - `pricing_plans` 테이블에 `discounted_price` (할인가), `discount_percentage` (할인율) 컬럼 추가
    - 관리자가 할인가를 입력하면 할인율 자동 계산되어 저장

### 2. 할인 기능 (관리자)
- 요금제 추가/수정 시 '할인가' 입력 필드 제공
- 할인가 입력 시 할인율(%) 자동 계산 및 표시

### 3. 할인 기능 (사용자)
- `/pricing` 페이지에 할인 적용된 가격 노출
- 원가(취소선)와 할인가, 할인율 배지 표시

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

# Credit System Requirements (크레딧 시스템)

크레딧 시스템을 처음부터 끝까지 완전히 구현해줘.

## 요구사항

### 크레딧 정책
- 이미지 생성 시 모델별 크레딧 차감: 터보(1), 기본(2), 고품질(3)
- 플래시 모델은 선택 옵션에서 제거
- 크레딧 구매 시 추가
- 먼저 구매한 크레딧부터 먼저 소진 (FIFO)

### 요금제
- Starter: 10 크레딧, ₩3,900
- Basic: 30 크레딧, ₩9,800
- Pro: 60 크레딧, ₩18,800

### UI
- 헤더바 프로필 버튼 왼쪽에 현재 크레딧 표시
- 사용자가 이미지를 생성해 크레딧을 소진하는 경우 잔여 크레딧 화면에 실시간 업데이트
- /pricing 페이지 생성 (요금제 3개 카드로 표시, 구매 버튼)
- 헤더바의 "요금제 (/pricing)", "사용 내역 (/credits/history)" 페이지 생성
- 헤더바의 "요금제" "사용 내역" 버튼을 누르면 이동 (헤더바는 그대로 유지)
- 크레딧 부족 시 에러 메시지 표시
- 환불 요청 버튼 및 모달

### 크레딧 소진 방식 (FIFO)
- 이미지 생성 시 자동 크레딧 차감
- 크레딧 구매 (지금은 테스트용, 나중에 토스페이먼츠 연동 예정)
- First-in-First-Out 방식 적용
- /pricing 페이지는 pricing_plans 테이블에서 요금제 정보 조회
- 크레딧 사용 내역 페이지 (/credits/history)
- 각 구매건별로 사용 여부 표시

### 환불 정책 (중요!)
1. 환불 요청 조건: 각 구매건 별로 구매한 크레딧을 하나도 사용하지 않은 경우에만 가능
2. 크레딧 구매 후 7일 이내에만 환불 요청 가능
3. 크레딧을 1개라도 사용한 구매건은 환불 요청 불가 (UI에서 버튼 비활성화)
4. 사용자가 환불 요청 시 해당 구매건의 상태가 'pending_refund'로 변경
5. 환불 대기 중인 구매건의 크레딧은 사용 불가 (환불 대기 중인 구매건은 건너뛰고 다음 크레딧 사용)
6. 관리자가 환불 승인 시:
   - 해당 구매건의 전체 크레딧만큼 profiles.credits에서 차감
   - 구매건 상태를 'refunded'로 변경
7. 관리자가 환불 거부 시:
   - 구매건 상태를 다시 'active'로 변경
   - 크레딧 다시 사용 가능

## 현재 데이터베이스 (Auth, profiles, generated_images)
- profiles 테이블: auth 참조
- generated_images 테이블: user_id -> profiles.id 참조
- 중요: 모든 사용자 관련 테이블은 profiles.id를 참조해야 함 (auth.users.id 직접 참조 X)

### 구현이 필요한 데이터베이스
- profiles 테이블에 credits 컬럼 추가
- 크레딧 관련 테이블 6개 생성:

1. pricing_plans - 요금제 정보 (공통 테이블, user_id 없음)
   - name: 요금제명
   - credits: 크레딧 개수
   - price: 가격
   - is_active: 판매 중 여부
   - sort_order: 정렬 순서

2. credit_sources - 구매건별 잔액 추적 (FIFO용)
   - user_id -> profiles.id 참조
   - status: active, pending_refund, refunded
   - initial_credits: 구매 시 크레딧
   - remaining_credits: 남은 크레딧
   - plan_id -> pricing_plans.id 참조

3. credit_consumption - 소비 상세 기록
   - user_id -> profiles.id 참조

4. credit_transactions - 모든 증감 로그
   - user_id -> profiles.id 참조

5. payment_history - 결제 내역
   - user_id -> profiles.id 참조

6. refund_requests - 환불 요청
   - user_id -> profiles.id 참조
   - status: pending, approved, rejected

- 모든 사용자 관련 테이블의 user_id는 profiles.id를 참조

### 초기 데이터
- pricing_plans 테이블에 3개 요금제 추가

모든 API, 페이지, 컴포넌트, 데이터베이스 마이그레이션 파일을 자동으로 생성해줘
한글 주석과 함께 각 단계별로 설명해줘.
FIFO 로직과 환불 처리 로직은 특히 상세하게 구현해줘.


# Toss Payments 결제 연동 요구사항 (이미지 텍스트 변환)

결제페이지를 만들고, 결제페이지에 토스페이먼츠 결제위젯을 렌더링해줘

다음 결제 위젯 연동 가이드, SDK 문서를 철저히 읽고 Next.js + React + Typescript 프로젝트에 맞게 구현해줘.

@https://docs.tosspayments.com/guides/v2/payment-widget/integration (결제위젯 연동 가이드)
@https://docs.tosspayments.com/sdk/v2/js (SDK 문서 중 결제위젯 관련 부분 참조)

1. 요금제 페이지(/pricing)에서 요금제를 선택하면 결제페이지로 이동
2. 주문정보 창: 결제창 우측에 배치(PC) 결제창 위에 배치(모바일)
3. 결제 UI는 반드시 주문서의 DOM이 생성된 이후에 호출해야함
4. 결제를 완료하면 사용자 크레딧에 결제분 반영
5. 로그인 하지 않은 사용자가 구매하기 버튼을 클릭하면 로그인페이지로 연동되는 것이 아닌 로그인 창을 띄움 -> 로그인을 마치면 결제페이지로 이동
6. 환경변수를 기존에 있는 .env.local파일 맨 아래에 반드시 직접 반영해줘

# Toss Payments Configuration Note
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6

참고로 프롬프트 맨 아래 반영된 두 가지 키는 결제위젯 연동 가이드 나와있는 테스트 키로 결제를 진행해도 실제로는 비용이 전혀 발생하지 않습니다. 추후 토스페이먼츠 계약 완료 이후 라이브키로 변경하면 실제 결제가 진행됩니다.

# [관리자 페이지 요청 사항]

1. 관리자 페이지(/admin) 구현

관리자페이지(/admin) 만들어줘

먼저 관리자 로그인 페이지(/admin/login)에서 로그인을 마치면 -> 관리자페이지(/admin)으로 연결되는 플로우

(중요) 관리자 로그인 페이지에서는 사이드바 없이 로그인 페이지만 표시

##구성

관리자 페이지 구성 메뉴(총 5개): 대시보드, 회원 관리, 결제 관리, 환불 관리, 요금제 관리

왼쪽 사이드바에서 메뉴 클릭해 각 메뉴 접속, 기존사이트의 헤더 및 푸터는 관리자페이지에서는 표시하지 않음

##대시 보드

대시보드에 표시할 데이터는 DB에서 직접 가져오는 것이 아닌, 최대한 다른 메뉴의 데이터를 가져와 집계하는 형태로 제공

## 요금제 관리 페이지

Supabase pricing_plans 테이블과 연동해 관리자페이지에서 요금 및 크레딧 직접 가능하도록 적용

내가 직접 언급한 부분 외 나머지 요소는 최대한 심플하고 꼭 필요한 기능 위주로 구현해줘

현재 Database 철저히 살펴보고 한번에 연동 잘 되게 구현해줘.

# [2] 요금제 및 할인 관리 기능을 prompt.md 파일에 붙이고 개발해줘

## 요금제 관리 페이지

Supabase pricing_plans 테이블과 연동해 관리자페이지에서 요금 및 크레딧 직접 관리 가능하도록 적용

관리자 페이지 > 요금제 관리 페이지에 플랜별로 할인을 적용할 수 있는 기능을 추가할거야

Supabase Pricing_plans 테이블에 discounted_price와 discounted_percentage 컬럼을 추가해줘. (이미지의 '테이블' 오타를 문맥에 맞게 '컬럼'으로 수정하여 적용)

## 할인 기능 (관리자)

요금제 관리 페이지에서 직접 할인가를 지정할 수 있게 해줘

할인가를 지정하면 자동으로 할인률이 계산되어 적용되게 해줘

## 할인 기능 (사용자)

적용된 할인가와 할인률이 요금제 페이지(/pricing)에도 적절하게 노출되어 사용자가 볼 수 있게 해줘

## 기타 요청

내가 직접 언급한 부분 외 나머지 요소는 최대한 심플하고 꼭 필요한 기능 위주로 구현해줘


# [3] 회원 탈퇴 Soft Delete 구현

회원 탈퇴시 Soft Delete방식을 적용할거야.

다음은 Supabase의 Soft Delete에 대한 공식문서 링크야. 참조해서 구현해줘
https://supabase.com/docs/guides/troubleshooting/soft-deletes-with-supabase-js

문서에 나와있듯이 Profiles테이블에 deleted_at 컬럼을 추가해서 관리해줘.
deleted_at 컬럼에 데이터가 null인 경우에만 프로필 조회가 가능하도록 설정해줘


# [4] 사용자 활동 로그 시스템 구현

통신비밀보호법 준수를 위해 로그 테이블을 만들고
1. 로그인 2. 로그아웃 3. 페이지방문 기록을 저장할거야

- 로그인/로그아웃: 기존 로그인 처리 부분에 로그 코드 추가
- 페이지방문 기록: 페이지가 바뀔 때 브라우저에서 감지해 서버에 기록

- 로그인한 사용자의 기록만 저장
- 저장된 모든 로그 기록이 3개월 후 자동삭제되는 로직 구현해 줘
(Supabase pg_cron 이용)

Supabase 현재 데이터베이스 직접 살펴보고 나서 구현 시작해

여기서 pg_cron은 PostgreSQL 내에서 정해진 시간마다 특정 SQL 명령을 자동으로 실행할 수 있게 해주는 예약 작업(스케줄러) 확장 기능입니다. 즉, 매일 자정에 로그 테이블을 조회해 생성일로부터 90일이 지난 로그를 자동으로 삭제하도록 설정할 수 있습니다.

# [5] 데이터 암호화 (Application-Level Encryption)

개인정보 보호를 위해 주요 민감 데이터를 데이터베이스에 평문으로 저장하지 않고, 애플리케이션 레벨에서 암호화하여 저장할거야.

## 암호화 대상

1.  **Profiles 테이블**:
    *   `full_name`: 사용자 실명
    *   `email`: 사용자 이메일 (새로 추가)
2.  **Activity Logs 테이블**:
    *   `ip_address`: 접속 IP 주소

## 구현 방식

1.  **알고리즘**: `AES-256-GCM` (강력한 보안 및 무결성 보장)
2.  **키 관리**:
    *   환경 변수 `ENCRYPTION_KEY`에 32바이트 Hex 문자열로 관리
    *   DB 내부가 아닌 Next.js **서버 사이드(backend)**에서 암/복호화 수행
3.  **프로필 생성 로직 변경**:
    *   기존 DB Trigger(`handle_new_user`) 제거
    *   로그인 시(`ensureUserProfile`) 서버 액션에서 암호화 후 DB Insert/Update 수행

## 관리자 기능 (Admin View)

*   관리자 페이지(`/admin/*`)에서는 해당 암호화된 컬럼들을 **자동으로 복호화**하여 보여줘야 함 (실명/이메일 확인 가능하도록)
*   일반 사용자는 본인 정보 외 타인의 정보를 복호화할 수 없어야 함

## 마이그레이션

*   기존에 가입된 평문 데이터가 있다면, 이를 일괄 암호화하는 스크립트(`scripts/encrypt_all_profiles.ts`)를 통해 마이그레이션 수행



