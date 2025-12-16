import { Sparkles } from 'lucide-react';

export default function CTA() {
    return (
        <section className="my-32 flex w-full flex-col items-center justify-center px-4 text-center">

            <div className="relative overflow-hidden rounded-3xl bg-black px-8 py-16 text-white shadow-2xl md:px-20">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/30 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/30 blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="mb-6 text-3xl font-bold md:text-5xl">
                        지금 바로 시작해보세요
                    </h2>
                    <p className="mb-10 text-lg text-gray-300 md:text-xl">
                        당신의 상상력을 현실로 만드는 가장 쉬운 방법.<br />
                        Face Studio와 함께 새로운 나를 발견하세요.
                    </p>
                    <button className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:bg-gray-100 hover:scale-105">
                        <Sparkles className="h-5 w-5" />
                        무료로 시작하기
                    </button>
                </div>
            </div>
        </section>
    );
}
