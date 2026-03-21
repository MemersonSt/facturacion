"use client";

import { useEffect, useRef, useState } from "react";

const LOCAL_PRINT_WS_URL =
  process.env.NEXT_PUBLIC_LOCAL_PRINT_WS_URL ?? "ws://localhost:10000/print";
const PRINTER_STORAGE_KEY = "arg-pos-printer-name";

type SocketAction = "GetPrinters" | "PrintDocument";

type SocketEnvelope = {
  Action: SocketAction;
  StatusCode: number | null;
  Message: string | null;
  ResponseModel: unknown;
};

type PendingRequest = {
  resolve: (value: SocketEnvelope) => void;
  reject: (reason?: unknown) => void;
  timeoutId: number;
};

export function useLocalPrintSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const connectPromiseRef = useRef<Promise<WebSocket> | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const pendingRequestRef = useRef<Map<SocketAction, PendingRequest>>(
    new Map(),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinterState] = useState<string | null>(
    () =>
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(PRINTER_STORAGE_KEY),
  );

  function setSelectedPrinter(nextPrinter: string | null) {
    setSelectedPrinterState(nextPrinter);

    if (typeof window === "undefined") {
      return;
    }

    if (nextPrinter) {
      window.localStorage.setItem(PRINTER_STORAGE_KEY, nextPrinter);
      return;
    }

    window.localStorage.removeItem(PRINTER_STORAGE_KEY);
  }

  function rejectPendingRequests(error: Error) {
    pendingRequestRef.current.forEach((pending) => {
      window.clearTimeout(pending.timeoutId);
      pending.reject(error);
    });
    pendingRequestRef.current.clear();
  }

  function scheduleReconnect() {
    if (!shouldReconnectRef.current || reconnectTimeoutRef.current !== null) {
      return;
    }

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      void connect().catch(() => {
        scheduleReconnect();
      });
    }, 1800);
  }

  function handleSocketMessage(event: MessageEvent<string>) {
    try {
      const parsed = JSON.parse(event.data) as SocketEnvelope;

      if (
        parsed.Action === "GetPrinters" &&
        parsed.StatusCode === 200 &&
        Array.isArray(parsed.ResponseModel)
      ) {
        setPrinters(
          parsed.ResponseModel.filter(
            (value): value is string => typeof value === "string",
          ),
        );
      }

      const pending = pendingRequestRef.current.get(parsed.Action);
      if (!pending) {
        return;
      }

      window.clearTimeout(pending.timeoutId);
      pendingRequestRef.current.delete(parsed.Action);
      pending.resolve(parsed);
    } catch {
      // Ignore invalid socket payloads from the local service.
    }
  }

  function connect() {
    const current = socketRef.current;
    if (current?.readyState === WebSocket.OPEN) {
      return Promise.resolve(current);
    }

    if (connectPromiseRef.current) {
      return connectPromiseRef.current;
    }

    connectPromiseRef.current = new Promise<WebSocket>((resolve, reject) => {
      try {
        const socket = new WebSocket(LOCAL_PRINT_WS_URL);
        socketRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          connectPromiseRef.current = null;
          resolve(socket);
          void sendRequest("GetPrinters", null).catch(() => {
            // The bridge may connect before the printer service is ready.
          });
        };

        socket.onclose = () => {
          setIsConnected(false);
          socketRef.current = null;
          connectPromiseRef.current = null;
          rejectPendingRequests(
            new Error("La conexion con la impresora local se cerro"),
          );
          scheduleReconnect();
        };

        socket.onerror = () => {
          setIsConnected(false);
          connectPromiseRef.current = null;
          reject(
            new Error(
              "No se pudo conectar con el servicio local de impresion",
            ),
          );
        };

        socket.onmessage = handleSocketMessage;
      } catch {
        connectPromiseRef.current = null;
        reject(
          new Error("No se pudo inicializar el servicio local de impresion"),
        );
      }
    });

    return connectPromiseRef.current;
  }

  function ensureSocket() {
    const current = socketRef.current;
    if (current?.readyState === WebSocket.OPEN) {
      return Promise.resolve(current);
    }

    if (current?.readyState === WebSocket.CONNECTING && connectPromiseRef.current) {
      return connectPromiseRef.current;
    }

    return connect();
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void connect().catch(() => {
      // The POS can still fall back to browser printing if the local bridge
      // is unavailable during startup.
    });

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  async function sendRequest(action: SocketAction, responseModel: unknown) {
    const socket = await ensureSocket();

    if (pendingRequestRef.current.has(action)) {
      const existing = pendingRequestRef.current.get(action);
      if (existing) {
        window.clearTimeout(existing.timeoutId);
        existing.reject(
          new Error("La solicitud anterior de impresion fue reemplazada"),
        );
      }
      pendingRequestRef.current.delete(action);
    }

    return new Promise<SocketEnvelope>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pendingRequestRef.current.delete(action);
        reject(new Error("El servicio local de impresion no respondio"));
      }, 8000);

      pendingRequestRef.current.set(action, {
        resolve,
        reject,
        timeoutId,
      });

      socket.send(
        JSON.stringify({
          Action: action,
          StatusCode: null,
          Message: null,
          ResponseModel: responseModel,
        }),
      );
    });
  }

  async function loadPrinters() {
    const response = await sendRequest("GetPrinters", null);
    if (response.StatusCode !== 200) {
      throw new Error(response.Message || "No se pudieron obtener impresoras");
    }

    return Array.isArray(response.ResponseModel)
      ? response.ResponseModel.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
  }

  async function printBase64Document(
    printerName: string,
    base64Document: string,
  ) {
    const response = await sendRequest("PrintDocument", {
      namePrinter: printerName,
      documents: [base64Document],
    });

    if (response.StatusCode !== 200) {
      throw new Error(response.Message || "No se pudo imprimir el documento");
    }

    return response;
  }

  return {
    isConnected,
    printers,
    selectedPrinter,
    setSelectedPrinter,
    loadPrinters,
    printBase64Document,
  };
}
