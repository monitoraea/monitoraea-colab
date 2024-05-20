# Passos para instalação
- Clonar o repositorio

## versão Node:
- 14.19
  
## Pré requisitos: 
- `npm install --global lerna@6.6.2`
  
## Variáveis de ambiente
- NODE_ENV=production
- PORT=[PORT]
- DATABASE_URL=postgres://[username]:[password]@[host]:[port]/[database]
- DB_PREFIX=dorothy_
- SECRET=[secret]
- SENDGRID_API_KEY=[sendgrip_api_key]
- CONTACT_EMAIL=[email]
- LOG_SEQUELIZE=0

## Instalação (na raiz)
- lerna bootstrap
- lerna run build

## Rodar (na raiz)
- lerna run start --scope=isa-sppf-backend --stream