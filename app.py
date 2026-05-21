from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# In-memory database for RoomieSync
roomiesync_data = {
    "roommates": ["Alex", "Sam", "Jamie"],
    "expenses": [
        {"id": 1, "description": "Groceries", "amount": 60.00, "paid_by": "Alex", "split_with": ["Alex", "Sam", "Jamie"]},
        {"id": 2, "description": "Dish Soap & Sponges", "amount": 15.00, "paid_by": "Sam", "split_with": ["Alex", "Sam", "Jamie"]}
    ],
    "chores": [
        {"id": 1, "title": "Clean the Kitchen", "assigned_to": "Jamie", "completed": False, "due_date": "Saturday"},
        {"id": 2, "title": "Take out Trash & Recycling", "assigned_to": "Sam", "completed": True, "due_date": "Today"},
        {"id": 3, "title": "Vacuum Living Room", "assigned_to": "Alex", "completed": False, "due_date": "Sunday"}
    ],
    "bills": [
        {"id": 1, "name": "WiFi Internet", "amount": 60.00, "due_date": "June 1st", "status": "Pending"},
        {"id": 2, "name": "Electricity Bill", "amount": 120.00, "due_date": "June 5th", "status": "Paid"}
    ],
    "rent": {
        "total": 1800.00,
        "shares": [
            {"name": "Alex", "amount": 600.00},
            {"name": "Sam", "amount": 600.00},
            {"name": "Jamie", "amount": 600.00}
        ]
    }
}

expense_id_counter = 3
chore_id_counter = 4
bill_id_counter = 3

# Helper function to calculate ledger balances (Who owes whom)
# If A paid $X split equally among N people, everyone else owes A ($X / N).
# We balance out all debts to find the net balance for each person.
def calculate_balances():
    balances = {name: 0.0 for name in roomiesync_data["roommates"]}
    
    for exp in roomiesync_data["expenses"]:
        paid_by = exp["paid_by"]
        amount = exp["amount"]
        split_with = exp["split_with"]
        
        if not split_with:
            continue
            
        share = amount / len(split_with)
        
        # The person who paid gets the full amount back
        balances[paid_by] += amount
        
        # Everyone who splits (including the payer) owes their share
        for name in split_with:
            if name in balances:
                balances[name] -= share
                
    return balances

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    balances = calculate_balances()
    response_data = {
        "roommates": roomiesync_data["roommates"],
        "expenses": roomiesync_data["expenses"],
        "chores": roomiesync_data["chores"],
        "bills": roomiesync_data["bills"],
        "rent": roomiesync_data["rent"],
        "balances": balances
    }
    return jsonify(response_data)

# Expenses Endpoint
@app.route("/api/expenses", methods=["POST"])
def add_expense():
    global expense_id_counter
    data = request.json
    if not data or not data.get("description") or not data.get("amount") or not data.get("paid_by"):
        return jsonify({"error": "Missing fields"}), 400
        
    new_expense = {
        "id": expense_id_counter,
        "description": data.get("description"),
        "amount": float(data.get("amount")),
        "paid_by": data.get("paid_by"),
        "split_with": data.get("split_with", roomiesync_data["roommates"])
    }
    roomiesync_data["expenses"].insert(0, new_expense)
    expense_id_counter += 1
    return jsonify(new_expense), 201

@app.route("/api/expenses/<int:exp_id>", methods=["DELETE"])
def delete_expense(exp_id):
    roomiesync_data["expenses"] = [e for e in roomiesync_data["expenses"] if e["id"] != exp_id]
    return jsonify({"success": True}), 200

# Chores Endpoints
@app.route("/api/chores", methods=["POST"])
def add_chore():
    global chore_id_counter
    data = request.json
    if not data or not data.get("title") or not data.get("assigned_to"):
        return jsonify({"error": "Title and assignee required"}), 400
        
    new_chore = {
        "id": chore_id_counter,
        "title": data.get("title"),
        "assigned_to": data.get("assigned_to"),
        "completed": False,
        "due_date": data.get("due_date", "Pending")
    }
    roomiesync_data["chores"].append(new_chore)
    chore_id_counter += 1
    return jsonify(new_chore), 201

@app.route("/api/chores/<int:chore_id>", methods=["PUT"])
def toggle_chore(chore_id):
    data = request.json
    for chore in roomiesync_data["chores"]:
        if chore["id"] == chore_id:
            chore["completed"] = data.get("completed", chore["completed"])
            return jsonify(chore), 200
    return jsonify({"error": "Chore not found"}), 404

@app.route("/api/chores/<int:chore_id>", methods=["DELETE"])
def delete_chore(chore_id):
    roomiesync_data["chores"] = [c for c in roomiesync_data["chores"] if c["id"] != chore_id]
    return jsonify({"success": True}), 200

# Bills Endpoints
@app.route("/api/bills", methods=["POST"])
def add_bill():
    global bill_id_counter
    data = request.json
    if not data or not data.get("name") or not data.get("amount"):
        return jsonify({"error": "Name and amount required"}), 400
        
    new_bill = {
        "id": bill_id_counter,
        "name": data.get("name"),
        "amount": float(data.get("amount")),
        "due_date": data.get("due_date", "Monthly"),
        "status": "Pending"
    }
    roomiesync_data["bills"].append(new_bill)
    bill_id_counter += 1
    return jsonify(new_bill), 201

@app.route("/api/bills/<int:bill_id>", methods=["PUT"])
def toggle_bill_status(bill_id):
    data = request.json
    for bill in roomiesync_data["bills"]:
        if bill["id"] == bill_id:
            bill["status"] = data.get("status", bill["status"])
            return jsonify(bill), 200
    return jsonify({"error": "Bill not found"}), 404

@app.route("/api/bills/<int:bill_id>", methods=["DELETE"])
def delete_bill(bill_id):
    roomiesync_data["bills"] = [b for b in roomiesync_data["bills"] if b["id"] != bill_id]
    return jsonify({"success": True}), 200

# Rent Calculator Endpoint
@app.route("/api/rent", methods=["POST"])
def calculate_rent():
    data = request.json
    if not data or not data.get("total"):
        return jsonify({"error": "Total rent is required"}), 400
        
    total_rent = float(data.get("total"))
    roomies = roomiesync_data["roommates"]
    share_amount = round(total_rent / len(roomies), 2)
    
    roomiesync_data["rent"] = {
        "total": total_rent,
        "shares": [{"name": name, "amount": share_amount} for name in roomies]
    }
    return jsonify(roomiesync_data["rent"]), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
