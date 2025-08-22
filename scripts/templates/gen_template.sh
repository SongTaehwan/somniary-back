#!/bin/bash

set -e  # 에러 발생 시 스크립트 중단

if [ -n "$1" ]; then
  name="$*"
else
  read -p "생성할 함수명 입력하세요: " name
fi

CURRENT_DIR=$(pwd)
VALIDATOR_DIR=$CURRENT_DIR/supabase/functions/$name/validators
USECASE_DIR=$CURRENT_DIR/supabase/functions/$name/usecases
STATE_DIR=$CURRENT_DIR/supabase/functions/$name/state


PASCAL_FUNC_NAME=$(./scripts/to_pascal.sh $name)

cat <<EOF > $VALIDATOR_DIR/index.ts
import { z } from "npm:zod";

// Shared
import { createValidator } from "@shared/utils/validator.ts";
import { parseInputStep } from "@shared/steps/parser";

const schema = z.object({
  // define schema
});

export type ${PASCAL_FUNC_NAME}Input = z.infer<typeof schema>;

// HTTP 요청 body 검증 함수 정의
export const validateBody = createValidator(schema);
export const validateBodyStep = parseInputStep(validateBody);
EOF

echo "🔨 Validator 생성 완료"



UPPER_FUNC_NAME=$(echo $name | awk '{print toupper($0)}')

cat <<EOF > $STATE_DIR/index.ts
import { RouteState } from "@shared/types/state.types.ts";

export const KEY_${UPPER_FUNC_NAME}_DATA: unique symbol = Symbol("$name");

export type SymbolKey = typeof KEY_${UPPER_FUNC_NAME}_DATA;

// 함수 도메인 상태 타입 정의
export type ${PASCAL_FUNC_NAME}State = {
  // define type for function state
};

// 함수 도메인 별로 공유될 상태를 정의한다.
export interface FunctionState<T, Q = URLSearchParams>
  extends RouteState<T, Q> {
  [KEY_${UPPER_FUNC_NAME}_DATA]?: ${PASCAL_FUNC_NAME}State;
}
EOF

echo "🔨 State 생성 완료"



cat <<EOF > $USECASE_DIR/index.ts
// Shared
import { chain } from "@shared/core/chain.ts";

// Types
import { type Input } from "@shared/types/state.types.ts";

// Validators
import { type ${PASCAL_FUNC_NAME}Input, validateBodyStep } from "@local/validators";

// State
import { type FunctionState } from "@local/state";

export const usecase = chain<
  ${PASCAL_FUNC_NAME}Input,
  FunctionState<${PASCAL_FUNC_NAME}Input>,
  Input<${PASCAL_FUNC_NAME}Input>
>(validateBodyStep);

EOF

echo "🔨 Usecase 생성 완료"


echo "--------------------------------"
echo "🔨 템플릿 파일 생성 완료"
echo "--------------------------------"

# touch -p $USECASE_DIR/index.ts
# touch -p $STATE_DIR/index.ts
# touch -p $STATE_DIR/state.types.ts
# touch -p $STATE_DIR/selectors/index.ts