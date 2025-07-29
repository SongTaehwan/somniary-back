#!/bin/bash

### 1. mise postgres 플러그인 설치
if ! mise plugins ls | grep -q postgres; then
  echo "📦 mise에 postgres 플러그인을 추가합니다..."
  mise plugins install postgres
else
  echo "✅ postgres 플러그인이 이미 설치되어 있습니다."
fi

### 2. icu4c 설치
if ! brew list icu4c &> /dev/null; then
  echo "📦 icu4c 패키지를 설치합니다..."
  brew install icu4c
else
  echo "✅ icu4c가 이미 설치되어 있습니다."
fi

### 3. postgres 빌드 환경 변수 설정
export PKG_CONFIG_PATH="$(brew --prefix icu4c)/lib/pkgconfig"
export LDFLAGS="-L$(brew --prefix icu4c)/lib"
export CPPFLAGS="-I$(brew --prefix icu4c)/include"

sdk_version=$(xcrun --sdk macosx --show-sdk-version)
required_version="15.4"

echo "🧠 현재 macOS SDK 버전: $sdk_version"

if [[ "$(printf '%s\n' "$sdk_version" "$required_version" | sort -V | head -n1)" = "$required_version" ]]; then
  # 현재 SDK 버전 >= 15.4일 때만 설정
  export MACOSX_DEPLOYMENT_TARGET="$required_version"
  echo "📌 SDK가 $sdk_version 이므로 MACOSX_DEPLOYMENT_TARGET=$required_version 로 설정합니다."
else
  echo "⚠️ 현재 SDK 버전($sdk_version)은 $required_version 미만입니다. MACOSX_DEPLOYMENT_TARGET을 설정하지 않습니다."
  echo "   빌드 시 일부 API가 없어 PostgreSQL 설치에 실패할 수 있습니다."
fi

echo "✅ 빌드 환경 설정 완료:"
echo "🔧 PKG_CONFIG_PATH=$PKG_CONFIG_PATH"
echo "🔧 LDFLAGS=-L$(brew --prefix icu4c)/lib"
echo "🔧 CPPFLAGS=-I$(brew --prefix icu4c)/include"
echo "🔧 MACOSX_DEPLOYMENT_TARGET=$MACOSX_DEPLOYMENT_TARGET"

read -p "🧪 PostgreSQL 17.4를 설치하시겠습니까? (y/n): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  echo "✅ 설치를 계속합니다."
else
  echo "🚫 설치를 취소합니다."
  exit 1
fi

echo "⬇️ PostgreSQL 17.4 설치 중..."
mise install postgres 17.4 --verbose
echo "✅ PostgreSQL 17.4 설치가 완료되었습니다."
