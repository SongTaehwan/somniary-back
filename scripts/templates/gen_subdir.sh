#!/bin/bash

# 첫 번째 인자가 있으면 그걸 입력으로, 없으면 프롬프트로 입력
if [ -n "$1" ]; then
  name="$*"
else
  read -p "생성할 함수명 입력하세요: " name
fi

CURRENT_DIR=$(pwd)

mkdir -p $CURRENT_DIR/supabase/functions/$name/{state,steps,usecases,validators,adapters}
mkdir -p $CURRENT_DIR/supabase/functions/$name/state/selectors
mkdir -p $CURRENT_DIR/supabase/functions/$name/steps/{rules,services,effects}

echo "🔨 디렉토리 생성 완료"
