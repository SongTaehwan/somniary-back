create policy "Enable read access for all users"
on "public"."profiles"
as permissive
for select
to public
using (true);



