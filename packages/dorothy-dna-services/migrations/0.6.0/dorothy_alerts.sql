ALTER TABLE public.dorothy_alerts ADD notifications _int4 NULL

update dorothy_alerts 
set notifications = array_append(notifications, "initiatorId")
where true

alter table dorothy_alerts alter column notifications set not null