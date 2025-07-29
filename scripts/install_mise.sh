#!/bin/bash

set -e  # 에러 발생 시 스크립트 중단

### 1. Homebrew 설치
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
$SCRIPT_DIR/install_homebrew.sh

### 1. mise 설치 여부 확인
if ! command -v mise &> /dev/null; then
  echo "📦 mise가 설치되어 있지 않습니다. 설치를 시작합니다..."
  brew install mise
  echo "✅ mise 설치 완료"
else
  echo "✅ mise가 이미 설치되어 있습니다."
fi

