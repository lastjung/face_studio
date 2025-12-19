"use client";

import { useState, useRef } from 'react';
import { Upload, Sparkles, ChevronDown, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface GeneratorInterfaceProps {
    prompt: string;
    setPrompt: (value: string) => void;
}

import { generateImage } from '@/app/actions';

export default function GeneratorInterface({ prompt, setPrompt }: GeneratorInterfaceProps) {
    const { isLoggedIn, openLoginModal } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [modelUsed, setModelUsed] = useState<string | null>(null);
    const [errorLogs, setErrorLogs] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [style, setStyle] = useState("사실적");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [framing, setFraming] = useState("전신"); // New State
    // Advanced Settings
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [negativePrompt, setNegativePrompt] = useState("");
    const [imageCount, setImageCount] = useState(1);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]); // New Array State

    const handleAuthCheck = (e?: React.MouseEvent | React.TouchEvent) => {
        if (!isLoggedIn) {
            e?.preventDefault();
            e?.stopPropagation();
            openLoginModal();
            return false;
        }
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedImage(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setSelectedImage(null);
            }
        }
    };



    const handleGenerate = async () => {
        if (!handleAuthCheck()) return;

        if (!prompt) return;
        setIsGenerating(true);
        setGeneratedImage(null);
        setGeneratedImages([]); // Clear array
        setAnalysis(null);
        setModelUsed(null);
        setErrorLogs([]);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('aspectRatio', aspectRatio);
            formData.append('style', style);
            formData.append('framing', framing); // Send Framing
            // Advanced
            formData.append('negativePrompt', negativePrompt);
            formData.append('imageCount', imageCount.toString());

            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            const result = await generateImage(formData);

            if (result.success) {
                // Update State based on Result
                if (result.imageUrls && result.imageUrls.length > 0) {
                    setGeneratedImages(result.imageUrls);
                    setGeneratedImage(result.imageUrls[0]); // Fallback
                } else if (result.imageUrl) {
                    setGeneratedImages([result.imageUrl]);
                    setGeneratedImage(result.imageUrl);
                }

                if (result.analysis) setAnalysis(result.analysis);
                if (result.modelUsed) setModelUsed(result.modelUsed);
                if (result.errorLogs) setErrorLogs(result.errorLogs); // Append if partial failures
            } else {
                console.error("Generation failed:", result.error);
                if (result.errorLogs) setErrorLogs(result.errorLogs);
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error calling generation action:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="w-full max-w-4xl px-4 py-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50">

                {/* Main Input Area */}
                <div className="relative mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-grow flex flex-col gap-2">
                        {/* Uploaded Image Preview (Immediately above prompt input) */}
                        {/* Uploaded Image/File Preview */}
                        {(selectedImage || selectedFile) && (
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                {selectedFile?.type === 'application/pdf' ? (
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <span className="text-xs font-bold">PDF</span>
                                        <span className="text-[10px]">{selectedFile.name.slice(0, 8)}...</span>
                                    </div>
                                ) : (
                                    selectedImage && <img src={selectedImage} alt="Uploaded" className="h-full w-full object-cover" />
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setSelectedFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="absolute top-0 right-0 bg-black/50 p-1 text-white hover:bg-black/70 rounded-bl-lg"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        <div onClick={handleAuthCheck} className="relative w-full">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={!isLoggedIn}
                                placeholder="변신하고 싶은 모습을 묘사해주세요 (예: 사이버펑크 스타일의 미래 전사)"
                                className="w-full rounded-xl border border-gray-300 bg-gray-50 py-4 pl-6 pr-14 text-lg outline-none transition-all focus:border-black focus:ring-1 focus:ring-black disabled:bg-white disabled:cursor-pointer"
                            />
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={(e) => {
                                if (handleAuthCheck(e)) {
                                    fileInputRef.current?.click();
                                }
                            }}
                            className="absolute bottom-3 right-4 rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        >
                            <Upload className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-black py-4 px-8 text-lg font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="h-5 w-5" />
                        )}
                        {isGenerating ? "생성 중..." : "생성하기"}
                    </button>
                </div>

                {/* Options Bar */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

                    {/* Style Selector (Merged Model+Style) */}
                    <div className="relative" onClick={handleAuthCheck}>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            disabled={!isLoggedIn}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none hover:border-gray-400 focus:border-black disabled:cursor-pointer disabled:bg-white"
                        >
                            <option value="사실적">사실적</option>
                            <option value="일러스트">일러스트</option>
                            <option value="애니메이션">애니메이션</option>
                            <option value="수채화">수채화</option>
                            <option value="유화">유화</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Ratio Selector */}
                    <div className="relative" onClick={handleAuthCheck}>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            disabled={!isLoggedIn}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none hover:border-gray-400 focus:border-black disabled:cursor-pointer disabled:bg-white"
                        >
                            <option value="1:1">1:1 Square</option>
                            <option value="4:3">4:3 Landscape</option>
                            <option value="3:4">3:4 Portrait</option>
                            <option value="16:9">16:9 Landscape</option>
                            <option value="9:16">9:16 Portrait</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Framing Selector (New) */}
                    <div className="relative" onClick={handleAuthCheck}>
                        <select
                            value={framing}
                            onChange={(e) => setFraming(e.target.value)}
                            disabled={!isLoggedIn}
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 outline-none hover:border-gray-400 focus:border-black disabled:cursor-pointer disabled:bg-white"
                        >
                            <option value="얼굴 위주">얼굴 위주 (Face)</option>
                            <option value="가슴 위">가슴 위 (Bust)</option>
                            <option value="상반신">상반신 (Waist Up)</option>
                            <option value="무릎 위">무릎 위 (Knee Up)</option>
                            <option value="전신">전신 (Full Body)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Advanced Settings Button */}
                    <button
                        onClick={() => {
                            if (handleAuthCheck()) {
                                setShowAdvanced(!showAdvanced);
                            }
                        }}
                        className={`rounded-lg border border-dashed py-2.5 text-sm font-medium transition-colors ${showAdvanced
                            ? 'border-black text-black bg-gray-50'
                            : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}
                    >
                        {showAdvanced ? "- 고급 설정 접기" : "+ 고급 설정"}
                    </button>

                    {/* Image Count Display (Info only) */}
                    <div className="text-right text-xs text-gray-400 hidden sm:block">
                        비용: {imageCount * 2} 크레딧
                    </div>
                </div>

                {/* Advanced Panel */}
                {showAdvanced && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Negative Prompt */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">제외할 요소 (Negative Prompt)</label>
                                <input
                                    type="text"
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="예: 저화질, 글자, 못생긴, 손가락 기형"
                                    className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-black focus:outline-none"
                                />
                            </div>

                            {/* Image Count */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">생성 개수 (장)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setImageCount(num)}
                                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${imageCount === num
                                                ? 'bg-black text-white shadow-md'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Generated Image Result (Immediately below interface) */}
            {(generatedImages.length > 0 || analysis || (errorLogs && errorLogs.length > 0)) && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">생성된 이미지</h3>

                    {/* Image Grid */}
                    {generatedImages.length > 0 ? (
                        <div className={`grid gap-4 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {generatedImages.map((imgUrl, idx) => (
                                <div key={idx} className={`relative w-full overflow-hidden rounded-xl bg-gray-100 ${aspectRatio === "1:1" ? "aspect-square" :
                                    aspectRatio === "16:9" ? "aspect-video" :
                                        "aspect-[9/16]"
                                    }`}>
                                    <img
                                        src={imgUrl}
                                        alt={`Generated Result ${idx + 1}`}
                                        className="h-full w-full object-cover transition-transform hover:scale-105 cursor-pointer"
                                        onClick={() => window.open(imgUrl, '_blank')}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : errorLogs && errorLogs.length > 0 ? (
                        <div className={`relative w-full overflow-hidden rounded-xl bg-red-50 flex flex-col items-center justify-center border-2 border-red-200 p-6 text-center shadow-inner ${aspectRatio === "1:1" ? "aspect-square" :
                            aspectRatio === "16:9" ? "aspect-video" :
                                "aspect-[9/16]"
                            }`}>
                            <div className="mb-2 rounded-full bg-red-100 p-2 text-red-600">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <h4 className="text-base font-bold text-red-800 mb-2">Generation Failed</h4>

                            {/* Error List */}
                            <div className="w-full max-w-lg bg-white/50 rounded-lg p-3 text-left overflow-y-auto max-h-[140px] text-xs border border-red-100">
                                <ul className="space-y-2">
                                    {errorLogs.map((log, index) => (
                                        <li key={index} className="flex gap-2 text-red-700">
                                            <span className="shrink-0">•</span>
                                            <span className="break-all">{log}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
                            <p className="text-gray-500 font-medium">이미지가 생성되지 않았습니다 (텍스트 분석 모드)</p>
                        </div>
                    )}

                    {/* Analysis Text Display */}
                    {(analysis || generatedImage || (errorLogs && errorLogs.length > 0)) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                            {/* Success Info */}
                            <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                                <span className="px-2 py-0.5 rounded-full bg-green-100 border border-green-200">
                                    Used: {analysis?.includes("[Used") ? analysis.match(/\[Used (.*?)\]/)?.[1] : "Gemini AI"}
                                </span>
                            </div>

                            {/* Main Analysis Text */}
                            {analysis && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-1">AI Output</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{analysis}</p>
                                </div>
                            )}


                        </div>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => {
                                // Scroll to top to focus input
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                // Optional: Clear result to encourage new generation
                                // setGeneratedImage(null); 
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            다시 생성
                        </button>
                        <button
                            onClick={async () => {
                                if (!generatedImage) return;
                                try {
                                    // Fetch the image as a blob to ensure it downloads properly (avoiding cross-origin issues if any)
                                    const response = await fetch(generatedImage);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);

                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `face-studio-${Date.now()}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                } catch (e) {
                                    console.error("Download failed:", e);
                                    // Fallback for simple URL open
                                    window.open(generatedImage, '_blank');
                                }
                            }}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            다운로드
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
