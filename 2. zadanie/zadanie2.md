## ENDPOINT 1

### Query

```
            SELECT  main.passenger_name, COUNT(main.passenger_name) as count, main.passenger_id, array_agg(main.flight_id)
            FROM(
            SELECT passenger_name, passenger_id, three.flight_id
            FROM bookings.tickets t
            JOIN(
              SELECT tf.ticket_no, two.flight_id
              FROM bookings.ticket_flights tf
              JOIN(
                SELECT flight_id
                FROM bookings.ticket_flights tf
                JOIN (
                  SELECT t.ticket_no
                  FROM bookings.tickets t
                  WHERE passenger_id = '${pasid}'
                ) one on one.ticket_no = tf.ticket_no
              ) two on two.flight_id = tf.flight_id
            ) three on three.ticket_no = t.ticket_no
            order by passenger_name, passenger_id, three.flight_id) main
            WHERE main.passenger_id != '${pasid}'
            GROUP BY main.passenger_name, main.passenger_id
            order by main.count desc, main.passenger_id`
```

### Postup

Pre tento endpoint potrebujem tabuľky tickets a ticket_flights.

1. Spravím si počiatočné query, ktoré mi vytiahne z tabuľky tickets všetky čísla ticketov daného pasažiera, pre ktorého toto query robím.
2. Na základe toho vytiahnem z tabuľky ticket_flights všetky čísla letov, ktorými letel.
3. Následne podľa flight_id letov, ktorými letel vytiahnem z ticket_flights všetky čísla ticketov spojené s danými letmi.
4. Pre každé ticket_no, ktoré som vytiahol pozriem údaje z ticketu (meno a id)
5. V poslednom kroku robím aritmetické operácie nad týmito údajmi, pričom spočítavam koľkokrát sa tam nachádzajú jednotlivé mená spolu s id.

### HTTP Request

```
app.get("/v1/passengers/:passenger_id/companions",async(req,res)=>{
  const pasid = decodeURIComponent(req.params.passenger_id);
  console.log(pasid)
  await pool
    .query(`SELECT  main.passenger_name, COUNT(main.passenger_name) as count, main.passenger_id, array_agg(main.flight_id)
            FROM(
            SELECT passenger_name, passenger_id, three.flight_id
            FROM bookings.tickets t
            JOIN(
              SELECT tf.ticket_no, two.flight_id
              FROM bookings.ticket_flights tf
              JOIN(
                SELECT flight_id
                FROM bookings.ticket_flights tf
                JOIN (
                  SELECT t.ticket_no
                  FROM bookings.tickets t
                  WHERE passenger_id = '${pasid}'
                ) one on one.ticket_no = tf.ticket_no
              ) two on two.flight_id = tf.flight_id
            ) three on three.ticket_no = t.ticket_no
            order by passenger_name, passenger_id, three.flight_id) main
            WHERE main.passenger_id != '${pasid}'
            GROUP BY main.passenger_name, main.passenger_id
            order by main.count desc, main.passenger_id`)
    .then((data)=>{
      const results = data.rows.map(row => ({
        id: row.passenger_id.replace('%20', ' '),
        name: row.passenger_name,
        flights_count: Number(row.count),
        flights: row.array_agg
      }));
      res.json({ results })} )
    .catch((err)=>{res.send(JSON.stringify(err))})
})
```

## ENDPOINT 2

### Query

```
            SELECT boarding_no, seat_no, t.*, f.*
            FROM bookings.boarding_passes bp
            JOIN(
              SELECT passenger_id, passenger_name, b.*, ticket_no
              FROM bookings.tickets t
              JOIN (
                SELECT b.book_ref, book_date
                FROM bookings.bookings b
                WHERE b.book_ref = '${bid}'
              ) b on b.book_ref = t.book_ref
            ) t on bp.ticket_no = t.ticket_no
            JOIN(
              SELECT flight_id, flight_no, aircraft_code, arrival_airport, departure_airport, scheduled_arrival, scheduled_departure
              FROM bookings.flights f
              ) f on bp.flight_id = f.flight_id
            order by t.ticket_no, bp.boarding_no

```

### Postup

Pre tento endpoint potrebujem tabuľky boarding_passes, tickets, bookings a flights

1. Z tabuľky flights si vytiahnem všetky potrebné údaje, nad ktorými budem pracovať - flight_id, flight_no, aurcraft_code, arrival_airport, departure_airport, scheduled_arrival, scheduled_departure
2. Z tabuľky bookings si vytaihnem book_ref a book_date, pričom book_ref sa musí rovnať údaju z http requestu
3. Z tabuľky tickets si vytiahnem passenger_id a passenger_name a spájam to na základe údajov z book_ref
4. Z tabuľky boarding_passes vytiahnem boarding_no, seat_no na základe údajov, ktoré som získal z tabuliek vyššie a spojím ich.
5. V poslednom kroku všetko zoradím podľa čísla ticketov a boarding_no

### HTTP Request

```
app.get("/v1/bookings/:booking_id", async(req,res)=>{
const bid = req.params.booking_id
await pool
.query(`SELECT boarding_no, seat_no, t.*, f.*
            FROM bookings.boarding_passes bp
            JOIN(
              SELECT passenger_id, passenger_name, b.*, ticket_no
              FROM bookings.tickets t
              JOIN (
                SELECT b.book_ref, book_date
                FROM bookings.bookings b
                WHERE b.book_ref = '${bid}'
              ) b on b.book_ref = t.book_ref
            ) t on bp.ticket_no = t.ticket_no
            JOIN(
              SELECT flight_id, flight_no, aircraft_code, arrival_airport, departure_airport, scheduled_arrival, scheduled_departure
              FROM bookings.flights f
              ) f on bp.flight_id = f.flight_id
            order by t.ticket_no, bp.boarding_no`)
.then((data)=>{
const lines= JSON.parse(JSON.stringify(data.rows))
const groupedByBookRef = lines.reduce((acc, curr) => {
const { book_ref, book_date, ticket_no, passenger_id, passenger_name } = curr;
const bp = {
id: ticket_no,
passenger_id,
passenger_name,
boarding_no: curr.boarding_no,
flight_no: curr.flight_no,
seat: curr.seat_no,
aircraft_code: curr.aircraft_code,
arrival_airport: curr.arrival_airport,
departure_airport: curr.departure_airport,
scheduled_arrival: (new Date(curr.scheduled_arrival)).toISOString().replace('Z', '+00:00').replace('.000', ''),
scheduled_departure: (new Date(curr.scheduled_departure)).toISOString().replace('Z', '+00:00').replace('.000', '')

                };
                if (!acc[book_ref]) {
                  acc[book_ref] = {
                    id: book_ref,
                    book_date: (new Date(book_date)).toISOString().replace('Z', '+00:00').replace('.000', ''),
                    boarding_passes: []
                  };
                }
                acc[book_ref].boarding_passes.push(bp);
                return acc;
              }, {});
              const result = Object.values(groupedByBookRef).map(item => ({ result: item }));
              res.send(result[0]);
            })
    .catch((err)=>{res.send(JSON.stringify(err))})

})
```

## ENDPOINT 3

### Query

```
            SELECT delay, flight_no, flight_id
            FROM (
              SELECT EXTRACT(HOUR FROM (actual_departure-scheduled_departure))*60
                    +EXTRACT(MINUTE FROM (actual_departure-scheduled_departure)) as delay,
                    flight_no, f.flight_id
              FROM bookings.flights f
              WHERE (actual_departure-scheduled_departure) IS NOT NULL
            ) subquery
            WHERE delay > ${del}
            ORDER BY delay DESC, flight_id
```

### Postup

1. Pomocou agregatnej funkcie EXTRACT si zistím omeškanie letu spôsobom (actual_departure-scheduled_departure) z tabuľky flights - musím dať pozor aby omeškanie nebolo nulové. Z tej istej tabuľky v rovnakom selecte vytiahnem aj flight_no a flight_id.
2. Všetky údaje, ktoré som si vytiahol v predošlom kroku použijem ako subquery, aby som si mohol z toho celého vytiahnuť alias a použiť ho vo WHERE.
3. Výsledky zoradím zostupne podľa omeškania letu, prípadne sekundárne pomocou id letu

### HTTP Request

```
app.get("/v1/flights/late-departure/:delay", async(req,res)=>{
const del = req.params.delay
await pool
.query(`SELECT delay, flight_no, flight_id
            FROM (
              SELECT EXTRACT(HOUR FROM (actual_departure-scheduled_departure))*60
                    +EXTRACT(MINUTE FROM (actual_departure-scheduled_departure)) as delay,
                    flight_no, f.flight_id
              FROM bookings.flights f
              WHERE (actual_departure-scheduled_departure) IS NOT NULL
            ) subquery
            WHERE delay > ${del}
            ORDER BY delay DESC, flight_id`)
.then((data)=>{
const lines = data.rows.map(row=>({
flight_id: row.flight_id,
flight_no: row.flight_no,
delay: parseInt(row.delay)
}))
res.send({results: lines})})
.catch((err)=>{res.send(JSON.stringify(err))})
})
```

## ENDPOINT 4

### Query

```
            SELECT f.flight_no, SUM(tf.number) as count
            FROM bookings.flights f
            JOIN(
              SELECT COUNT(tf.ticket_no) as number, tf.flight_id
              FROM bookings.ticket_flights tf
              GROUP BY tf.flight_id
            ) tf on tf.flight_id = f.flight_id
            WHERE f.status = 'Arrived'
            GROUP BY f.flight_no
            ORDER BY count desc
            LIMIT $1, [lim]
```

### Postup

Pre toto query budem používať tabuľky flights a ticket_flights

1. Z tabuľky ticket_flights si vytiahnem id letov a spočítam, koľko ticketov je priradených k daným letom.
2. Následne si z tabuľky flights vytiahnem čísla letov, joinem tabuľku získanú vyššie a sčítam tickety podľa toho, ku ktorému číslu letu patria.
3. Nesmiem zabudnúť priradiť podmienku WHERE, že status letu je Arrived, inak by mi to započítalo aj lety, ktoré sú zatiaľ iba naplánované.
4. Všetky získané údaje zoradím podľa počtu ticketov zostupne.
5. Limitujem výsledný počet získaných údajov podľa premennej získanej z http requestu.

### HTTP Request

```
app.get("/v1/top-airlines", async (req, res) => {
const lim = parseInt(req.query.limit)
await pool
.query(`SELECT f.flight_no, SUM(tf.number) as count
            FROM bookings.flights f
            JOIN(
              SELECT COUNT(tf.ticket_no) as number, tf.flight_id
              FROM bookings.ticket_flights tf
              GROUP BY tf.flight_id
            ) tf on tf.flight_id = f.flight_id
            WHERE f.status = 'Arrived'
            GROUP BY f.flight_no
            ORDER BY count desc
            LIMIT $1`, [lim])
.then((data) => {
const results = data.rows.map(row => ({
count: Number(row.count),
flight_no: row.flight_no,
}))
res.json({ results })})
.catch((err) => {
res.send(JSON.stringify(err));
});
});
```

## ENDPOINT 5

### Query

```
            SELECT f.flight_id, f.flight_no, f.scheduled_departure
            FROM bookings.flights f
            WHERE f.status = 'Scheduled' AND f.departure_airport::text = '$      {airport}' AND EXTRACT(ISODOW FROM f.scheduled_departure)= ${day}
            ORDER BY f.scheduled_departure, f.flight_id

```

### Postup

1. Z tabuľky flights si vytiahnem flight_id, flight_no, scheduled_departure
2. Zadám podmienky zo zadania - status='Scheduled', departure_airport=string získaný z http requestu
3. Zoradím podľa času, sekundárne podľa flight_id

### HTTP Request

```
app.get("/v1/departures", async (req, res) => {
const airport = req.query.airport;
const day = req.query.day;
await pool
.query(`SELECT f.flight_id, f.flight_no, f.scheduled_departure
            FROM bookings.flights f
            WHERE f.status = 'Scheduled' AND f.departure_airport::text = '${airport}' AND EXTRACT(ISODOW FROM f.scheduled_departure)= ${day}
            ORDER BY f.scheduled_departure, f.flight_id`)
.then((data) => {
const results = data.rows.map(row => ({
flight_id: row.flight_id,
flight_no: row.flight_no,
scheduled_departure: (new Date(row.scheduled_departure)).toISOString().replace('Z', '+00:00').replace('.000', '')
}))
res.json({ results })})
.catch((err) => {
res.send(JSON.stringify(err));
});
});
```

## ENDPOINT 6

### Query

```
            SELECT DISTINCT f.arrival_airport
            FROM bookings.flights f
            WHERE f.departure_airport::text = '${airp}'

```

### Postup

1. Z tabuľky flights vyberieme arrival_airport, za podmienky, že departure airport sa zhoduje s parametrom v url requeste.

### HTTP Request

```
app.get("/v1/airports/:airport/destinations", async (req,res)=>{
const airp = req.params.airport
await pool
.query(`SELECT DISTINCT f.arrival_airport
            FROM bookings.flights f
            WHERE f.departure_airport::text = '${airp}'`)
.then((data)=>{
const results = data.rows.map(row=>row.arrival_airport)
res.json({results})})
.catch((err)=>{res.send(JSON.stringify(err))})
});
```

## ENDPOINT 7

### Query

```
            SELECT f.flight_id, s.capacity, tf.loaded, ROUND(CAST(tf.loaded AS DECIMAL(7,2)) / s.capacity *100,2) as result
            FROM bookings.flights f
            JOIN(
              SELECT COUNT(seat_no) AS capacity, s.aircraft_code
              FROM bookings.seats s
              GROUP BY s.aircraft_code
              ) s on f.aircraft_code = s.aircraft_code
            JOIN(
                SELECT COUNT(ticket_no) AS loaded, tf.flight_id
                FROM bookings.ticket_flights tf
                GROUP BY tf.flight_id
            ) tf on f.flight_id = tf.flight_id
            WHERE f.flight_no = '${fno}'
```

### Postup

1. Z tabuľky flights vyberieme flight_id a spočítame všetky ticket_no pre jednotlivé flight_id
2. Z tabuľky seats spočítame pre každý aircraf_code počet miest (seats)
3. Z tabuliek, ktoré sme získali v krokoch 1. a 2. vyberieme počet všetkých miest, id letu, počet leteniek (ticket_no) a pomocou agregatnych funkcii vypočítame percentuálnu obsadenosť letu
4. Pridáme podmienku, že číslo letu sa musí zhodovať s číslom letu zadaným v http requeste

### HTTP Request

```
app.get("/v1/airlines/:flight_no/load", async(req,res)=>{
const fno = req.params.flight_no
await pool
.query(`SELECT f.flight_id, s.capacity, tf.loaded, ROUND(CAST(tf.loaded AS DECIMAL(7,2)) / s.capacity *100,2) as result
            FROM bookings.flights f
            JOIN(
              SELECT COUNT(seat_no) AS capacity, s.aircraft_code
              FROM bookings.seats s
              GROUP BY s.aircraft_code
              ) s on f.aircraft_code = s.aircraft_code
             JOIN(
                SELECT COUNT(ticket_no) AS loaded, tf.flight_id
                FROM bookings.ticket_flights tf
                GROUP BY tf.flight_id
                ) tf on f.flight_id = tf.flight_id
              WHERE f.flight_no = '${fno}'`)
.then((data)=>{
const results = data.rows.map(row=>({
id: row.flight_id,
aircraft_capacity: parseInt(row.capacity),
load: parseInt(row.loaded),
percentage_load: parseFloat(row.result)
}))
res.json({results})
})
.catch((err)=>{res.send(JSON.stringify(err))})
})
```

## ENDPOINT 8

### Query

```
            SELECT main.flight_no, main.time, ROUND(main.first, 2) as second
            FROM(
              SELECT sq.flight_no, sq.time,  ROUND(AVG(sq.result),3) as first
              FROM (
              SELECT flight_no, tf.loaded, s.seats, EXTRACT(ISODOW FROM scheduled_departure) as time, ROUND(CAST(tf.loaded AS DECIMAL(7,2)) / s.seats *100,2) as result
              FROM bookings.flights f
              JOIN(
                SELECT COUNT(ticket_no) AS loaded, tf.flight_id
                FROM bookings.ticket_flights tf
                GROUP BY tf.flight_id
              ) tf on f.flight_id = tf.flight_id
              JOIN(
                SELECT s.aircraft_code, COUNT(seat_no) as seats
                FROM bookings.seats s
                GROUP BY s.aircraft_code
              ) s on s.aircraft_code = f.aircraft_code ) sq
              WHERE sq.flight_no = '${fo}'
              group by sq.time, sq.flight_no
              order by sq.time ) main

```

### Postup

1. Rovnako ako v predošlom nedpointe, zistíme obsadenosť letu z tabuľky ticket_flights.
2. Rovnako ako v predošlom endpointe zistíme maximálnu kapacitu letu z tabuľky seats.
3. Z tabuľky flights zistíme, ktoré lietadlo odlieta v ktorý deň pomocou agregátnej funkcie EXTRACT(), ďalej si spravíme percentuálnu obsadenosť pre jednotlivé lety
4. Všetky tri vyššie vytvorené tabuľky si označíme ako subquery a vytiahneme z neho priemernú obsadenosť letu pre jednotlivé dni, zaokrúhľenú na tri desatinné miesta.
5. Nakoľko funkcia ROUND() zaokrúhľuje spôsobom, že berie do úvahy iba polynóm (n+1), musíme už raz zaokrúhlené číslo na tri desatinné miesta vziať a zaokrúhliť ho ešte raz, tentokrát na dve desatinné miesta, aby to prešlo testerom - z toho dôvodu som z predošlých 4 krokov spravil jedno veľké subquery a urobil operáciu AVG() ešte raz nad ním celým

### HTTP Request

```
app.get("/v1/airlines/:flight_no/load-week",async(req,res)=>{
const fo = req.params.flight_no
await pool
.query(`SELECT main.flight_no, main.time, ROUND(main.first, 2) as second
            FROM(
              SELECT sq.flight_no, sq.time,  ROUND(AVG(sq.result),3) as first
              FROM (
                SELECT flight_no, tf.loaded, s.seats, EXTRACT(ISODOW FROM scheduled_departure) as time, ROUND(CAST(tf.loaded AS DECIMAL(7,2)) / s.seats *100,2) as result
                FROM bookings.flights f
                JOIN(
                  SELECT COUNT(ticket_no) AS loaded, tf.flight_id
                  FROM bookings.ticket_flights tf
                  GROUP BY tf.flight_id
                ) tf on f.flight_id = tf.flight_id
                JOIN(
                  SELECT s.aircraft_code, COUNT(seat_no) as seats
                  FROM bookings.seats s
                  GROUP BY s.aircraft_code
                ) s on s.aircraft_code = f.aircraft_code ) sq
              WHERE sq.flight_no = '${fo}'
              group by sq.time, sq.flight_no
              order by sq.time ) main`)
.then((data) => {
const result = { flight_no: fo };
data.rows.forEach((row) =>
switch (row.time)
case "1":
result.monday = Number(row.second);
break;
case "2":
result.tuesday = Number(row.second);
break;
case "3":
result.wednesday = Number(row.second);
break;
case "4":
result.thursday = Number(row.second);
break;
case "5":
result.friday = Number(row.second);
break;
case "6":
result.saturday = Number(row.second);
break;
case "7":
result.sunday = Number(row.second);
break;);
res.send({ result })})
.catch((err)=>{res.send(JSON.stringify(err))})
})
```
