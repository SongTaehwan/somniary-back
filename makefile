# DB 로컬 실행
run_db_only:
	supabase db start

# Supabase 서비스 실행
run:
	supabase start -x storage-api imgproxy

# Supabase 서비스 중지
stop:
	supabase stop

# Postgres
connect_db:
ifeq ($(strip $(OPTION)),)
	@echo "✅ No additional options provided."
else
	@echo "📦 Running with args: $(OPTION)"
endif

	psql -h localhost -U postgres -p 54322 $(OPTION)

# 리포트 DB 데이터 가져와 로컬 DB 로 dumping
dump:
	supabase db dump --data-only -f supabase/dump-data.sql && make connect_db OPTION="-f supabase/dump-data.sql"

# 리포트 DB 스키마 타입 생성
get_db_types:
	supabase gen types typescript --project-id pipoeqfnniyoknlkqpfm --schema public > ./supabase/functions/_modules/shared/infra/database.types.ts

get_local_db_types:
	supabase gen types typescript --local --schema public > ./supabase/functions/_modules/shared/infra/database.types.ts

start_functions--inspect:
	supabase functions serve --env-file .env.local --inspect

start_functions:
	supabase functions serve --env-file .env.local
	
scaffold_func:
	./scripts/gen_func.sh $(FUNCTION_NAME)
check_func:
	cd supabase/functions/signup && deno check . && cd ../../..
	cd supabase/functions/signout && deno check . && cd ../../..
	cd supabase/functions/refresh_token && deno check . && cd ../../..
	
	