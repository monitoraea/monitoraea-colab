-- TODO: conferir os ID das ferrametnas

update dorothy_communities 
set descriptor_json = descriptor_json || '{ "tools": [{"id": 18}, {"id": 4}, {"id": 1}] }'
where alias = 'comissao'