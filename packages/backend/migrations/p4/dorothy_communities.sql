UPDATE public.dorothy_communities
SET id=1, members_only=false, descriptor_url=NULL, descriptor_json='{
  "title": "Secretaria Executiva da Rede",
  "tools": [
    {
      "id": 14,
      "group": "painel"
    },
    {
      "id": 15,
      "group": "painel"
    },
    {
      "id": 12
    },
    {
      "id": 4
    },
    {
      "id": 13
    },
    {
      "id": 1
    }
  ],
  "groups": [
    {
      "id": "painel",
      "icon": "chart",
      "title": "visualizações"
    }
  ],
  "includes": []
}'::jsonb, "createdAt"='2021-06-04 11:57:36.469', "updatedAt"='2021-06-04 11:57:36.469', alias='adm', "type"='adm                 ', config=NULL
WHERE id=1