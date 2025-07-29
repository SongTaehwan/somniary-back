#!/bin/bash

if ! command -v brew &> /dev/null; then
  echo "🍺 Homebrew가 설치되어 있지 않습니다. 설치를 시작합니다..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo "✅ Homebrew 설치 완료"
else
  echo "✅ Homebrew가 이미 설치되어 있습니다."
fi
