## Zadanie

Vrámci nového repozitára je potrebnéimplementovaťAPIpre navrhnutúdatabázuzo zadania 4. Definovanie API sa nachádza vrámci ymlsúborudostupného na https://github.com/FIIT-Databases/api-assignment. Tento súbor je možné otvoriť napr. https://stoplight.io.Vrámci API nie je riešená žiadna autentifikáciapožiadaviek.

Vrámci jednotlivých endpointov je potrebné kontrolovať formát vstupovpodľa definovania v APIavprípade zistenia nesprávneho formátuje potrebné vrátiťodpoveď sHTTP response code400.

Vrámci implementácie je potrebné uskutočniť automatické migrácie tj. vprípade,že neexistuještruktúra(relačná schéma)Vašej databázyvrámci servera, tak je vytvorená. Treba kontrolovať pri tom ako sa spúšťaVáš aplikačný server. Pri každom odovzdaní do testera sa Vám vytváranová databázana serveri.
Spustenie tejto migrácie jenevyhnutnépre možnosti overenia avyhodnoteniafunkčnosti Vášho riešenia. Vprípade,že Vaše riešenie nedokáže uskutočniť túto začiatočnú migráciu, tak je Vaše riešenie považované za neakceptované.

Pre overenie funkčnostiVášhoimplementovaného API je tiežnevyhnutné,aby Vám fungovali endpointy typu POST aGET.Pre možnosť otestovania zadania je možné použiť https://tester-dbs.fiit.stuba.sk. Vprípade metódy POST sa nachádza vrámcipopisu aj ID záznamu. Toto ID záznamu savnormálnych prípadoch negeneruje na strane klienta, ale na strane servera. Vrámci zadania je ho potrebné generovať na strane klientakvôlimožnostiam testovania správnosti Vášho API. Vpraxi je ho nutnégenerovať na strane servera.

Vrámci zadania 5 je možné počas implementácie používaťaj ORM.

Okrem implementovanie samotnéhoAPIje potrebné vyhotoviť dokumentáciu kVášmu riešeniu, ktorébude obsahovať:

- použité SQL dopyty pre jednotlivé endpointy sich popisom.
- zmeny vnávrhu DB oproti zadaniu 4.

Dokumentáciamôže byť realizovanáako PDFalebo markdowndokumentáciastým, žesa bude nachádzať vAIS odovzdaní aaj vsamotnom github repozitári.

## Zmeny oproti návrhu

Nakoľko piate zadanie implementuje hneď niekoľko vopred definovaných tabuliek, ktoré je nutné implementovať, a ktoré narúšajú štruktúru tabuliek môjho štvrtého zadania, rozhodol som sa implementovať iba tie, ku ktorým boli vytvorené requesty v .yaml súbore.

#### Zoznam tabuliek zo štvrtého zadania

- Authors
- Categories
- Publication_Authors
- Publication_Categories
- Publications
- Prints
- Borrowings
- Borrowing_Statuses
- Wishes
- Reservations
- Ratings
- Customers
- Notices
- Fines

#### Zoznam nových - implementovaných tabuliek

- Authors
- Cards
- Categories
- Customers
- Instances
- Publications
- Rentals
- Reservations
- Publication_Authors
- Publication_Categories

#### Zmeny

##### Tabuľky, ktoré boli odstránené

- Borrowing_Statuses
- Wishes
- Ratings
- Notices
- Fines

##### Tabuľky ktoré boli pridané

- Cards

#### Zmeny v ponechaných tabuľkách

###### Tabuľka Customers

- do tabuľky bola pridaná hodnota "surname"

  **dôvod:** moja pôvodná tabuľka ukladala meno aj priezvisko spolu ako string do jedného stĺpca

- do tabuľky bola pridaná hodnota "birth_date"

  **dôvod:** moja pôvodná tabuľka neuvažovala o ukladaní informácie o dátume narodenia, nakoľko sa to dá vyčítať z rodného čísla, ktoré sa do tabuľky ukľadá

- z tabuľky bola odstránená hodnota "parent_id"

  **dôvod:** zadanie vôbec nad touto informáciou neuvažuje a preto som to nepovažoval za potrebné

###### Tabuľka Authors

- do tabuľky bola pridaná hodnota "surname"

  **dôvod:** tak ako pri tabuľke zákazníkov som uvažoval ukladanie mena a priezviska spolu do jednej kolónky

###### Tabuľka Prints

- tabuľke bol zmenený názov na Instances
- do tabuľky bola pridaná hodnota "year"

  **dôvod:** pri vytváraní návrhu som o tejto položke neuvažoval

- do tabuľky bola pridaná hodnota "publisher"

  **dôvod:** pri vytváraní tabuľky som o tejto hodnote neuvažoval

- do tabuľky bola pridaná hodnota type a odstránená hodnota "serial_number"

  **dôvod:** pri návrhu som uvažoval identifikovať druh inštancie pomocou sériového čísla

###### Tabuľlka Borrowings

- tabuľke bol zmenený názov na Rentals
- do tabuľky bola pridaná hodnota "publication_id" a odstránená hodnota "print_id" (respektíve "instance_id")

  **dôvod:** pri návrhu som uvažoval, že zákazník si bude vypožičiavať konkrétny výtlačok, čo je v podstate zabezpečené aj v tomto prípade, avšak riešené iným spôsobom

- do tabuľky bola pridaná hodnota "duration"

  **dôvod:** pri návrhu som neuvažoval, že by sa daná informácia riešila na strane databázy

- do tabuľky bola pridaná hodnota "status"

  **dôvod:** pri návrhu som uvažoval nad pomocnou tabuľkou, ktorá by zabezpečovala uchovávanie informácie o stave výpožičky

#### Tabuľky, ktoré zostali úplne zachované:

- Categories
- Publications
- Reservations
- Publication_Categories
- Publication_Authors

## Implementácia

Na vypracovanie zadania som použil ORM model _sequelize_ v jazyku JavaScript.

Pre lokálne spustenie odovzdaného kódu je potrebné zadať do terminálu nasledujúce inštrukcie v koreňovom priečinku:

```
docker-compose up -d
```

```
npm install
```

```
npx sequelize db:migrate:undo:all
```

```
npx sequelize db:migrate
```

```
node index.js
```

## Príklady Queries

Vzhľadom na to, že v .yaml súbore, ktorý bol priložený k zadaniu sa nachádza 29 endpointov, rozhodol som sa popísať pre každý typ requestu len jednu query pre jednoduchší model a jednu pre zložitejší (**post**,**get**,**patch**,**delete**)

### Authors

Pre jednoduchšiu ukážku volaní HTTP requestov som si zvolil tabuľku Authors.

#### Post Request

##### Telo requestu

```
{
  "id": "7f3c3d0a-8b07-45b9-9d18-4074647d37c8",
  "name": "Ernest",
  "surname": "Hemingway"
}
```

##### Query pomocou ORM

```
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE "Author"."id" = '7f3c3d0a-8b07-45b9-9d18-4074647d37c8';
Executing (default): INSERT INTO "Authors" ("id","name","surname","createdAt","updatedAt") VALUES ($1,$2,$3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING "id","name","surname","createdAt","updatedAt";
```

##### Odpoveď zo serveru

**Status 201 - OK**

```
{
  "id": "7f3c3d0a-8b07-45b9-9d18-4074647d37c8",
  "name": "Ernest",
  "surname": "Hemingway",
  "created_at": "2023-05-07T18:08:13.615Z",
  "updated_at": "2023-05-07T18:08:13.615Z"
}
```

#### Patch Request

##### UUID zadané prostredníctvom URL

**7f3c3d0a-8b07-45b9-9d18-4074647d37c8**

##### Telo requestu

```
{
  "name": "Šimon",
  "surname": "Valíček"
}
```

##### Query

```
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE "Author"."id" = '7f3c3d0a-8b07-45b9-9d18-4074647d37c8';
Executing (default): UPDATE "Authors" SET "name"=$1,"surname"=$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id" = $3
```

##### Odpoveď zo serveru

**Status 200 - OK**

```
{
  "id": "7f3c3d0a-8b07-45b9-9d18-4074647d37c8",
  "name": "Šimon",
  "surname": "Valíček",
  "created_at": "2023-05-07T18:08:13.615Z",
  "updated_at": "2023-05-07T18:15:34.126Z"
}
```

#### Get Request

##### UUID zadané prostredníctvom URL

**7f3c3d0a-8b07-45b9-9d18-4074647d37c8**

##### Query

```
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE "Author"."id" = '7f3c3d0a-8b07-45b9-9d18-4074647d37c8';
```

##### Odpoveď zo serveru

**Status 200 - OK**

```
{
  "id": "7f3c3d0a-8b07-45b9-9d18-4074647d37c8",
  "name": "Šimon",
  "surname": "Valíček",
  "created_at": "2023-05-07T18:08:13.615Z",
  "updated_at": "2023-05-07T18:15:34.126Z"
}
```

#### Delete Request

##### UUID zadané prostredníctvom URL

**7f3c3d0a-8b07-45b9-9d18-4074647d37c8**

##### Query

```
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE "Author"."id" = '7f3c3d0a-8b07-45b9-9d18-4074647d37c8';
Executing (default): DELETE FROM "Authors" WHERE "id" = '7f3c3d0a-8b07-45b9-9d18-4074647d37c8'
```

- Odpoveď zo serveru

  **Status 204 - No Content**

---

### Publications

Pre zložitejšiu ukážku HTTP volaní som si zvolil tabuľku Publications, nakoľko publikácia obsahuje informácie o prislúchajúcich autoroch aj kategóriách a využíva až dve pomocné tabuľky - **Publication_Authors**, **Publication_Categories**. V konečnom dôsledku teda operuje až nad piatimi tabuľkami pri každom volaní.

Predpokladá sa, že všetky endpointy prebehnú správne - v tabuľkách existujú prislúchajúci autori aj kategórie.

#### Post Request

##### Telo requestu

```
{
  "id": "07d6ee43-d6d2-46b8-8b44-1d3a813a98ee",
  "title": "Tri oriešky pre popolušku",
  "authors": [
    {
      "name": "Ernest",
      "surname": "Hemingway"
    },
    {
      "name": "Jozef",
      "surname": "Matrioška"
    }
  ],
  "categories": [
    "Thriller",
    "Horror",
    "Fiction"
  ]
}
```

##### Query

```
Executing (default): SELECT "id", "title", "createdAt", "updatedAt" FROM "Categories" AS "Category" WHERE "Category"."title" = 'Thriller' LIMIT 1;
Executing (default): SELECT "id", "title", "createdAt", "updatedAt" FROM "Categories" AS "Category" WHERE "Category"."title" = 'Horror' LIMIT 1;
Executing (default): SELECT "id", "title", "createdAt", "updatedAt" FROM "Categories" AS "Category" WHERE "Category"."title" = 'Fiction' LIMIT 1;
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE "Author"."name" = 'Ernest' AND "Author"."surname" = 'Hemingway' LIMIT 1;
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE "Author"."name" = 'Jozef' AND "Author"."surname" = 'Matrioška' LIMIT 1;
Executing (default): SELECT "id", "title", "createdAt", "updatedAt" FROM "Publications" AS "Publication" WHERE ("Publication"."id" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' OR "Publication"."title" = 'Tri oriešky pre popolušku') LIMIT 1;
Executing (default): INSERT INTO "Publications" ("id","title","createdAt","updatedAt") VALUES ($1,$2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING "id","title","createdAt","updatedAt";
Executing (default): SELECT "createdAt", "updatedAt", "CategoryId", "PublicationId" FROM "PublicationCategories" AS "PublicationCategories" WHERE "PublicationCategories"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "PublicationCategories"."CategoryId" IN ('6e26d6e7-6c2e-4177-86f1-39274c524399', '6e26d6e7-6c2e-4177-86f1-39274c524398', '6e26d6e7-6c2e-4177-86f1-39274c524397');
Executing (default): INSERT INTO "PublicationCategories" ("createdAt","updatedAt","CategoryId","PublicationId") VALUES ('2023-05-07 18:32:03.779 +00:00','2023-05-07 18:32:03.779 +00:00','6e26d6e7-6c2e-4177-86f1-39274c524399','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee'),('2023-05-07 18:32:03.779 +00:00','2023-05-07 18:32:03.779 +00:00','6e26d6e7-6c2e-4177-86f1-39274c524398','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee'),('2023-05-07 18:32:03.779 +00:00','2023-05-07 18:32:03.779 +00:00','6e26d6e7-6c2e-4177-86f1-39274c524397','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee') RETURNING "createdAt","updatedAt","CategoryId","PublicationIdExecuting (default): INSERT INTO "PublicationAuthors" ("createdAt","updatedAt","AuthorId","PublicationId") VALUES ('2023-05-07 18:32:03.792 +00:00','2023-05-07 18:32:03.792 +00:00','7f3c3d0a-8b07-45b9-9d18-4074647d37c8','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee'),('2023-05-07 18:32:03.792 +00:00','2023-05-07 18:32:03.792 +00:00','7f3c3d0a-8b07-45b9-9d18-4074647d37c7','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee') RETURNING "createdAt","updatedAt","AuthorId","PublicationId";
```

##### Odpoveď zo serveru

**Status 201 - OK**

```
{
  "id": "07d6ee43-d6d2-46b8-8b44-1d3a813a98ee",
  "title": "Tri oriešky pre popolušku",
  "authors": [
    {
      "name": "Ernest",
      "surname": "Hemingway"
    },
    {
      "name": "Jozef",
      "surname": "Matrioška"
    }
  ],
  "categories": [
    "Thriller",
    "Horror",
    "Fiction"
  ],
  "created_at": "2023-05-07T18:32:03.772Z",
  "updated_at": "2023-05-07T18:32:03.772Z"
}
```

#### Patch Request

##### UUID zadané prostredníctvom URL

**07d6ee43-d6d2-46b8-8b44-1d3a813a98ee**

##### Telo requestu

```
{
  "title": "Ako sa nezblázniť",
  "authors": [
    {
      "name": "Mišo",
      "surname": "Stodola"
    }
  ],
  "categories": [
    "Fantasy",
    "Drama"
  ]
}
```

##### Query

```
Executing (default): SELECT "Publication"."id", "Publication"."title", "Publication"."createdAt", "Publication"."updatedAt", "Categories"."id" AS "Categories.id", "Categories"."title" AS "Categories.title", "Categories"."createdAt" AS "Categories.createdAt", "Categories"."updatedAt" AS "Categories.updatedAt", "Categories->PublicationCategories"."createdAt" AS "Categories.PublicationCategories.createdAt", "Categories->PublicationCategories"."updatedAt" AS "Categories.PublicationCategories.updatedAt", "Categories->PublicationCategories"."CategoryId" AS "Categories.PublicationCategories.CategoryId", "Categories->PublicationCategories"."PublicationId" AS "Categories.PublicationCategories.PublicationId", "Authors"."id" AS "Authors.id", "Authors"."name" AS "Authors.name", "Authors"."surname" AS "Authors.surname", "Authors"."createdAt" AS "Authors.createdAt", "Authors"."updatedAt" AS "Authors.updatedAt", "Authors->PublicationAuthors"."createdAt" AS "Authors.PublicationAuthors.createdAt", "Authors->PublicationAuthors"."updatedAt" AS "Authors.PublicationAuthors.updatedAt", "Authors->PublicationAuthors"."AuthorId" AS "Authors.PublicationAuthors.AuthorId", "Authors->PublicationAuthors"."PublicationId" AS "Authors.PublicationAuthors.PublicationId" FROM "Publications" AS "Publication" LEFT OUTER JOIN ( "PublicationCategories" AS "Categories->PublicationCategories" INNER JOIN "Categories" AS "Categories" ON "Categories"."id" = "Categories->PublicationCategories"."CategoryId") ON "Publication"."id" = "Categories->PublicationCategories"."PublicationId" LEFT OUTER JOIN ( "PublicationAuthors" AS "Authors->PublicationAuthors" INNER JOIN "Authors" AS "Authors" ON "Authors"."id" = "Authors->PublicationAuthors"."AuthorId") ON "Publication"."id" = "Authors->PublicationAuthors"."PublicationId" WHERE "Publication"."id" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
Executing (default): SELECT "id", "name", "surname", "createdAt", "updatedAt" FROM "Authors" AS "Author" WHERE (("Author"."name" = 'Mišo' AND "Author"."surname" = 'Stodola'));
Executing (default): SELECT "id", "title", "createdAt", "updatedAt" FROM "Categories" AS "Category" WHERE "Category"."title" IN ('Fantasy', 'Drama');
Executing (default): SELECT "createdAt", "updatedAt", "AuthorId", "PublicationId" FROM "PublicationAuthors" AS "PublicationAuthors" WHERE "PublicationAuthors"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
Executing (default): DELETE FROM "PublicationAuthors" WHERE "PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "AuthorId" IN ('7f3c3d0a-8b07-45b9-9d18-4074647d37c8', '7f3c3d0a-8b07-45b9-9d18-4074647d37c7')
Executing (default): SELECT "createdAt", "updatedAt", "CategoryId", "PublicationId" FROM "PublicationCategories" AS "PublicationCategories" WHERE "PublicationCategories"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
Executing (default): DELETE FROM "PublicationCategories" WHERE "PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "CategoryId" IN ('6e26d6e7-6c2e-4177-86f1-39274c524399', '6e26d6e7-6c2e-4177-86f1-39274c524398', '6e26d6e7-6c2e-4177-86f1-39274c524397')
Executing (default): SELECT "createdAt", "updatedAt", "AuthorId", "PublicationId" FROM "PublicationAuthors" AS "PublicationAuthors" WHERE "PublicationAuthors"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "PublicationAuthors"."AuthorId" IN ('7f3c3d0a-8b07-45b9-9d18-4074647d37c6');
Executing (default): INSERT INTO "PublicationAuthors" ("createdAt","updatedAt","AuthorId","PublicationId") VALUES ('2023-05-07 18:41:19.299 +00:00','2023-05-07 18:41:19.299 +00:00','7f3c3d0a-8b07-45b9-9d18-4074647d37c6','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee') RETURNING "createdAt","updatedAt","AuthorId","PublicationId";
Executing (default): SELECT "createdAt", "updatedAt", "CategoryId", "PublicationId" FROM "PublicationCategories" AS "PublicationCategories" WHERE "PublicationCategories"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "PublicationCategories"."CategoryId" IN ('6e26d6e7-6c2e-4177-86f1-39274c524385', '6e26d6e7-6c2e-4177-86f1-39274c524375');
Executing (default): INSERT INTO "PublicationCategories" ("createdAt","updatedAt","CategoryId","PublicationId") VALUES ('2023-05-07 18:41:19.307 +00:00','2023-05-07 18:41:19.307 +00:00','6e26d6e7-6c2e-4177-86f1-39274c524385','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee'),('2023-05-07 18:41:19.307 +00:00','2023-05-07 18:41:19.307 +00:00','6e26d6e7-6c2e-4177-86f1-39274c524375','07d6ee43-d6d2-46b8-8b44-1d3a813a98ee') RETURNING "createdAt","updatedAt","CategoryId","PublicationId";
Executing (default): SELECT "Publication"."id", "Publication"."title", "Publication"."createdAt", "Publication"."updatedAt", "Categories"."id" AS "Categories.id", "Categories"."title" AS "Categories.title", "Categories"."createdAt" AS "Categories.createdAt", "Categories"."updatedAt" AS "Categories.updatedAt", "Categories->PublicationCategories"."createdAt" AS "Categories.PublicationCategories.createdAt", "Categories->PublicationCategories"."updatedAt" AS "Categories.PublicationCategories.updatedAt", "Categories->PublicationCategories"."CategoryId" AS "Categories.PublicationCategories.CategoryId", "Categories->PublicationCategories"."PublicationId" AS "Categories.PublicationCategories.PublicationId", "Authors"."id" AS "Authors.id", "Authors"."name" AS "Authors.name", "Authors"."surname" AS "Authors.surname", "Authors"."createdAt" AS "Authors.createdAt", "Authors"."updatedAt" AS "Authors.updatedAt", "Authors->PublicationAuthors"."createdAt" AS "Authors.PublicationAuthors.createdAt", "Authors->PublicationAuthors"."updatedAt" AS "Authors.PublicationAuthors.updatedAt", "Authors->PublicationAuthors"."AuthorId" AS "Authors.PublicationAuthors.AuthorId", "Authors->PublicationAuthors"."PublicationId" AS "Authors.PublicationAuthors.PublicationId" FROM "Publications" AS "Publication" LEFT OUTER JOIN ( "PublicationCategories" AS "Categories->PublicationCategories" INNER JOIN "Categories" AS "Categories" ON "Categories"."id" = "Categories->PublicationCategories"."CategoryId") ON "Publication"."id" = "Categories->PublicationCategories"."PublicationId" LEFT OUTER JOIN ( "PublicationAuthors" AS "Authors->PublicationAuthors" INNER JOIN "Authors" AS "Authors" ON "Authors"."id" = "Authors->PublicationAuthors"."AuthorId") ON "Publication"."id" = "Authors->PublicationAuthors"."PublicationId" WHERE "Publication"."id" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
```

##### Odpoveď zo serveru

**Status 200 - OK**

```
{
  "id": "07d6ee43-d6d2-46b8-8b44-1d3a813a98ee",
  "title": "Tri oriešky pre popolušku",
  "authors": [
    {
      "name": "Mišo",
      "surname": "Stodola"
    }
  ],
  "categories": [
    "Drama",
    "Fantasy"
  ],
  "created_at": "2023-05-07T18:32:03.772Z",
  "updated_at": "2023-05-07T18:32:03.772Z"
}
```

#### Get Request

##### UUID zadané prostredníctvom URL

**07d6ee43-d6d2-46b8-8b44-1d3a813a98ee**

##### Query

```
Executing (default): SELECT "Publication"."id", "Publication"."title", "Publication"."createdAt", "Publication"."updatedAt", "Categories"."id" AS "Categories.id", "Categories"."title" AS "Categories.title", "Categories"."createdAt" AS "Categories.createdAt", "Categories"."updatedAt" AS "Categories.updatedAt", "Categories->PublicationCategories"."createdAt" AS "Categories.PublicationCategories.createdAt", "Categories->PublicationCategories"."updatedAt" AS "Categories.PublicationCategories.updatedAt", "Categories->PublicationCategories"."CategoryId" AS "Categories.PublicationCategories.CategoryId", "Categories->PublicationCategories"."PublicationId" AS "Categories.PublicationCategories.PublicationId", "Authors"."id" AS "Authors.id", "Authors"."name" AS "Authors.name", "Authors"."surname" AS "Authors.surname", "Authors"."createdAt" AS "Authors.createdAt", "Authors"."updatedAt" AS "Authors.updatedAt", "Authors->PublicationAuthors"."createdAt" AS "Authors.PublicationAuthors.createdAt", "Authors->PublicationAuthors"."updatedAt" AS "Authors.PublicationAuthors.updatedAt", "Authors->PublicationAuthors"."AuthorId" AS "Authors.PublicationAuthors.AuthorId", "Authors->PublicationAuthors"."PublicationId" AS "Authors.PublicationAuthors.PublicationId" FROM "Publications" AS "Publication" LEFT OUTER JOIN ( "PublicationCategories" AS "Categories->PublicationCategories" INNER JOIN "Categories" AS "Categories" ON "Categories"."id" = "Categories->PublicationCategories"."CategoryId") ON "Publication"."id" = "Categories->PublicationCategories"."PublicationId" LEFT OUTER JOIN ( "PublicationAuthors" AS "Authors->PublicationAuthors" INNER JOIN "Authors" AS "Authors" ON "Authors"."id" = "Authors->PublicationAuthors"."AuthorId") ON "Publication"."id" = "Authors->PublicationAuthors"."PublicationId" WHERE "Publication"."id" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
```

##### Odpoveď zo serveru

**Status 200 - OK**

```
{
  "id": "07d6ee43-d6d2-46b8-8b44-1d3a813a98ee",
  "title": "Tri oriešky pre popolušku",
  "authors": [
    {
      "name": "Mišo",
      "surname": "Stodola"
    }
  ],
  "categories": [
    "Drama",
    "Fantasy"
  ],
  "created_at": "2023-05-07T18:32:03.772Z",
  "updated_at": "2023-05-07T18:32:03.772Z"
}
```

#### Delete Request

##### UUID zadané prostredníctvom URL

**07d6ee43-d6d2-46b8-8b44-1d3a813a98ee**

##### Query

```
Executing (default): SELECT "Publication"."id", "Publication"."title", "Publication"."createdAt", "Publication"."updatedAt", "Categories"."id" AS "Categories.id", "Categories"."title" AS "Categories.title", "Categories"."createdAt" AS "Categories.createdAt", "Categories"."updatedAt" AS "Categories.updatedAt", "Categories->PublicationCategories"."createdAt" AS "Categories.PublicationCategories.createdAt", "Categories->PublicationCategories"."updatedAt" AS "Categories.PublicationCategories.updatedAt", "Categories->PublicationCategories"."CategoryId" AS "Categories.PublicationCategories.CategoryId", "Categories->PublicationCategories"."PublicationId" AS "Categories.PublicationCategories.PublicationId", "Authors"."id" AS "Authors.id", "Authors"."name" AS "Authors.name", "Authors"."surname" AS "Authors.surname", "Authors"."createdAt" AS "Authors.createdAt", "Authors"."updatedAt" AS "Authors.updatedAt", "Authors->PublicationAuthors"."createdAt" AS "Authors.PublicationAuthors.createdAt", "Authors->PublicationAuthors"."updatedAt" AS "Authors.PublicationAuthors.updatedAt", "Authors->PublicationAuthors"."AuthorId" AS "Authors.PublicationAuthors.AuthorId", "Authors->PublicationAuthors"."PublicationId" AS "Authors.PublicationAuthors.PublicationId" FROM "Publications" AS "Publication" LEFT OUTER JOIN ( "PublicationCategories" AS "Categories->PublicationCategories" INNER JOIN "Categories" AS "Categories" ON "Categories"."id" = "Categories->PublicationCategories"."CategoryId") ON "Publication"."id" = "Categories->PublicationCategories"."PublicationId" LEFT OUTER JOIN ( "PublicationAuthors" AS "Authors->PublicationAuthors" INNER JOIN "Authors" AS "Authors" ON "Authors"."id" = "Authors->PublicationAuthors"."AuthorId") ON "Publication"."id" = "Authors->PublicationAuthors"."PublicationId" WHERE "Publication"."id" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
Executing (default): SELECT "createdAt", "updatedAt", "AuthorId", "PublicationId" FROM "PublicationAuthors" AS "PublicationAuthors" WHERE "PublicationAuthors"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
Executing (default): DELETE FROM "PublicationAuthors" WHERE "PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "AuthorId" IN ('7f3c3d0a-8b07-45b9-9d18-4074647d37c6')
Executing (default): SELECT "createdAt", "updatedAt", "CategoryId", "PublicationId" FROM "PublicationCategories" AS "PublicationCategories" WHERE "PublicationCategories"."PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee';
Executing (default): DELETE FROM "PublicationCategories" WHERE "PublicationId" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee' AND "CategoryId" IN ('6e26d6e7-6c2e-4177-86f1-39274c524385', '6e26d6e7-6c2e-4177-86f1-39274c524375')
Executing (default): DELETE FROM "Publications" WHERE "id" = '07d6ee43-d6d2-46b8-8b44-1d3a813a98ee'
```

##### Odpoveď zo serveru

**Status 204 - No Content**

## Záver

Implementácia zadania bola časovo náročná, avšak podarilo sa mi stihnúť ho spraviť. V testeri mám 7 chýb, ktoré som žiaľ nedokázal opraviť, nakoľko neviem, kde sa nachádzajú. Zadanie celkovo hodnotím negatívne pre problémy spojené s testerom.
