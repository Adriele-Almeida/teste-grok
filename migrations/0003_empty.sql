delete from reviews;
delete from posts;

update studio
set
  client_name = 'Cliente',
  agency_name = '',
  tagline = '',
  month_note = '',
  updated_at = now()
where id = 1;
