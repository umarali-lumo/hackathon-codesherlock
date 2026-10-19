import JSZip from 'jszip';
import { SourceFile } from '../types';

export const DEMO_FILES_RECORD: Record<string, string> = {
  'ecommerce_service/main.py': `"""
E-Commerce Checkout Entry Point
CodeSherlock Demo Fixture (NYLP AI Hackathon 2026)
"""
import sys
from order_processor import process_checkout

def run_checkout_flow():
    print("=== Starting E-Commerce Order Checkout Flow ===")
    
    # Order 1: Standard order without coupon
    order_standard = {
        "order_id": "ORD-9001",
        "customer": "Alice",
        "items": [
            {"id": "PROD-001", "name": "Wireless Mouse", "price": 25.00, "quantity": 2}
        ],
        "coupon": None
    }
    res1 = process_checkout(order_standard)
    print(f"Order 1 processed: ID={res1['order_id']}, Total=\${res1['final_total']}")

    # Order 2: Order with promo code missing 'rate' (Triggers cross-file KeyError bug)
    order_discounted = {
        "order_id": "ORD-9002",
        "customer": "Bob",
        "items": [
            {"id": "PROD-002", "name": "Mechanical Keyboard", "price": 120.00, "quantity": 1}
        ],
        "coupon": {"code": "FREESHIP"}
    }
    print("Processing Order 2 with coupon promo code...")
    res2 = process_checkout(order_discounted)
    print(f"Order 2 processed: ID={res2['order_id']}, Total=\${res2['final_total']}")

if __name__ == "__main__":
    run_checkout_flow()
`,

  'ecommerce_service/order_processor.py': `"""
Order Processor Service
Calculates total pricing, coordinates inventory, and delegates discount logic.
"""
from pricing_engine import calculate_subtotal, apply_discount
from inventory import check_stock

def process_checkout(order):
    items = order.get("items", [])
    
    # 1. Verify inventory
    for item in items:
        if not check_stock(item["id"], item.get("quantity", 1)):
            raise ValueError(f"Insufficient inventory for item: {item['id']}")
            
    # 2. Compute subtotal
    subtotal = calculate_subtotal(items)
    
    # 3. Apply discount across files
    # Cross-file dependency: order_processor passes order['coupon'] to pricing_engine
    coupon = order.get("coupon")
    discount_amount = apply_discount(subtotal, coupon)
    
    final_total = max(0.0, round(subtotal - discount_amount, 2))
    
    return {
        "order_id": order.get("order_id"),
        "customer": order.get("customer"),
        "subtotal": subtotal,
        "discount": discount_amount,
        "final_total": final_total,
        "status": "CONFIRMED"
    }

def calculate_order_total(order):
    """Direct helper for test runner"""
    res = process_checkout(order)
    return res["final_total"]
`,

  'ecommerce_service/pricing_engine.py': `"""
Pricing and Discount Engine
Handles subtotal calculation, tax estimation, and coupon discount rates.
"""

def calculate_subtotal(items):
    """Calculates gross item total before discounts"""
    return sum(item["price"] * item.get("quantity", 1) for item in items)

def apply_discount(subtotal, coupon):
    """
    Applies coupon discount rate to subtotal.
    Expected coupon schema: {'code': str, 'rate': float}
    
    DEFECT:
    Unchecked dictionary subscript access on coupon['rate'].
    If coupon is passed as {'code': 'FREESHIP'} (missing 'rate')
    or as a string 'SUMMER20', it causes a runtime crash.
    """
    if not coupon:
        return 0.0

    # Line 23: PLANTED CROSS-FILE BUG
    # Will throw KeyError: 'rate' if 'rate' key is absent in coupon
    rate = coupon['rate']
    
    discount = round(subtotal * rate, 2)
    return discount
`,

  'ecommerce_service/inventory.py': `"""
Inventory management utility
"""

STOCK_DATABASE = {
    "PROD-001": 50,
    "PROD-002": 15,
    "PROD-003": 0
}

def check_stock(item_id, requested_qty=1):
    available = STOCK_DATABASE.get(item_id, 0)
    return available >= requested_qty
`,

  'ecommerce_service/test_orders.py': `"""
Unit tests for ecommerce order processing and pricing
"""
import unittest
from order_processor import calculate_order_total

class TestOrderProcessing(unittest.TestCase):
    def test_regular_order_without_coupon(self):
        """Test regular checkout without coupon"""
        order = {
            "order_id": "TEST-1",
            "items": [{"id": "PROD-001", "price": 50.0, "quantity": 2}],
            "coupon": None
        }
        total = calculate_order_total(order)
        self.assertEqual(total, 100.0)

    def test_order_with_valid_dict_coupon(self):
        """Test checkout with complete coupon containing rate"""
        order = {
            "order_id": "TEST-2",
            "items": [{"id": "PROD-001", "price": 100.0, "quantity": 1}],
            "coupon": {"code": "VIP20", "rate": 0.20}
        }
        total = calculate_order_total(order)
        self.assertEqual(total, 80.0)

    def test_order_with_missing_rate_key_fails(self):
        """
        Cross-file defect test:
        Coupon is a dictionary with code 'FREESHIP', but does not have 'rate'.
        Triggers KeyError: 'rate' in pricing_engine.py at line 23 via order_processor.py
        """
        order = {
            "order_id": "TEST-3",
            "items": [{"id": "PROD-002", "price": 120.0, "quantity": 1}],
            "coupon": {"code": "FREESHIP"}
        }
        total = calculate_order_total(order)
        self.assertGreater(total, 0)

if __name__ == '__main__':
    unittest.main()
`,

  'ecommerce_service/contracts.ts': `/**
 * TypeScript Data Contracts for E-Commerce Order Pipeline
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Coupon {
  code: string;
  rate?: number; // Optional rate in TS contract, causing crash in Python if unhandled
  expiresAt?: string;
}

export interface OrderPayload {
  order_id: string;
  customer: string;
  items: CartItem[];
  coupon?: Coupon | null;
}

export function validateCoupon(coupon: Coupon): boolean {
  if (!coupon.code) return false;
  return typeof coupon.rate === 'number' && coupon.rate >= 0;
}
`,

  'ecommerce_service/gateway.js': `/**
 * Node.js API Gateway Proxy
 */
const express = require('express');
const router = express.Router();

router.post('/api/checkout', (req, res) => {
  const { order_id, items, coupon } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart cannot be empty' });
  }

  // Forward order to Python calculation service
  res.json({
    status: 'QUEUED',
    order_id,
    has_coupon: Boolean(coupon)
  });
});

module.exports = router;
`,

  'ecommerce_service/config.json': `{
  "serviceName": "ecommerce-order-service",
  "version": "2.4.0",
  "environment": "production",
  "currency": "USD",
  "taxRate": 0.0825,
  "features": {
    "discountEngineV2": true,
    "strictInventoryCheck": true
  }
}`
};

export const SAMPLE_STACK_TRACE = `Traceback (most recent call last):
  File "ecommerce_service/main.py", line 28, in <module>
    run_checkout_flow()
  File "ecommerce_service/main.py", line 25, in run_checkout_flow
    res2 = process_checkout(order_discounted)
  File "ecommerce_service/order_processor.py", line 24, in process_checkout
    discount_amount = apply_discount(subtotal, coupon)
  File "ecommerce_service/pricing_engine.py", line 23, in apply_discount
    rate = coupon['rate']
KeyError: 'rate'`;

/**
 * Builds a ZIP file containing the demo project for local upload/download
 */
export async function createDemoZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(DEMO_FILES_RECORD)) {
    zip.file(path, content);
  }
  return await zip.generateAsync({ type: 'blob' });
}

import { detectFileLanguage } from './multiLanguageParser';

/**
 * Direct converter to SourceFile array for instant 1-click load
 */
export function getDemoSourceFiles(): SourceFile[] {
  return Object.entries(DEMO_FILES_RECORD).map(([path, content]) => {
    const lang = detectFileLanguage(path).id;
    return {
      path,
      name: path.split('/').pop() || path,
      content,
      language: lang,
      size: content.length,
      isTest: path.includes('test_'),
      loc: content.split('\n').length
    };
  });
}

