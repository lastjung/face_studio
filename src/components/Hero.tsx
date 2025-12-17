export default function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center pt-24 pb-12 text-center">
            <div className="relative mb-4 inline-block">
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
                    딸깍 스튜디오
                </h1>
                {/* AI Badge - Rotated 30 degrees to the right of the title */}
                <div className="absolute -top-4 -right-12 rotate-12 rounded-lg bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600 shadow-sm border border-pink-200">
                    AI Powered
                </div>
            </div>

            <p className="mt-4 max-w-2xl text-lg text-gray-600">
                내 얼굴은 그대로, 원하는 모습으로 변신! <br />
                프리미엄 AI 기술로 당신만의 특별한 프로필을 만들어보세요.
            </p>
        </section>
    );
}
