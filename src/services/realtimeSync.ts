import { useState, useEffect, useRef, useCallback } from 'react';
import { Brand, Ticket, TicketStatus } from '../types/index';
import { INITIAL_BRANDS, INITIAL_TICKETS } from '../data/initialData';
import {
  mergeBrand,
  mergeTicket,
  applyStockDelta,
  generateNextBrandId,
  generateNextTicketId,
} from '../utils/syncUtils';
import { calculateShortNoticePenalty } from '../utils/billing';

export type SyncConnectionStatus = 'connected' | 'connecting' | 'offline';

export interface SyncEventMessage {
  type: string;
  payload: any;
  senderId?: string;
  timestamp?: number;
}

// Generate persistent client instance ID
const CLIENT_ID = 'client_' + Math.random().toString(36).substring(2, 9);

export function useRealtimeSync(
  onRemoteNotification?: (text: string, type: 'info' | 'success' | 'warning') => void
) {
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [syncStatus, setSyncStatus] = useState<SyncConnectionStatus>('connecting');
  const [activeClients, setActiveClients] = useState<number>(1);

  const socketRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifyRef = useRef(onRemoteNotification);

  useEffect(() => {
    notifyRef.current = onRemoteNotification;
  }, [onRemoteNotification]);

  // Safe notify helper
  const notify = useCallback((text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    if (notifyRef.current) {
      notifyRef.current(text, type);
    }
  }, []);

  // Helper to send message to WebSocket and BroadcastChannel
  const broadcastOut = useCallback((type: string, payload: any) => {
    const msg: SyncEventMessage = {
      type,
      payload,
      senderId: CLIENT_ID,
      timestamp: Date.now(),
    };

    // 1. Send via WebSocket if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }

    // 2. Send via BroadcastChannel for instant cross-tab sync in same browser
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }, []);

  // Handle incoming remote sync event
  const processIncomingSync = useCallback(
    (msg: SyncEventMessage) => {
      // Ignore messages sent by this client instance
      if (msg.senderId && msg.senderId === CLIENT_ID) return;

      switch (msg.type) {
        case 'sync:init': {
          if (msg.payload) {
            if (Array.isArray(msg.payload.brands) && msg.payload.brands.length > 0) {
              setBrands(msg.payload.brands);
            }
            if (Array.isArray(msg.payload.tickets) && msg.payload.tickets.length > 0) {
              setTickets(msg.payload.tickets);
            }
            if (typeof msg.payload.clientsCount === 'number') {
              setActiveClients(msg.payload.clientsCount);
            }
          }
          break;
        }

        case 'sync:full': {
          if (Array.isArray(msg.payload?.brands)) {
            setBrands(msg.payload.brands);
          }
          if (Array.isArray(msg.payload?.tickets)) {
            setTickets(msg.payload.tickets);
          }
          break;
        }

        case 'clients:count': {
          if (typeof msg.payload?.count === 'number') {
            setActiveClients(msg.payload.count);
          }
          break;
        }

        case 'brand:created': {
          const brand: Brand = msg.payload;
          setBrands((prev) => {
            const exists = prev.some((b) => b.id === brand.id);
            if (exists) return prev;
            return [...prev, brand];
          });
          notify(`New brand "${brand.name}" synced from team!`, 'info');
          break;
        }

        case 'brand:updated': {
          const brand: Brand = msg.payload;
          setBrands((prev) => mergeBrand(prev, brand));
          break;
        }

        case 'brand:renewed': {
          const { id, agreementEndDate } = msg.payload;
          setBrands((prev) =>
            prev.map((b) =>
              b.id === id
                ? {
                    ...b,
                    status: 'Active',
                    lateFee: 0,
                    agreementEndDate: agreementEndDate || b.agreementEndDate,
                  }
                : b
            )
          );
          notify(`Brand ${id} renewal synced from team.`, 'info');
          break;
        }

        case 'brand:vacated': {
          const { id, shortNoticeDays, emergencyRemovalFee, noticeDate } = msg.payload;
          setBrands((prev) =>
            prev.map((b) =>
              b.id === id
                ? {
                    ...b,
                    status: 'Discontinued',
                    shortNoticeDays: shortNoticeDays ?? b.shortNoticeDays,
                    emergencyRemovalFee: emergencyRemovalFee ?? b.emergencyRemovalFee,
                    noticeDate: noticeDate ?? b.noticeDate,
                  }
                : b
            )
          );
          notify(`Brand ${id} slot clearance synced from team.`, 'warning');
          break;
        }

        case 'brand:stock_adjusted': {
          const { id, stockOnHand, unitsSoldWeekly } = msg.payload;
          setBrands((prev) =>
            prev.map((b) => (b.id === id ? { ...b, stockOnHand, unitsSoldWeekly } : b))
          );
          break;
        }

        case 'brands:batch_update': {
          if (Array.isArray(msg.payload)) {
            setBrands(msg.payload);
          }
          break;
        }

        case 'ticket:created': {
          const ticket: Ticket = msg.payload;
          setTickets((prev) => {
            const exists = prev.some((t) => t.id === ticket.id);
            if (exists) return prev;
            return [ticket, ...prev];
          });
          notify(`Support Ticket ${ticket.id} (${ticket.urgency}) synced from team!`, 'info');
          break;
        }

        case 'ticket:updated': {
          const ticket: Ticket = msg.payload;
          setTickets((prev) => mergeTicket(prev, ticket));
          break;
        }

        case 'ticket:status_changed': {
          const { id, status } = msg.payload;
          setTickets((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status } : t))
          );
          notify(`Ticket ${id} status updated to ${status}.`, 'info');
          break;
        }

        case 'ticket:actionable_toggled': {
          const { ticketId, actionableId } = msg.payload;
          setTickets((prev) =>
            prev.map((tk) => {
              if (tk.id === ticketId) {
                return {
                  ...tk,
                  actionables: tk.actionables.map((a) =>
                    a.id === actionableId ? { ...a, done: !a.done } : a
                  ),
                };
              }
              return tk;
            })
          );
          break;
        }

        case 'ticket:note_added': {
          const { ticketId, note } = msg.payload;
          setTickets((prev) =>
            prev.map((tk) => {
              if (tk.id === ticketId) {
                return { ...tk, notes: [...tk.notes, note] };
              }
              return tk;
            })
          );
          break;
        }
      }
    },
    [notify]
  );

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('alttribe_sync_channel');
        broadcastChannelRef.current = channel;
        channel.onmessage = (event) => {
          if (event.data) {
            processIncomingSync(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization failed:', err);
      }
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [processIncomingSync]);

  // Initial HTTP fetch to hydrate state immediately
  useEffect(() => {
    let active = true;
    fetch('/api/state')
      .then((res) => {
        if (!res.ok) throw new Error('State fetch failed');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.brands) && data.brands.length > 0) {
          setBrands(data.brands);
        }
        if (Array.isArray(data.tickets) && data.tickets.length > 0) {
          setTickets(data.tickets);
        }
        if (typeof data.clientsCount === 'number') {
          setActiveClients(data.clientsCount);
        }
      })
      .catch((err) => {
        console.warn('Initial /api/state fetch error (will rely on initialData/WS):', err);
      });

    return () => {
      active = false;
    };
  }, []);

  // WebSocket Connection & Reconnection Management
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    setSyncStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setSyncStatus('connected');
        // Request sync
        ws.send(JSON.stringify({ type: 'ping', senderId: CLIENT_ID }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          processIncomingSync(msg);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setSyncStatus('offline');
        socketRef.current = null;
        // Exponential / backoff reconnection after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection warning:', err);
        ws.close();
      };
    } catch (err) {
      console.warn('WebSocket setup error:', err);
      setSyncStatus('offline');
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, [processIncomingSync]);

  useEffect(() => {
    connectWebSocket();

    // Heartbeat ping every 15s to maintain active connection
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping', senderId: CLIENT_ID }));
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // --- ACTIONS (Optimistic Local Update + Broadcast to Team) ---

  const addBrand = useCallback(
    (newBrand: Brand) => {
      // Ensure unique ID
      const brandToSave: Brand = {
        ...newBrand,
        id: newBrand.id && !brands.some((b) => b.id === newBrand.id)
          ? newBrand.id
          : generateNextBrandId(brands),
      };

      setBrands((prev) => [...prev, brandToSave]);
      broadcastOut('brand:created', brandToSave);

      // Also persist via REST as backup
      fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandToSave),
      }).catch((e) => console.warn('REST brand backup error:', e));
    },
    [brands, broadcastOut]
  );

  const renewBrand = useCallback(
    (id: string) => {
      const target = brands.find((b) => b.id === id);
      const currentEnd = target?.agreementEndDate
        ? new Date(target.agreementEndDate)
        : new Date('2026-11-05');
      const nextEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
      const nextEndStr = nextEnd.toISOString().split('T')[0];

      setBrands((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'Active',
                lateFee: 0,
                agreementEndDate: nextEndStr,
              }
            : b
        )
      );

      broadcastOut('brand:renewed', { id, agreementEndDate: nextEndStr });
    },
    [brands, broadcastOut]
  );

  const vacateBrand = useCallback(
    (brandId: string, advanceNoticeDays: number) => {
      const { shortNoticeDays, fee } = calculateShortNoticePenalty(advanceNoticeDays);
      const noticeDate = new Date().toISOString().split('T')[0];

      setBrands((prev) =>
        prev.map((b) =>
          b.id === brandId
            ? {
                ...b,
                status: 'Discontinued',
                shortNoticeDays,
                emergencyRemovalFee: fee,
                noticeDate,
              }
            : b
        )
      );

      broadcastOut('brand:vacated', {
        id: brandId,
        shortNoticeDays,
        emergencyRemovalFee: fee,
        noticeDate,
      });
    },
    [broadcastOut]
  );

  const adjustStock = useCallback(
    (brandId: string, delta: number) => {
      let updatedStock = 0;
      let updatedSales = 0;

      setBrands((prev) =>
        prev.map((b) => {
          if (b.id === brandId) {
            const { stockOnHand, unitsSoldWeekly } = applyStockDelta(b, delta);
            updatedStock = stockOnHand;
            updatedSales = unitsSoldWeekly;
            return {
              ...b,
              stockOnHand,
              unitsSoldWeekly,
            };
          }
          return b;
        })
      );

      broadcastOut('brand:stock_adjusted', {
        id: brandId,
        stockOnHand: updatedStock,
        unitsSoldWeekly: updatedSales,
        delta,
      });
    },
    [broadcastOut]
  );

  const audit24th = useCallback(
    (updatedBrands: Brand[]) => {
      setBrands(updatedBrands);
      broadcastOut('brands:batch_update', updatedBrands);
    },
    [broadcastOut]
  );

  const addTicket = useCallback(
    (newTicket: Ticket) => {
      const ticketToSave: Ticket = {
        ...newTicket,
        id: newTicket.id && !tickets.some((t) => t.id === newTicket.id)
          ? newTicket.id
          : generateNextTicketId(tickets),
      };

      setTickets((prev) => [ticketToSave, ...prev]);
      broadcastOut('ticket:created', ticketToSave);

      // REST backup
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketToSave),
      }).catch((e) => console.warn('REST ticket backup error:', e));
    },
    [tickets, broadcastOut]
  );

  const updateTicketStatus = useCallback(
    (ticketId: string, newStatus: TicketStatus) => {
      setTickets((prev) =>
        prev.map((item) => (item.id === ticketId ? { ...item, status: newStatus } : item))
      );
      broadcastOut('ticket:status_changed', { id: ticketId, status: newStatus });
    },
    [broadcastOut]
  );

  const toggleActionable = useCallback(
    (ticketId: string, actionableId: number) => {
      setTickets((prev) =>
        prev.map((tk) => {
          if (tk.id === ticketId) {
            return {
              ...tk,
              actionables: tk.actionables.map((a) =>
                a.id === actionableId ? { ...a, done: !a.done } : a
              ),
            };
          }
          return tk;
        })
      );
      broadcastOut('ticket:actionable_toggled', { ticketId, actionableId });
    },
    [broadcastOut]
  );

  const addTicketNote = useCallback(
    (ticketId: string, noteText: string) => {
      const newNote = {
        id: Date.now(),
        author: 'Floor Staff',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        text: noteText,
      };

      setTickets((prev) =>
        prev.map((tk) => {
          if (tk.id === ticketId) {
            return {
              ...tk,
              notes: [...tk.notes, newNote],
            };
          }
          return tk;
        })
      );
      broadcastOut('ticket:note_added', { ticketId, note: newNote });
    },
    [broadcastOut]
  );

  return {
    brands,
    tickets,
    syncStatus,
    activeClients,
    addBrand,
    renewBrand,
    vacateBrand,
    adjustStock,
    audit24th,
    addTicket,
    updateTicketStatus,
    toggleActionable,
    addTicketNote,
  };
}
