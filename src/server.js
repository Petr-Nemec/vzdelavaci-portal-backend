const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Základní API endpointy
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API běží' });
});

// Ukázkový endpoint pro události
app.get('/api/events', (req, res) => {
  res.json({
    events: [
      {
        _id: '1',
        title: 'Workshop programování',
        shortDescription: 'Naučte se základy programování v javascriptu',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        location: { city: 'Ostrava', name: 'VŠB-TUO' },
        eventType: 'workshop',
        organizerId: { name: 'IT sdružení MSK', _id: '1' }
      },
      {
        _id: '2',
        title: 'Přednáška o umělé inteligenci',
        shortDescription: 'Seznámení s možnostmi AI v moderním světě',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 86400000 + 3600000),
        location: { city: 'Frýdek-Místek', name: 'Gymnázium' },
        eventType: 'lecture',
        organizerId: { name: 'Vzdělávací centrum FM', _id: '2' }
      }
    ],
    totalPages: 1,
    currentPage: 1
  });
});

// Ukázkový endpoint pro organizace
app.get('/api/organizations', (req, res) => {
  res.json({
    organizations: [
      {
        _id: '1',
        name: 'IT sdružení MSK',
        description: 'Organizace zaměřená na IT vzdělávání v Moravskoslezském kraji',
        logo: 'https://via.placeholder.com/150',
        contactEmail: 'info@itsdruzeni.cz'
      },
      {
        _id: '2',
        name: 'Vzdělávací centrum FM',
        description: 'Vzdělávací organizace ve Frýdku-Místku',
        logo: 'https://via.placeholder.com/150',
        contactEmail: 'info@vzdelavacifm.cz'
      }
    ],
    totalPages: 1,
    currentPage: 1
  });
});

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});
