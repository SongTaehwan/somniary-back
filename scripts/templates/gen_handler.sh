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
import { HttpResponse } from "@shared/adapters/http/format/response.ts";

// Validators
import { type ${PASCAL_FUNC_NAME}Body, type ${PASCAL_FUNC_NAME}Query } from "@local/validators";

// State
import { type FunctionState } from "@local/state";

// Chains
import { ${PASCAL_FUNC_NAME}Chain } from "@local/usecases";

Deno.serve(
  compose<
    ${PASCAL_FUNC_NAME}Body, 
    ${PASCAL_FUNC_NAME}Query, 
    FunctionState<${PASCAL_FUNC_NAME}Body, ${PASCAL_FUNC_NAME}Query>
  >(
    [
      methodGuard(["POST"]),
      // add chain
      ${PASCAL_FUNC_NAME}Chain.toMiddleware(),
    ],
    (ctx) => {
      return HttpResponse.message(200, { message: "success" });
    }
  )
);

EOF
