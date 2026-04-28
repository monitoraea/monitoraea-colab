update relations.relation_options ro 
set name = 'proponência', description = NULL
where id = 1

update relations.relations r 
set to_id = from_id, from_id = to_id, "createdBy" = 'to'
where r.type_id = 1 and r."createdBy" = 'from'