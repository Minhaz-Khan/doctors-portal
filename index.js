const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.drtwsrz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const appoinmentOptionCollection = client.db('DoctorsPortal').collection('appoinmentOptions');
        const bookingsCollection = client.db('DoctorsPortal').collection('bookings');

        // use Aggregate to query multiple collection and then merge date
        app.get('/appoinmentoptions', async (req, res) => {
            const query = {};
            const date = req.query.date;
            const options = await appoinmentOptionCollection.find(query).toArray();
            // get to bookings of the provided date
            const bookingDate = {
                appointmentDate: date
            }
            const alreadyBookedOnDate = await bookingsCollection.find(bookingDate).toArray();
            options.forEach(option => {
                const optionBookedCount = alreadyBookedOnDate.filter(booked => booked.treatment === option.name)
                const bookedSlotes = optionBookedCount.map(book => book.slot);
                const remainingSlotes = option.slots.filter(slot => !bookedSlotes.includes(slot))

                option.slots = remainingSlotes
            })
            res.send(options)
        })

        /**
         * bookings
         * app.get('/bookings')
         * app.get('/bookings/:id')
         * app.post('/bookings')
         * app.patch('/bookings/:id')
         * app.delete('/bookings/:id')
          **/

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            console.log(alreadyBooked);
            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })
    }
    catch { }
}
run().catch(e => console.log(e))




app.get('/', async (req, res) => {
    res.send('doctors portal server id running')
})

app.listen(port, () => {
    console.log(`Doctors portal running on ${port}`);
})