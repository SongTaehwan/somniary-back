#!/bin/bash

# 첫 번째 인자가 있으면 그걸 입력으로, 없으면 프롬프트로 입력
if [ -n "$1" ]; then
  input="$*"
else
  read -p "문자열 입력: " input
fi

# 모두 소문자로 바꾸고 단어 단위 분리
words=$(echo "$input" | tr '[:upper:]' '[:lower:]')

# 모든 단어의 첫 글자 대문자 + 나머지 소문자
pascal=$(echo $words | awk '{
    out=""
    for (i=1; i<=NF; i++) {
        $i=toupper(substr($i,1,1)) substr($i,2)
        out=out $i
    }
    
    print out
}')

echo "$pascal"