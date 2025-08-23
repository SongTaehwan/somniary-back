#!/bin/bash

set -e  # 에러 발생 시 스크립트 중단

read -p "생성할 함수명 입력하세요: " name

# 함수 생성
supabase functions new $name

# 의존성 파일 생성
./scripts/templates/gen_dependencies.sh $name
echo "🔨 의존성 설정 완료"

# 하위 디렉토리 구조 생성
./scripts/templates/gen_subdir.sh $name

# 템플릿 파일 생성
./scripts/templates/gen_template.sh $name
echo "🔨 템플릿 파일 생성 완료"

# 핸들러 생성
./scripts/templates/gen_handler.sh $name
echo "🔨 Entry Point 생성 완료"

echo "--------------------------------"
echo "✅ 함수 생성 완료"
echo "--------------------------------"
