# FE
Node v16.13.0


## Test server
- debian@146.59.3.50
- Explainer Frontend location /home/debian/fe
- Explainer Python script location /home/debian/test/cgi-bin/explain.py

## Startup

Docker for Frontend:
- cd fe
- docker-compose up -d
- docker-compose down

## Development

Install modules:
`yarn install`

Build project:

`yarn build`

Start development version (live reload):

`yarn start`
