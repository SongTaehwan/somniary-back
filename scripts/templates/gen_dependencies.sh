#!/bin/bash

if [ -n "$1" ]; then
  name="$*"
else
  read -p "생성할 함수명 입력하세요: " name
fi

CURRENT_DIR=$(pwd)

cat <<EOF > $CURRENT_DIR/supabase/functions/$name/deno.json
{
  "imports": {
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2.55",
    "@shared/": "../_modules/shared/",
    "@shared/steps/parser": "../_modules/shared/adapters/http/steps/parse_input.step.ts",
    "@auth/": "../_modules/auth/",
    "@local/": "./",
    "@local/validators": "./validators/index.ts",
    "@local/usecases": "./usecases/index.ts",
    "@local/state": "./state/index.ts"
  }
}
EOF
