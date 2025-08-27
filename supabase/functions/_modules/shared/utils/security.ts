// 민감한 데이터 보안 처리 유틸리티

/**
 * 토큰 문자열을 마스킹하여 로깅 시 안전하게 표시
 */
export function maskToken(token: string): string {
  if (!token || token.length < 8) {
    return "***";
  }

  // JWT 토큰의 경우 점(.)으로 구분된 구조 고려
  const parts = token.split(".");

  if (parts.length === 3) {
    // JWT 형식: header.payload.signature
    return `${parts[0].slice(0, 4)}...${parts[2].slice(-4)}`;
  }

  // 일반 토큰: 앞 4자리와 뒤 4자리만 표시
  return `${token.slice(0, 4)}${"*".repeat(token.length - 8)}${token.slice(
    -4
  )}`;
}

/**
 * 민감한 객체 데이터를 마스킹하여 로깅용으로 변환
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: (keyof T)[] = [
    "access_token",
    "refresh_token",
    "token",
    "secret",
    "password",
  ]
): T {
  const masked = {
    ...data,
  };

  for (const field of sensitiveFields) {
    if (masked[field] && typeof masked[field] === "string") {
      masked[field] = maskToken(masked[field] as string) as T[keyof T];
    }
  }

  return masked;
}

/**
 * 보안 컨텍스트를 위한 래퍼 클래스
 * 토큰을 안전하게 처리하고 자동으로 정리
 */
export class SecureTokenHolder {
  private _token: string;
  private _disposed = false;

  constructor(token: string) {
    this._token = token;
  }

  // 원본 토큰 반환
  get token(): string {
    if (this._disposed) {
      throw new Error("Token has been disposed");
    }

    return this._token;
  }

  // 마스킹된 토큰 반환
  get masked(): string {
    return maskToken(this._token);
  }

  // 명시적으로 토큰 메모리 정리
  dispose(): void {
    if (!this._disposed) {
      this._token = "\0".repeat(this._token.length);
      this._disposed = true;
    }
  }

  // JSON 직렬화 시 마스킹된 값 반환
  toJSON(): { token: string } {
    return {
      token: this.masked,
    };
  }
}

/**
 * 보안 토큰 객체 생성 헬퍼
 */
export function createSecureTokens(tokens: {
  access_token: string;
  refresh_token: string;
}) {
  return {
    access_token: new SecureTokenHolder(tokens.access_token),
    refresh_token: new SecureTokenHolder(tokens.refresh_token),

    // 정리 메서드
    dispose() {
      this.access_token.dispose();
      this.refresh_token.dispose();
    },

    // 일반 객체로 변환 (실제 사용 시)
    toPlainTokens() {
      return {
        access_token: this.access_token.token,
        refresh_token: this.refresh_token.token,
      };
    },
  };
}
