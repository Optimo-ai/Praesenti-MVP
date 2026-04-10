import { T, G, serif, sans, s } from '../constants.js';
import { Modal, WzFi, WzLbl } from './shared.js';

const { React } = window;
const { useState } = React;

// SUPA_URL/KEY read lazily inside handlePay

export const CheckoutModal = ({ open, onClose, payment, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });

  if (!open || !payment) return null;

  const handlePay = async () => {
    setLoading(true);
    const SUPA_URL = window.VITE_SUPABASE_URL || window.SUPA_URL;
    const SUPA_KEY = window.VITE_SUPABASE_KEY || window.SUPA_KEY;
    try {
      await new Promise(r => setTimeout(r, 1500));
      const res = await fetch(SUPA_URL + '/rest/v1/pago?pago_id=eq.' + payment.pago_id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY },
        body: JSON.stringify({
          estado_pago: "deposito_recibido",
          deposito_pagado: true,
          fecha_pago: new Date().toISOString()
        })
      });
      if (res.ok) { onSuccess(); onClose(); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return React.createElement(Modal, { open, onClose },
    React.createElement("div", { style: { padding: "28px" } },
      React.createElement("h2", { style: { fontFamily: serif, fontSize: 22, color: T[950], marginBottom: 8 } }, "Complete Payment"),
      React.createElement("p", { style: { fontSize: 13, color: G[500], marginBottom: 20 } }, "Secure checkout for: " + payment.desc),
      React.createElement("div", { style: { ...s.card, background: G[50], marginBottom: 20 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
          React.createElement("span", { style: s.label }, "Amount to pay"),
          React.createElement("span", { style: { fontWeight: 600, color: T[700] } }, "$" + payment.amount)
        )
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", null,
          React.createElement(WzLbl, { t: "Card number" }),
          React.createElement(WzFi, { ph: "4242 4242 4242 4242", val: card.num, onChange: e => setCard({ ...card, num: e.target.value }) })
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          React.createElement("div", null,
            React.createElement(WzLbl, { t: "Expiry" }),
            React.createElement(WzFi, { ph: "MM/YY", val: card.exp, onChange: e => setCard({ ...card, exp: e.target.value }) })
          ),
          React.createElement("div", null,
            React.createElement(WzLbl, { t: "CVC" }),
            React.createElement(WzFi, { ph: "123", val: card.cvc, onChange: e => setCard({ ...card, cvc: e.target.value }) })
          )
        )
      ),
      React.createElement("button", {
        onClick: handlePay,
        disabled: loading || !card.num,
        style: { ...s.btnPrimary, width: "100%", marginTop: 24, height: 46 }
      }, loading ? "Processing..." : "Confirm Payment")
    )
  );
};
