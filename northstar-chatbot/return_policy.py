import re
from datetime import datetime

def evaluate_return_policy(order_data: dict, return_reason: str = "Standard Return") -> dict:
    """
    Evaluates order return eligibility against Northstar Retail Co. Policy.
    
    Parameters:
        order_data (dict): Output from Member 1 lookup containing:
            - order_id (str)
            - purchase_date (str, YYYY-MM-DD)
            - item_category (str)
            - return_status (str)
        return_reason (str): Reason selected by customer (e.g., 'Damaged/Defective', 'Size issue')
        
    Returns:
        dict: Response message and next system state.
    """
    order_id = order_data.get("order_id", "")
    
    # 1. Rule 1.1: Order ID Syntax Check (ORD-XXXXX)
    pattern = r"^ORD-[A-Za-z0-9]{5}$"
    if not re.match(pattern, order_id):
        return {
            "status": "INVALID_FORMAT",
            "message": "That order number doesn't look quite right. Please double-check your receipt and enter it in the format ORD-10023.",
            "next_action": "RETRY_INPUT"
        }

    # 2. Rule 3.3: Damaged or Defective Items (Fast-Track Handoff)
    if return_reason.lower() in ["damaged", "defective", "item arrived damaged / defective"]:
        return {
            "status": "DAMAGED_FAST_TRACK",
            "message": "We're so sorry your item arrived damaged! Please attach a photo and a brief note so an agent can arrange a replacement right away.",
            "next_action": "PROMPT_PHOTO_AND_GENERATE_TICKET"
        }

    # 3. Rule 3.2: Checking Active Return Status
    current_status = order_data.get("return_status", "").title()
    if current_status == "Pending":
        return {
            "status": "ALREADY_ISSUED",
            "message": "A return label has already been issued for this order. Please check your email inbox to download and print it.",
            "next_action": "END_WORKFLOW"
        }
    elif current_status == "Refunded":
        return {
            "status": "ALREADY_REFUNDED",
            "message": "This order has already been fully processed and refunded.",
            "next_action": "END_WORKFLOW"
        }

    # 4. Rule 3.1: Non-Returnable Products (Final Sale / Clearance / Intimate Wear)
    category = order_data.get("item_category", "").lower()
    restricted_categories = ["final sale", "clearance", "intimate wear", "intimates"]
    if any(res in category for res in restricted_categories):
        return {
            "status": "FINAL_SALE",
            "message": "This item was purchased as a Final Sale item and isn't eligible for return or store credit under our shop policy.",
            "next_action": "END_WORKFLOW"
        }

    # 5. Rule 2.1 & 2.2 / 2.3: Date Calculation & Standard Return Window (<= 30 Days)
    purchase_date_str = order_data.get("purchase_date")
    if purchase_date_str:
        purchase_date = datetime.strptime(purchase_date_str, "%Y-%m-%d").date()
        today = datetime.now().date()
        days_since_purchase = (today - purchase_date).days

        if days_since_purchase <= 30:
            return {
                "status": "APPROVED",
                "message": "Your order is eligible for a return. We've generated your prepaid return shipping label below.",
                "next_action": "SHOW_LABEL_BUTTON",
                "days_elapsed": days_since_purchase
            }
        else:
            return {
                "status": "EXPIRED_WINDOW",
                "message": "Standard returns must be requested within 30 days of delivery. Because this purchase was made over 30 days ago, I'm handing this over to a support representative to review your case.",
                "next_action": "ESCALATE_TO_HUMAN_AGENT",
                "days_elapsed": days_since_purchase
            }

    return {
        "status": "ERROR",
        "message": "Could not verify purchase date.",
        "next_action": "END_WORKFLOW"
    }


# =====================================================================
# QUICK LOCAL TESTING BLOCK
# =====================================================================
if __name__ == "__main__":
    print("--- TESTING RETURN POLICY LOGIC LOCAL-ONLY ---\n")
    
    # Test Case 1: Standard Eligible Return
    test_order_1 = {
        "order_id": "ORD-10023",
        "purchase_date": datetime.now().strftime("%Y-%m-%d"),
        "item_category": "Apparel",
        "return_status": "Delivered"
    }
    print("1. Standard Return Result:", evaluate_return_policy(test_order_1), "\n")

    # Test Case 2: Final Sale Item
    test_order_2 = {
        "order_id": "ORD-10024",
        "purchase_date": datetime.now().strftime("%Y-%m-%d"),
        "item_category": "Clearance / Intimate Wear",
        "return_status": "Delivered"
    }
    print("2. Final Sale Result:", evaluate_return_policy(test_order_2), "\n")

    # Test Case 3: Damaged Item
    print("3. Damaged Item Result:", evaluate_return_policy(test_order_1, return_reason="Item Arrived Damaged / Defective"), "\n")