run_api:
	supabase functions serve api --no-verify-jwt
run_db_only:
	supabase db start
run:
	supabase start

connect_db:
ifeq ($(strip $(OPTION)),)
	@echo "✅ No additional options provided."
else
	@echo "📦 Running with args: $(OPTION)"
endif

	psql -h localhost -U postgres -p 54322 $(OPTION)

dump:
	supabase db dump --data-only -f supabase/dump-data.sql && make connect_db OPTION="-f supabase/dump-data.sql"
