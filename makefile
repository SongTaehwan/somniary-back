# 함수 로컬 실행
run_api:
	supabase functions serve api --no-verify-jwt

# DB 로컬 실행
run_db_only:
	supabase db start

# Supabase 서비스 실행
run:
	supabase start -x storage-api imgproxy

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
get_db_type:
	supabase gen types typescript --project-id pipoeqfnniyoknlkqpfm --schema public > database.types.ts