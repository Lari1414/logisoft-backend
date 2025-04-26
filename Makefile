run:
	npm run build
	npm run start

db:
	npx prisma migrate dev --name auto
	npx prisma generate
	npx prisma studio
