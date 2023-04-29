## ENDPOINT 1

### Query

```
WITH cte AS (
  SELECT bp.flight_id, bp.seat_no, b.book_date, DENSE_RANK() OVER (PARTITION BY bp.flight_id ORDER BY b.book_date) AS rank
  FROM boarding_passes bp
  JOIN tickets t ON bp.ticket_no = t.ticket_no
  JOIN bookings b ON t.book_ref = b.book_ref
  WHERE bp.flight_id IN (
    SELECT flight_id FROM flights WHERE aircraft_code = '${ac}'
  )
)
SELECT seat_no, COUNT(*) AS cnt
FROM cte
WHERE rank = ${sc}
GROUP BY seat_no
ORDER BY cnt DESC
LIMIT 1
```

### Postup

#### 1. krok 
- zistím si flight_id podľa aircraft_code - všetky čísla letov ktoré daná linka obslúžila

```
SELECT flight_id
FROM flights f
WHERE aircraft_code='SU9'
```

#### 2. krok 
- vyberiem všetky seat_no (čísla sedadiel), ticket_no (čísla lístkov na základe ktorých to budem ďalej spájať)

```
SELECT seat_no, bp.ticket_no
FROM boarding_passes bp
```

#### 3. krok 
- spojím tieto dve tabuľky pomocou flight_id a zoradím ich podľa flight_id

```
SELECT bp.flight_id, seat_no, bp.ticket_no
FROM boarding_passes bp
JOIN (
    SELECT flight_id
    FROM flights f
    WHERE aircraft_code='SU9'
) f on f.flight_id=bp.flight_id
GROUP BY bp.flight_id, seat_no, ticket_no
ORDER BY bp.flight_id
```

#### 4. krok 
- vyberiem si z tabuľky tickets book_ref a

```
SELECT t.book_ref
FROM tickets t
```

#### 5. krok 
- spojím tabuľky z kroku 3 a 4 na základe ticket_no, pričom vyberám book_ref, flight_id, ticket_no a seat_no
- zoradím si to podľa id letov

```
SELECT t.book_ref, sq.flight_id, sq.seat_no, t.ticket_no
FROM tickets t
JOIN(
    SELECT bp.flight_id, seat_no, bp.ticket_no
    FROM boarding_passes bp
    JOIN (
        SELECT flight_id
        FROM flights f
        WHERE aircraft_code='SU9'
    ) f on f.flight_id=bp.flight_id
    GROUP BY bp.flight_id, seat_no, ticket_no
    ORDER BY bp.flight_id
) sq on sq.ticket_no=t.ticket_no
ORDER BY flight_id
```

#### 6. krok 
- vyberiem z tabuľky bookings hodnotu book_date

```
SELECT book_date
FROM bookings
```

#### 7. krok 
- spojím tabuľky z krokov 5 a 6 na základe book_ref, pričom vyberiem flight_id, seat_no, book_date a spravím nad nimi rank operáciu, kde jednotlivé časti rozdelené podľa flight_id zoradím podľa dátumu
- zoradím si to podľa flight_id, sekundárne podľa dátumu (book_date)

```
SELECT sq.flight_id, sq.seat_no, b.book_date, DENSE_RANK() OVER (PARTITION BY sq.flight_id ORDER BY b.book_date) as rank
FROM bookings b
JOIN(
    SELECT t.book_ref, sq.flight_id, sq.seat_no, t.ticket_no
    FROM tickets t
    JOIN(
        SELECT bp.flight_id, seat_no, bp.ticket_no
        FROM boarding_passes bp
        JOIN (
            SELECT flight_id
            FROM flights f
            WHERE aircraft_code='SU9'
        ) f on f.flight_id=bp.flight_id
        GROUP BY bp.flight_id, seat_no, ticket_no
        ORDER BY bp.flight_id
    ) sq on sq.ticket_no=t.ticket_no
    ORDER BY flight_id
) sq on sq.book_ref = b.book_ref
```

#### 8. krok 
- z tabuľky z kroku 7 spočítam výskyty jednotlivých sedadiel na danej pozícii (podmienka where) a zoradím ich od najväčšieho po najmenšie, vyberiem len prvé (limit 1)

```
SELECT main.seat_no, COUNT(main.seat_no) as cnt
FROM(
    SELECT sq.flight_id, sq.seat_no, b.book_date, DENSE_RANK() OVER (PARTITION BY sq.flight_id ORDER BY b.book_date) as rank
    FROM bookings b
    JOIN(
        SELECT t.book_ref, sq.flight_id, sq.seat_no, t.ticket_no
        FROM tickets t
        JOIN(
            SELECT bp.flight_id, seat_no, bp.ticket_no
            FROM boarding_passes bp
            JOIN (
                SELECT flight_id
                FROM flights f
                WHERE aircraft_code='SU9'
            ) f on f.flight_id=bp.flight_id
            GROUP BY bp.flight_id, seat_no, ticket_no
            ORDER BY bp.flight_id
        ) sq on sq.ticket_no=t.ticket_no
        ORDER BY flight_id
    ) sq on sq.book_ref = b.book_ref
    ORDER BY flight_id, rank
) main
WHERE main.rank = 2
GROUP BY seat_no
ORDER BY cnt DESC
LIMIT 1
```

#### 9. krok 
- zjednodušovanie
- pomocou alias a "where in" prepíšem vyššie uvedený kód - znížil som runtime z 11+ sec na tesne pod 5 sec

```
WITH cte AS (
  SELECT bp.flight_id, bp.seat_no, b.book_date, DENSE_RANK() OVER (PARTITION BY bp.flight_id ORDER BY b.book_date) AS rank
  FROM boarding_passes bp
  JOIN tickets t ON bp.ticket_no = t.ticket_no
  JOIN bookings b ON t.book_ref = b.book_ref
  WHERE bp.flight_id IN (
    SELECT flight_id FROM flights WHERE aircraft_code = '${ac}'
  )
)
SELECT seat_no, COUNT(*) AS cnt
FROM cte
WHERE rank = ${sc}
GROUP BY seat_no
ORDER BY cnt DESC
LIMIT 1
```

### HTTP Request

#### Vstup:

```
http://localhost:8000/v3/aircrafts/SU9/seats/2
```

#### Výstup:

```
{
  "result": {
    "seat":"19A",
    "count":"679"
  }
}
```

## ENDPOINT 2

### Query

```
SELECT
  tf.*, departure_airport, arrival_airport,
  TO_CHAR(actual_arrival::timestamp-actual_departure::timestamp, 'HH24:MI:SS') AS diff,
  TO_CHAR((SUM(EXTRACT(epoch FROM actual_arrival-actual_departure)) OVER (PARTITION BY passenger_name ORDER BY actual_departure) * interval '1 second'), 'HH24:MI:SS') AS total
FROM flights f
JOIN(
  SELECT t.*, flight_id
  FROM ticket_flights tf
  JOIN(
    SELECT ticket_no, passenger_id, passenger_name
    FROM tickets
    WHERE book_ref = '8D344B'
  ) t ON t.ticket_no = tf.ticket_no
) tf ON tf.flight_id = f.flight_id
ORDER BY passenger_name, actual_departure
```

### Postup

#### 1. krok 
- z tabuľky tickets si vypíšeme ticket_no, passenger_id a passenger_name pre dané book_ref

```
SELECT ticket_no, passenger_id, passenger_name
FROM tickets
WHERE book_ref = '8D344B'
```

#### 2. krok 
- z tabuľky ticket_flights si zistíme jednotlivé flight_id (id letov) pre ktoré boli tieto lístky zakúpené

```
SELECT t.*, flight_id
FROM ticket_flights tf
JOIN(
  SELECT ticket_no, passenger_id, passenger_name
  FROM tickets
  WHERE book_ref = '8D344B'
) t on t.ticket_no = tf.ticket_no
```

#### 3. krok 
- z tabuľky flights si vyberieme departure_airport,arrival airport a spočítame si rozdiel (diff) medzi príletom a odletom, aby sme zistili, koľko času strávil pasažier počas letu vo vzduchu
- zoradíme to podľa mena pasažiera a času odletu

```
SELECT tf.*, departure_airport, TO_CHAR(actual_arrival::timestamp-actual_departure::timestamp, 'HH24:MI:SS') as diff
FROM flights f
JOIN(
 SELECT t.*, flight_id
 FROM ticket_flights tf
 JOIN(
  SELECT ticket_no, passenger_id, passenger_name
  FROM tickets
  WHERE book_ref = '8D344B'
 ) t on t.ticket_no = tf.ticket_no
) tf on tf.flight_id = f.flight_id
order by passenger_name, actual_departure
```

#### 4. krok 
- nad touto tabuľkou spravíme parciálny súčet jednotlivých časov strávených vo vzduchu

```
SELECT
  tf.*, departure_airport, arrival_airport,
  TO_CHAR(actual_arrival::timestamp-actual_departure::timestamp, 'HH24:MI:SS') AS diff,
  TO_CHAR((SUM(EXTRACT(epoch FROM actual_arrival-actual_departure)) OVER (PARTITION BY passenger_name ORDER BY actual_departure) * interval '1 second'), 'HH24:MI:SS') AS total
FROM flights f
JOIN(
  SELECT t.*, flight_id
  FROM ticket_flights tf
  JOIN(
    SELECT ticket_no, passenger_id, passenger_name
    FROM tickets
    WHERE book_ref = '8D344B'
  ) t ON t.ticket_no = tf.ticket_no
) tf ON tf.flight_id = f.flight_id
ORDER BY passenger_name, actual_departure
```

### HTTP Request

#### Vstup:

```
http://localhost:8000/v3/air-time/8D344B

```

#### Výstup:

```
{
  "results": [
    {
      "ticket_no":"0005433589556",
      "passenger_name":"ALEKSANDR KISELEV",
      "flights": [
        {
          "departure_airport":"SVO",
          "arrival_airport":"LED",
          "flight_time":"0:50:00",
          "total_time":"0:50:00"
        },
        {
          "departure_airport":"LED",
          "arrival_airport":"IKT",
          "flight_time":"5:54:00",
          "total_time":"6:44:00"
        },
        {
          "departure_airport":"IKT",
          "arrival_airport":"LED",
          "flight_time":"5:47:00",
          "total_time":"12:31:00"
        },
        {
          "departure_airport":"LED",
          "arrival_airport":"SVO",
          "flight_time":"0:51:00",
          "total_time":"13:22:00"
        }
      ]
    },
    {
      ...
    }
  ]
}
```

## ENDPOINT 3

### Query

```
SELECT seat_no, array_agg(flight_id ORDER BY flight_id) AS sequence, count(*) as count
FROM (
    SELECT f.flight_id, bp.seat_no, ROW_NUMBER() OVER (PARTITION BY bp.seat_no ORDER BY f.flight_id) as row_num
    FROM flights f
    JOIN (
        SELECT seat_no, flight_id
        FROM boarding_passes bp
    ) bp ON bp.flight_id = f.flight_id
WHERE f.flight_no = 'PG0019'
) sub
GROUP BY seat_no, (flight_id - row_num)
ORDER BY count desc
LIMIT 5
```

### Postup

#### 1. krok 
- vyberiem si z tabuľky boarding_passses všetky seat_no, flight_id a príslušné čísla riadkov pre vybranú linku letu
- tabuľku usporiadam podľa seat_no a flight_id a zoradím podľa seat_no

```
SELECT f.flight_id, bp.seat_no
FROM flights f
JOIN(
 SELECT seat_no, flight_id
 FROM boarding_passes
) bp on bp.flight_id = f.flight_id
WHERE flight_no = 'PG0019'
group by seat_no, f.flight_id
order by seat_no
```

#### 2. krok 
- z tabuľky z kroku 1 spravím subquery, vytiahnem seat_no, flight_id usporiadam do poľa a spočítam hodnoty
- následne celé zoradím podľa počtu zostupne
- (flight-id - row_num) spôsobí, že sa zgrupia tie, ktoré idú po sebe... napr. id 100,101,102 majú row_num 1,2,3 -> čiže 100-1 == 101-2 == 100-3

```
SELECT seat_no, array_agg(flight_id ORDER BY flight_id) AS sequence, count(*) as count
FROM (
    SELECT f.flight_id, bp.seat_no, ROW_NUMBER() OVER (PARTITION BY bp.seat_no ORDER BY f.flight_id) as row_num
    FROM flights f
    JOIN (
        SELECT seat_no, flight_id
        FROM boarding_passes bp
    ) bp ON bp.flight_id = f.flight_id
WHERE f.flight_no = 'PG0019'
) sub
GROUP BY seat_no, (flight_id - row_num)
ORDER BY count desc
LIMIT 5
```

### HTTP Request

#### Vstup:

```
http://localhost:8000/v3/airlines/PG0019/top_seats?limit=5
```

#### Výstup:

```
{
  "results": [
    {
      "seat":"3C",
      "flights_count":23,
      "flights": [
        13204,
        13205,
        13206,
        13207,
        13208,
        13209,
        13210,
        13211,
        13212,
        13213,
        13214,
        13215,
        13216,
        13217,
        13218,
        13219,
        13220,
        13221,
        13222,
        13223,
        13224,
        13225,
        13226
      ]
    },
    {
      ...
    },
    ...
  ]
}
```

## ENDPOINT 4

### Query

```
SELECT ROUND(total_money,0) as money, year_month, day_of_month
FROM (
  SELECT SUM(amount) as total_money,
    TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') AS year_month,
    EXTRACT(DAY FROM actual_departure) AS day_of_month,
    RANK() OVER (PARTITION BY TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') ORDER BY SUM(amount) DESC) AS rank
  FROM ticket_flights tf
  JOIN(
      SELECT actual_departure, flight_id
      FROM flights
      WHERE aircraft_code = '773'
  ) f on f.flight_id = tf.flight_id
  WHERE actual_departure IS NOT NULL
  GROUP BY year_month, day_of_month
) subquery
WHERE rank = 1
ORDER BY money DESC
```

### Postup

#### 1. krok 
- z tabuľky flights si vypíšem všetky actual_departure a flight_id (pre budúce spájanie tabuliek), kde aircraft_code zodpovedá zadanému typu lietadla

```
SELECT actual_departure
FROM flights
WHERE aircraft_code = '773'
```

#### 2. krok 
- pomocou flight_id spojím tabuľku z kroku jedna s tabuľkou ticket_flights, pričom vypisujem parametre total_money, čo predstavuje sumu za letenky pre daný deň v mesiaci
- ďalej vytiahnem z actual_departure dátum v podobe year-month a day a zoradím sumy podľa týchto hodnôt
- následne zoradím túto tabuľku od najväčšej sumy po najmenšiu a priradím im číslo (rank) pre každý deň v mesiaci, podľa danej celkovej sumy
- zároveň overíme, že lietadlo naozaj odletelo

```
SELECT SUM(amount) as total_money,
  TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') AS year_month,
  EXTRACT(DAY FROM actual_departure) AS day_of_month,
  RANK() OVER (PARTITION BY TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') ORDER BY SUM(amount) DESC) AS rank
FROM ticket_flights tf
JOIN(
  SELECT actual_departure, flight_id
  FROM flights
  WHERE aircraft_code = '773'
) f on f.flight_id = tf.flight_id
WHERE actual_departure IS NOT NULL
GROUP BY year_month, day_of_month
```

#### 3. krok 
- jednotlivé sumy zaokrúhlim a pre každý mesiac vyberiem len najväčšiu z nich (WHERE rank=1), následne zoradím od najväčšej po najmenšiu

```
SELECT ROUND(total_money,0) as money, year_month, day_of_month
FROM (
  SELECT SUM(amount) as total_money,
    TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') AS year_month,
    EXTRACT(DAY FROM actual_departure) AS day_of_month,
    RANK() OVER (PARTITION BY TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') ORDER BY SUM(amount) DESC) AS rank
  FROM ticket_flights tf
  JOIN(
      SELECT actual_departure, flight_id
      FROM flights
      WHERE aircraft_code = '773'
  ) f on f.flight_id = tf.flight_id
  WHERE actual_departure IS NOT NULL
  GROUP BY year_month, day_of_month
) subquery
WHERE rank = 1
ORDER BY money DESC
```

### HTTP Request

#### Vstup:

```
http://localhost:8000/v3/aircrafts/773/top-incomes
```

#### Výstup:

```
{
  "results": [
    {
      "total_amount":77115500,
      "month":"2016-9",
      "day":"23"
    },
    {
      ...
    },
    ...
  ]
}
```
