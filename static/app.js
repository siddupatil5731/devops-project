// RoomieSync Local State
let state = {
    roommates: [],
    expenses: [],
    chores: [],
    bills: [],
    rent: { total: 0.0, shares: [] },
    balances: {}
};

document.addEventListener("DOMContentLoaded", () => {
    // Forms
    const expenseForm = document.getElementById("expense-form");
    const choreForm = document.getElementById("chore-form");
    const billForm = document.getElementById("bill-form");
    
    // Actions
    const recalcRentBtn = document.getElementById("recalc-rent-btn");

    // Recalculate Rent event
    recalcRentBtn.addEventListener("click", handleRentRecalculate);

    // Expense Form Submit
    expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const description = document.getElementById("exp-desc").value;
        const amount = parseFloat(document.getElementById("exp-amount").value);
        const paid_by = document.getElementById("exp-paidby").value;
        
        // Gather selected split roommates
        const split_with = [];
        document.querySelectorAll(".split-checkbox:checked").forEach(cb => {
            split_with.push(cb.value);
        });

        if (split_with.length === 0) {
            alert("Please select at least one roommate to split the expense with!");
            return;
        }

        try {
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, amount, paid_by, split_with })
            });

            if (response.ok) {
                expenseForm.reset();
                // Re-initialize splits checkboxes to check all by default
                document.querySelectorAll(".split-checkbox").forEach(cb => cb.checked = true);
                fetchDashboard();
            }
        } catch (error) {
            console.error("Error logging expense:", error);
        }
    });

    // Chore Form Submit
    choreForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const title = document.getElementById("new-chore-title").value;
        const assigned_to = document.getElementById("new-chore-assignee").value;
        const due_date = document.getElementById("new-chore-due").value;

        try {
            const response = await fetch("/api/chores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, assigned_to, due_date })
            });

            if (response.ok) {
                document.getElementById("new-chore-title").value = "";
                fetchDashboard();
            }
        } catch (error) {
            console.error("Error creating chore:", error);
        }
    });

    // Bill Form Submit
    billForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("new-bill-name").value;
        const amount = parseFloat(document.getElementById("new-bill-amount").value);
        const due_date = document.getElementById("new-bill-due").value;

        try {
            const response = await fetch("/api/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, amount, due_date })
            });

            if (response.ok) {
                document.getElementById("new-bill-name").value = "";
                document.getElementById("new-bill-amount").value = "";
                fetchDashboard();
            }
        } catch (error) {
            console.error("Error logging bill:", error);
        }
    });

    // Initial Dashboard Fetch
    fetchDashboard();
});

// Fetch all RoomieSync dashboard data from REST API
async function fetchDashboard() {
    try {
        const response = await fetch("/api/dashboard");
        state = await response.json();
        renderDashboard();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

// Render interface columns and widgets
function renderDashboard() {
    renderRoommateSelects();
    renderSplitCheckboxes();
    renderLedger();
    renderExpensesList();
    renderChoresList();
    renderBillsList();
    renderRentSplit();
}

// Render drop-downs for selectors
function renderRoommateSelects() {
    const paidBySelect = document.getElementById("exp-paidby");
    const assigneeSelect = document.getElementById("new-chore-assignee");

    const currentPaidByVal = paidBySelect.value;
    const currentAssigneeVal = assigneeSelect.value;

    paidBySelect.innerHTML = "";
    assigneeSelect.innerHTML = "";

    state.roommates.forEach(name => {
        // Paid By
        const opt1 = document.createElement("option");
        opt1.value = name;
        opt1.textContent = name;
        paidBySelect.appendChild(opt1);

        // Chore Assignee
        const opt2 = document.createElement("option");
        opt2.value = name;
        opt2.textContent = name;
        assigneeSelect.appendChild(opt2);
    });

    if (currentPaidByVal && state.roommates.includes(currentPaidByVal)) {
        paidBySelect.value = currentPaidByVal;
    }
    if (currentAssigneeVal && state.roommates.includes(currentAssigneeVal)) {
        assigneeSelect.value = currentAssigneeVal;
    }
}

// Render split checkboxes under expense form
function renderSplitCheckboxes() {
    const container = document.getElementById("split-checkboxes");
    // Only rebuild checkboxes if empty
    if (container.children.length > 0) return;

    container.innerHTML = "";
    state.roommates.forEach(name => {
        const label = document.createElement("label");
        label.className = "checkbox-label";
        label.innerHTML = `
            <input type="checkbox" class="split-checkbox" value="${name}" checked>
            <span>${name}</span>
        `;
        container.appendChild(label);
    });
}

// Render Ledger sheet of net balances
function renderLedger() {
    const ledgerContainer = document.getElementById("ledger-balances");
    ledgerContainer.innerHTML = "";

    Object.entries(state.balances).forEach(([name, bal]) => {
        const item = document.createElement("div");
        item.className = "ledger-item";
        
        let balClass = "settled";
        let balText = "Settled Up";

        if (bal > 0.01) {
            balClass = "owed";
            balText = `Owed $${bal.toFixed(2)}`;
        } else if (bal < -0.01) {
            balClass = "owes";
            balText = `Owes $${Math.abs(bal).toFixed(2)}`;
        }

        item.innerHTML = `
            <span class="ledger-name">${name}</span>
            <span class="ledger-balance ${balClass}">${balText}</span>
        `;
        ledgerContainer.appendChild(item);
    });
}

// Render History list of expenses
function renderExpensesList() {
    const list = document.getElementById("expenses-list");
    list.innerHTML = "";

    state.expenses.forEach(exp => {
        const row = document.createElement("div");
        row.className = "expense-item-row";
        
        const splitText = exp.split_with.length === state.roommates.length 
            ? "Split equally" 
            : `Split with ${exp.split_with.join(", ")}`;

        row.innerHTML = `
            <div class="expense-item-left">
                <span class="expense-item-title">${escapeHTML(exp.description)}</span>
                <span class="expense-item-meta">
                    Paid by <span class="expense-item-meta-paidby">${exp.paid_by}</span> • ${splitText}
                </span>
            </div>
            <div class="expense-item-right">
                <span class="expense-item-value">$${exp.amount.toFixed(2)}</span>
                <button class="btn-delete-row" onclick="deleteExpense(${exp.id})" title="Delete expense log">
                    &times;
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

// Delete Expense Handler
async function deleteExpense(id) {
    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: "DELETE"
        });
        if (response.ok) {
            fetchDashboard();
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
    }
}

// Render Chores check list
function renderChoresList() {
    const list = document.getElementById("chores-list");
    list.innerHTML = "";

    let doneCount = 0;
    const totalCount = state.chores.length;

    state.chores.forEach(chore => {
        if (chore.completed) doneCount++;

        const row = document.createElement("div");
        row.className = `chore-item-row ${chore.completed ? 'completed' : ''}`;
        
        row.innerHTML = `
            <div class="chore-item-left" onclick="toggleChoreStatus(${chore.id}, ${!chore.completed})">
                <span class="chore-checkbox"></span>
                <div class="chore-text-block">
                    <span class="chore-title">${escapeHTML(chore.title)}</span>
                    <span class="chore-meta">
                        Assigned: <span class="chore-assignee">${chore.assigned_to}</span> • Due: ${chore.due_date}
                    </span>
                </div>
            </div>
            <button class="btn-delete-row" onclick="deleteChore(${chore.id})" title="Remove chore">
                &times;
            </button>
        `;
        list.appendChild(row);
    });

    document.getElementById("chore-count").textContent = `${doneCount} / ${totalCount} Done`;
}

// Toggle Chore Status
async function toggleChoreStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/chores/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: newStatus })
        });
        if (response.ok) {
            fetchDashboard();
        }
    } catch (error) {
        console.error("Error updating chore:", error);
    }
}

// Delete Chore
async function deleteChore(id) {
    try {
        const response = await fetch(`/api/chores/${id}`, {
            method: "DELETE"
        });
        if (response.ok) {
            fetchDashboard();
        }
    } catch (error) {
        console.error("Error removing chore:", error);
    }
}

// Render Bills reminders list
function renderBillsList() {
    const list = document.getElementById("bills-list");
    list.innerHTML = "";

    state.bills.forEach(bill => {
        const row = document.createElement("div");
        row.className = "bill-item-row";
        
        let actionHTML = `<button class="btn-pay-bill" onclick="payBill(${bill.id})">Mark Paid</button>`;
        if (bill.status === "Paid") {
            actionHTML = `<span class="bill-paid-badge">Paid</span>`;
        }

        row.innerHTML = `
            <div class="bill-item-left">
                <div class="bill-title-block">
                    <span class="bill-name">${escapeHTML(bill.name)}</span>
                    <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
                </div>
                <span class="bill-due">Due: ${bill.due_date}</span>
            </div>
            <div class="bill-item-right">
                ${actionHTML}
                <button class="btn-delete-row" onclick="deleteBill(${bill.id})" title="Delete bill reminder">
                    &times;
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

// Mark Bill as Paid
async function payBill(id) {
    try {
        const response = await fetch(`/api/bills/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Paid" })
        });
        if (response.ok) {
            fetchDashboard();
        }
    } catch (error) {
        console.error("Error paying bill:", error);
    }
}

// Delete Bill
async function deleteBill(id) {
    try {
        const response = await fetch(`/api/bills/${id}`, {
            method: "DELETE"
        });
        if (response.ok) {
            fetchDashboard();
        }
    } catch (error) {
        console.error("Error deleting bill:", error);
    }
}

// Render Rent Split Calculator breakdowns
function renderRentSplit() {
    const list = document.getElementById("rent-shares-list");
    list.innerHTML = "";

    // Set input box value if not actively typing
    const rentTotalInput = document.getElementById("rent-total");
    if (document.activeElement !== rentTotalInput) {
        rentTotalInput.value = state.rent.total.toFixed(2);
    }

    state.rent.shares.forEach(share => {
        const row = document.createElement("div");
        row.className = "rent-share-row";
        row.innerHTML = `
            <span class="rent-share-name">${share.name}</span>
            <span class="rent-share-value">$${share.amount.toFixed(2)}</span>
        `;
        list.appendChild(row);
    });
}

// Handle Rent recalculate split POST
async function handleRentRecalculate() {
    const totalInput = document.getElementById("rent-total");
    const total = parseFloat(totalInput.value);

    if (isNaN(total) || total <= 0) {
        alert("Please enter a valid rent amount!");
        return;
    }

    try {
        const response = await fetch("/api/rent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ total })
        });
        if (response.ok) {
            fetchDashboard();
        }
    } catch (error) {
        console.error("Error splitting rent:", error);
    }
}

// Helper: Escape HTML string to block script injections
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
