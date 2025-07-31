#!/bin/bash

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 PostgreSQL 17.4 설치 스크립트를 시작합니다..."

### 1. Mise 설치
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
$SCRIPT_DIR/scripts/install_mise.sh

### 2. postgres 설치
./scripts/install_postgres_from_mise.sh

### 3. supabase 설치
brew install supabase

### 환경 구축 관련 내용 추가
### TODO: 추후 Docker 이미지로 만들 것