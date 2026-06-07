import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithGoogle, loginWithKakao, loginAsTestUser, isSupabaseMode } = useAuth();

  return (
    <div className="min-h-screen bg-piano-black flex items-center justify-center px-4">
      <div className="bg-piano-dark border border-piano-accent rounded-2xl p-8 sm:p-12 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎵</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Piano Study Tracker
        </h1>
        <p className="text-gray-500 mb-8">
          피아노 학습을 기록하고 연습하세요
        </p>

        <div className="space-y-3">
          {isSupabaseMode && (
            <>
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 로그인
              </button>

              <button
                onClick={loginWithKakao}
                className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] py-3 rounded-lg font-medium hover:bg-[#FDD835] transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.76 5.01 4.41 6.35l-1.12 4.15c-.1.36.3.65.6.44l4.94-3.26c.37.04.76.07 1.17.07 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
                </svg>
                카카오로 로그인
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-piano-accent" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-piano-dark px-4 text-gray-600 text-sm">또는</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={loginAsTestUser}
            className="w-full bg-piano-accent hover:bg-piano-highlight text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
          >
            테스트 계정으로 시작하기
          </button>

          {!isSupabaseMode && (
            <p className="text-gray-600 text-xs mt-4">
              현재 로컬 모드로 실행 중입니다. Supabase 연동 시 소셜 로그인이 활성화됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
