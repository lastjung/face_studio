export default function Footer() {
    return (
        <footer className="mt-20 border-t border-gray-200 bg-white py-12">
            <div className="container mx-auto flex flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-center">
                {/* Left Side: Company Info */}
                <div className="space-y-2 text-sm text-gray-500">
                    <p className="font-semibold text-gray-900">Face Studio</p>
                    <p>대표: 김딸깍 | 사업자등록번호: 123-45-67890</p>
                    <p>통신판매업신고: 2024-서울강남-00000</p>
                    <p>주소: 서울특별시 강남구 테헤란로 123</p>
                    <p>이메일: contact@facestudio.com</p>
                </div>

                {/* Right Side: Links & Copyright */}
                <div className="flex flex-col items-end gap-4">
                    <div className="flex gap-6 text-sm font-medium text-gray-600">
                        <a href="#" className="hover:text-black hover:underline">이용약관</a>
                        <a href="#" className="hover:text-black hover:underline">개인정보처리방침</a>
                    </div>
                    <p className="text-sm text-gray-400">
                        © 2025 Face Studio. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
