#!/bin/bash

set -e

if [ -n "$1" ]; then
  name="$*"
else
  read -p "생성할 함수명 입력하세요: " name
fi

CURRENT_DIR=$(pwd)
PASCAL_FUNC_NAME=$(./scripts/to_pascal.sh $name)

cat <<EOF > $CURRENT_DIR/supabase/functions/$name/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Shared
import { compose } from "@shared/core/compose.ts";
import { methodGuard } from "@shared/adapters/http/middlewares/method_guard.middleware.ts";
import { CONTENT_TYPES } from "@shared/adapters/http/format/constant.ts";

// Validators
import { type ${PASCAL_FUNC_NAME}Body, type ${PASCAL_FUNC_NAME}Query } from "@local/validators";

// State
import { type FunctionState } from "@local/state";

Deno.serve(
  compose<
    ${PASCAL_FUNC_NAME}Body, 
    ${PASCAL_FUNC_NAME}Query, 
    FunctionState<${PASCAL_FUNC_NAME}Body, ${PASCAL_FUNC_NAME}Query>
  >(
    [
      methodGuard(["POST"]),
      // add chain
    ],
    (ctx) => {
      return new Response(JSON.stringify({ message: "hello world!" }), {
        headers: { "Content-Type": CONTENT_TYPES.JSON },
      });
    }
  )
);

EOF
