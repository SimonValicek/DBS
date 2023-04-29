const { Pool } = require("pg"); 
const express = require("express");
const moment = require('moment');
const app = express();
const port = 8000;


const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT
});

app.use(express.static("public"));


//Zadanie č.1
app.get("/v1/status", (req, res) => {
  pool
    .query("SELECT VERSION()")
    .then((data) => {
      res.send(JSON.stringify(data.rows[0]));
    })
    .catch((err) => {
      res.send(JSON.stringify(err))
      console.log(err)
    });
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//Zadanie č.2
//FIRST ENDPOINT
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


//SECOND ENDPOINT - OK
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

//THIRD ENDPOINT - OK
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


//FOURTH ENDPOINT - OK
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

//FIFTH ENDPOINT - OK
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

//SIXTH ENDPOINT - OK
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

//SEVENT ENDPOINT - OK
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


//EIGHT ENDPOINT - OK
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
      data.rows.forEach((row) => {
        switch (row.time) {
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
            break;}});
      res.send({ result })})
    .catch((err)=>{res.send(JSON.stringify(err))})
})
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//Zadanie č.3

//FIRST ENDPOINT - OK
app.get("/v3/aircrafts/:aircraft_code/seats/:seat_choice",async(req,res)=>{
  const ac = req.params.aircraft_code
  const sc = req.params.seat_choice
  await pool
    .query(`WITH cte AS (
              SELECT bp.flight_id, bp.seat_no, b.book_date, DENSE_RANK() OVER (PARTITION BY bp.flight_id ORDER BY b.book_date) AS rank
              FROM bookings.boarding_passes bp
              JOIN bookings.tickets t ON bp.ticket_no = t.ticket_no
              JOIN bookings.bookings b ON t.book_ref = b.book_ref
              WHERE bp.flight_id IN (
                SELECT flight_id 
                FROM bookings.flights 
                WHERE aircraft_code = '${ac}'
              )
            )
            SELECT seat_no, COUNT(*) AS cnt
            FROM cte
            WHERE rank = ${sc}
            GROUP BY seat_no
            ORDER BY cnt DESC
            LIMIT 1`)
    .then((data)=>{
      const result = data.rows.map(row=>({
        seat: row.seat_no,
        count: parseInt(row.cnt)
      }))[0]
      res.json({result})
    })
    .catch((err)=>{res.send(JSON.stringify(err))})
})


//SECOND ENDPOINT - OK
app.get("/v3/air-time/:book_ref",async(req,res)=>{
  const br = req.params.book_ref
  await pool
    .query(`SELECT tf.*, departure_airport, arrival_airport, 
                  TO_CHAR(actual_arrival::timestamp-actual_departure::timestamp, 'HH24:MI:SS') AS diff,
                  TO_CHAR((SUM(EXTRACT(epoch FROM actual_arrival-actual_departure)) OVER (PARTITION BY passenger_name ORDER BY actual_departure) * interval '1 second'), 'HH24:MI:SS') AS total
            FROM bookings.flights f
            JOIN(
              SELECT t.*, flight_id
              FROM bookings.ticket_flights tf
              JOIN(
                SELECT ticket_no, passenger_id, passenger_name
                FROM bookings.tickets
                WHERE book_ref = '${br}'
              ) t ON t.ticket_no = tf.ticket_no
            ) tf ON tf.flight_id = f.flight_id
            ORDER BY passenger_name, actual_departure`)
      .then((data)=>{
        const groupedData = {};
        data.rows.forEach(row => {
          if (!groupedData[row.ticket_no]) {
            groupedData[row.ticket_no] = {
            ticket_no: row.ticket_no,
            passenger_name: row.passenger_name,
            flights: []
            }
          }
          groupedData[row.ticket_no].flights.push({
            departure_airport: row.departure_airport,
            arrival_airport: row.arrival_airport,
            flight_time: row.diff.replace(/^0/, ''),
            total_time: row.total.replace(/^0/, '')
          });
        });
        const result = Object.values(groupedData);
        res.json({results: result});
      })
    .catch((err)=>{res.send(JSON.stringify(err))})
})


//THIRD ENDPOINT - OK
app.get("/v3/airlines/:flight_no/top_seats",async(req,res)=>{
  const fn = req.params.flight_no
  const limit = req.query.limit;
  await pool
    .query(`SELECT seat_no, array_agg(flight_id ORDER BY flight_id) AS sequence, count(*) as count
            FROM (
              SELECT f.flight_id, bp.seat_no, ROW_NUMBER() OVER (PARTITION BY bp.seat_no ORDER BY f.flight_id) as row_num
              FROM bookings.flights f
              JOIN (
                SELECT seat_no, flight_id
                FROM bookings.boarding_passes bp
              ) bp ON bp.flight_id = f.flight_id
              WHERE f.flight_no = '${fn}'
            ) sub
            GROUP BY seat_no, (flight_id - row_num)
            ORDER BY count desc
            LIMIT ${limit}`)
    .then((data)=>{
      const results = data.rows.map(row=>({
        seat: row.seat_no,
        flights_count: parseInt(row.count),
        flights: row.sequence
      }))
      res.json({results})
    })
    .catch((err)=>{res.send(JSON.stringify(err))})
})


//FOURHT ENDPOINT - OK
app.get("/v3/aircrafts/:aircraft_code/top-incomes",async(req,res)=>{
  const ac = req.params.aircraft_code
  await pool
    .query(`SELECT ROUND(total_money,0) as money, year_month, day_of_month
            FROM (
              SELECT SUM(amount) as total_money, 
                    TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') AS year_month, 
                    EXTRACT(DAY FROM actual_departure) AS day_of_month,
                    RANK() OVER (PARTITION BY TO_CHAR(DATE_TRUNC('month', actual_departure), 'YYYY-MM') ORDER BY SUM(amount) DESC) AS rank
              FROM bookings.ticket_flights tf
              JOIN(
                SELECT actual_departure, flight_id
                FROM bookings.flights
                WHERE aircraft_code = '${ac}'
              ) f on f.flight_id = tf.flight_id
              WHERE actual_departure IS NOT NULL
              GROUP BY year_month, day_of_month
            ) subquery
            WHERE rank = 1
            ORDER BY money DESC`)
    .then((data)=>{
      const results = data.rows.map(row=>({
        total_amount: parseInt(row.money),
        month: row.year_month.replace(/^(.*?)0(\d)$/, '$1$2'),
        day: row.day_of_month
      }))
      res.json({results})
    })
    .catch((err)=>{res.send(JSON.stringify(err))})
})



//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});






