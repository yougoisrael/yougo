import { useState } from "react";

export function useCart() {
  const [cart, setCart] = useState([]);

  function addToCart(item, rest) {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id && c.rid === rest.id);
      if (ex) return prev.map(c => c.id === item.id && c.rid === rest.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, rid: rest.id, rname: rest.name }];
    });
  }

  function removeFromCart(iid, rid) {
    setCart(prev => {
      const ex = prev.find(c => c.id === iid && c.rid === rid);
      if (ex && ex.qty > 1) return prev.map(c => c.id === iid && c.rid === rid ? { ...c, qty: c.qty - 1 } : c);
      return prev.filter(c => !(c.id === iid && c.rid === rid));
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  return { cart, setCart, addToCart, removeFromCart, cartCount, cartTotal };
}
