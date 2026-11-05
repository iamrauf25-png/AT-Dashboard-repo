import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { INITIAL_BRANDS, INITIAL_TICKETS } from './src/data/initialData.ts';
import { Brand, Ticket } from './src/types/index.ts';
import {
  generateNextBrandId,
  generateNextTicketId,
  mergeBrand,
  mergeTicket,
  applyStockDelta,
} from './src/utils/syncUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Persistent data directory
const DATA_DIR = path.resolve(__dirname, '.data');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

// Authoritative in-memory state
let brandsState: Brand[] = [...INITIAL_BRANDS];
let ticketsState: Ticket[] = [...INITIAL_TICKETS];

// Initialize / load state from disk
function loadPersistedState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.brands) && data.brands.length > 0) {
        brandsState = data.brands.map((b: Brand) => {
          const initMatch = INITIAL_BRANDS.find((ib) => ib.id === b.id);
          return {
            ...b,
            contactPhone: b.contactPhone || initMatch?.contactPhone || '+91 98450 12345',
          };
        });
      }
      if (Array.isArray(data.tickets) && data.tickets.length > 0) {
        ticketsState = data.tickets;
      }
      console.log(`[Store] Loaded ${brandsState.length} brands and ${ticketsState.length} tickets from disk`);
    } else {
      savePersistedState();
    }
  } catch (err) {
    console.error('[Store] Error loading persisted state:', err);
  }
}

function savePersistedState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      STORE_FILE,
      JSON.stringify({ brands: brandsState, tickets: ticketsState, lastSaved: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('[Store] Error saving persisted state:', err);
  }
}

loadPersistedState();

const app = express();
const server = http.createServer(app);

// Enable JSON body parsing
app.use(express.json({ limit: '10mb' }));

// Setup WebSocket server on path /ws
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(event: object, sender?: WebSocket) {
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastClientsCount() {
  broadcast({
    type: 'clients:count',
    payload: { count: wss.clients.size },
  });
}

wss.on('connection', (ws) => {
  console.log(`[WS] Client connected. Total active clients: ${wss.clients.size}`);

  // Send full initial state to newly connected client
  ws.send(
    JSON.stringify({
      type: 'sync:init',
      payload: {
        brands: brandsState,
        tickets: ticketsState,
        serverTime: new Date().toISOString(),
        clientsCount: wss.clients.size,
      },
    })
  );

  broadcastClientsCount();

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleWebSocketMessage(msg, ws);
    } catch (err) {
      console.error('[WS] Failed to parse client message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected. Total active clients: ${wss.clients.size}`);
    broadcastClientsCount();
  });

  ws.on('error', (err) => {
    console.error('[WS] Client socket error:', err);
  });
});

function handleWebSocketMessage(msg: { type: string; payload: any }, ws: WebSocket) {
  switch (msg.type) {
    case 'brand:created': {
      const brand: Brand = msg.payload;
      if (!brand.id || brandsState.some((b) => b.id === brand.id)) {
        brand.id = generateNextBrandId(brandsState);
      }
      brandsState = mergeBrand(brandsState, brand);
      savePersistedState();
      // Broadcast to all other clients
      broadcast({ type: 'brand:created', payload: brand }, ws);
      // ACK to sender
      ws.send(JSON.stringify({ type: 'brand:created:ack', payload: brand }));
      break;
    }

    case 'brand:updated': {
      const brand: Brand = msg.payload;
      brandsState = mergeBrand(brandsState, brand);
      savePersistedState();
      broadcast({ type: 'brand:updated', payload: brand }, ws);
      break;
    }

    case 'brand:renewed': {
      const { id, agreementEndDate } = msg.payload;
      const existing = brandsState.find((b) => b.id === id);
      if (existing) {
        existing.status = 'Active';
        existing.lateFee = 0;
        existing.agreementEndDate = agreementEndDate;
        savePersistedState();
        broadcast({ type: 'brand:renewed', payload: { id, agreementEndDate } }, ws);
      }
      break;
    }

    case 'brand:vacated': {
      const { id, shortNoticeDays, emergencyRemovalFee, noticeDate } = msg.payload;
      const existing = brandsState.find((b) => b.id === id);
      if (existing) {
        existing.status = 'Discontinued';
        existing.shortNoticeDays = shortNoticeDays;
        existing.emergencyRemovalFee = emergencyRemovalFee;
        existing.noticeDate = noticeDate;
        savePersistedState();
        broadcast({ type: 'brand:vacated', payload: msg.payload }, ws);
      }
      break;
    }

    case 'brand:stock_adjusted': {
      const { id, delta } = msg.payload;
      const existing = brandsState.find((b) => b.id === id);
      if (existing) {
        const { stockOnHand, unitsSoldWeekly } = applyStockDelta(existing, delta);
        existing.stockOnHand = stockOnHand;
        existing.unitsSoldWeekly = unitsSoldWeekly;
        savePersistedState();
        broadcast(
          {
            type: 'brand:stock_adjusted',
            payload: { id, stockOnHand, unitsSoldWeekly },
          },
          ws
        );
      }
      break;
    }

    case 'brands:batch_update': {
      if (Array.isArray(msg.payload)) {
        brandsState = msg.payload;
        savePersistedState();
        broadcast({ type: 'brands:batch_update', payload: brandsState }, ws);
      }
      break;
    }

    case 'ticket:created': {
      const ticket: Ticket = msg.payload;
      if (!ticket.id || ticketsState.some((t) => t.id === ticket.id)) {
        ticket.id = generateNextTicketId(ticketsState);
      }
      ticketsState = mergeTicket(ticketsState, ticket);
      savePersistedState();
      broadcast({ type: 'ticket:created', payload: ticket }, ws);
      ws.send(JSON.stringify({ type: 'ticket:created:ack', payload: ticket }));
      break;
    }

    case 'ticket:updated': {
      const ticket: Ticket = msg.payload;
      ticketsState = mergeTicket(ticketsState, ticket);
      savePersistedState();
      broadcast({ type: 'ticket:updated', payload: ticket }, ws);
      break;
    }

    case 'ticket:status_changed': {
      const { id, status } = msg.payload;
      const existing = ticketsState.find((t) => t.id === id);
      if (existing) {
        existing.status = status;
        savePersistedState();
        broadcast({ type: 'ticket:status_changed', payload: { id, status } }, ws);
      }
      break;
    }

    case 'ticket:actionable_toggled': {
      const { ticketId, actionableId } = msg.payload;
      const existing = ticketsState.find((t) => t.id === ticketId);
      if (existing) {
        existing.actionables = existing.actionables.map((a) =>
          a.id === actionableId ? { ...a, done: !a.done } : a
        );
        savePersistedState();
        broadcast({ type: 'ticket:actionable_toggled', payload: { ticketId, actionableId } }, ws);
      }
      break;
    }

    case 'ticket:note_added': {
      const { ticketId, note } = msg.payload;
      const existing = ticketsState.find((t) => t.id === ticketId);
      if (existing) {
        existing.notes = [...existing.notes, note];
        savePersistedState();
        broadcast({ type: 'ticket:note_added', payload: { ticketId, note } }, ws);
      }
      break;
    }

    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }

    default:
      console.warn('[WS] Unhandled message type:', msg.type);
  }
}

// --- REST API ENDPOINTS ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clientsCount: wss.clients.size,
    brandsCount: brandsState.length,
    ticketsCount: ticketsState.length,
  });
});

app.get('/api/state', (_req: Request, res: Response) => {
  res.json({
    brands: brandsState,
    tickets: ticketsState,
    serverTime: new Date().toISOString(),
    clientsCount: wss.clients.size,
  });
});

app.post('/api/brands', (req: Request, res: Response) => {
  const brandData = req.body;
  if (!brandData || !brandData.name) {
    return res.status(400).json({ error: 'Brand name is required' });
  }

  const newBrand: Brand = {
    ...brandData,
    id: brandData.id && !brandsState.some((b) => b.id === brandData.id)
      ? brandData.id
      : generateNextBrandId(brandsState),
  };

  brandsState = mergeBrand(brandsState, newBrand);
  savePersistedState();
  broadcast({ type: 'brand:created', payload: newBrand });

  res.status(201).json(newBrand);
});

app.put('/api/brands/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = brandsState.find((b) => b.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  const updated: Brand = { ...existing, ...req.body, id };
  brandsState = mergeBrand(brandsState, updated);
  savePersistedState();
  broadcast({ type: 'brand:updated', payload: updated });

  res.json(updated);
});

app.post('/api/tickets', (req: Request, res: Response) => {
  const ticketData = req.body;
  if (!ticketData || !ticketData.subject) {
    return res.status(400).json({ error: 'Ticket subject is required' });
  }

  const newTicket: Ticket = {
    ...ticketData,
    id: ticketData.id && !ticketsState.some((t) => t.id === ticketData.id)
      ? ticketData.id
      : generateNextTicketId(ticketsState),
  };

  ticketsState = mergeTicket(ticketsState, newTicket);
  savePersistedState();
  broadcast({ type: 'ticket:created', payload: newTicket });

  res.status(201).json(newTicket);
});

app.put('/api/tickets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = ticketsState.find((t) => t.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const updated: Ticket = { ...existing, ...req.body, id };
  ticketsState = mergeTicket(ticketsState, updated);
  savePersistedState();
  broadcast({ type: 'ticket:updated', payload: updated });

  res.json(updated);
});

app.post('/api/sync', (req: Request, res: Response) => {
  const { brands, tickets } = req.body;
  if (Array.isArray(brands)) {
    brandsState = brands;
  }
  if (Array.isArray(tickets)) {
    ticketsState = tickets;
  }
  savePersistedState();
  broadcast({ type: 'sync:full', payload: { brands: brandsState, tickets: ticketsState } });
  res.json({ success: true, brandsCount: brandsState.length, ticketsCount: ticketsState.length });
});

// --- VITE MIDDLEWARE / STATIC ASSETS ---

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Alt.Tribe] Server active on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer().catch((err) => {
  console.error('[Alt.Tribe] Failed to start server:', err);
  process.exit(1);
});
