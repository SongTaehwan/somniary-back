// 유니버셜 링크를 user-agent에 따라 안전하게 웹 폴백으로 리다이렉트합니다.
// - iOS: 앱이 설치되어 있고 사파리에서 탭한 경우, OS가 네트워크 요청 전에 앱을 열기 때문에 이 함수는 호출되지 않습니다.
//        앱 미설치 또는 인앱 브라우저에서는 서버까지 도달하므로 동일한 경로의 웹 페이지로 폴백시킵니다.
// - 데스크톱/그 외: 동일한 경로의 웹 페이지로 리다이렉트합니다.

import { UAParser } from 'ua-parser-js';

function normalizePath(inputPath: string | null): string {
  if (!inputPath) return '/';
  // 쿼리에서 들어온 path는 "/ul/" 이후의 경로이므로, 선행 슬래시만 갖도록 정규화
  const trimmed = inputPath.replace(/^\/+/, '');
  return `/${trimmed}`;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const osName = (parser.getOS().name || '').toLowerCase();

  const pathParam = url.searchParams.get('path');
  const fallbackBase = url.searchParams.get('fallback'); // 절대 URL 허용. 미지정 시 동일 도메인 사용

  const origin = url.origin;
  const normalizedPath = normalizePath(pathParam);
  
  const fallbackUrl = (() => {
    try {
      // fallback이 절대 URL이면 그 기준으로, 아니면 동일 오리진 기준으로 경로 구성
      const base = fallbackBase ? new URL(fallbackBase).toString() : origin;
      return new URL(normalizedPath, base).toString();
    } catch {
      return new URL(normalizedPath, origin).toString();
    }
  })();

  // iOS는 앱 설치 시 OS가 선점하여 여기까지 오지 않음. 서버는 항상 안전한 웹 폴백으로 리다이렉트만 수행.
  // 요구사항: 앱 미실행/웹/데스크톱 시 동일한 경로의 웹 페이지로 이동
  const isIOS = osName.includes('ios');
  const status = isIOS ? 302 : 302;

  return new Response(null, {
    status,
    headers: {
      Location: fallbackUrl,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
