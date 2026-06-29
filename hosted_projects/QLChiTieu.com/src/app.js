// Expense Tracker Application
class ExpenseTracker {
  constructor() {
    // Initialize properties
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.currentView = 'today';
    this.budget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
    this.currentChartType = 'doughnut'; // Default chart type
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.goals = JSON.parse(localStorage.getItem('goals')) || [];
    
    // DOM elements
    this.elements = {
      balance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses'),
      monthlySummary: document.getElementById('monthly-summary'),
      todayIncome: document.getElementById('today-income'),
      todayExpense: document.getElementById('today-expense'),
      transactionsList: document.getElementById('transactions-list'),
      addTransactionBtn: document.getElementById('add-transaction-btn'),
      modal: document.getElementById('transaction-modal'),
      transactionForm: document.getElementById('transaction-form'),
      searchInput: document.getElementById('search-input'),
      categoryFilter: document.getElementById('category-filter'),
      budgetInput: document.getElementById('budget-input'),
      setBudgetBtn: document.getElementById('set-budget-btn'),
      budgetProgress: document.getElementById('budget-progress'),
      budgetStatusText: document.getElementById('budget-status-text'),
      budgetPercentage: document.getElementById('budget-percentage'),
      exportCsvBtn: document.getElementById('export-csv-btn'),
      exportJsonBtn: document.getElementById('export-json-btn'),
      importCsvBtn: document.getElementById('import-csv-btn'),
      importJsonBtn: document.getElementById('import-json-btn'),
      exportExcelBtn: document.getElementById('export-excel-btn'),
      cancelBtn: document.getElementById('cancel-btn'),
      saveBtn: document.getElementById('save-btn'),
      tabs: document.querySelectorAll('.nav-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      chartTypeButtons: document.querySelectorAll('.chart-type-btn'),
      prevPageBtn: document.getElementById('prev-page'),
      nextPageBtn: document.getElementById('next-page'),
      pageInfo: document.querySelector('.pagination-controls .page-info'),
      goalsContainer: document.querySelector('.goals-content'),
      addSavingsBtn: document.getElementById('add-savings-btn'),
      savingsModal: document.getElementById('savings-modal'),
      savingsForm: document.getElementById('savings-form'),
      cancelSavingsBtn: document.getElementById('cancel-savings-btn'),
      closeSavingsModalBtn: document.getElementById('close-savings-modal-btn'),
      backupBtn: document.getElementById('backup-btn'),
      // New elements for real data
      incomeTrend: document.getElementById('income-trend'),
      expenseTrend: document.getElementById('expense-trend'),
      balanceTrend: document.getElementById('balance-trend'),
      budgetUsageText: document.getElementById('budget-usage-text'),
      warningCount: document.getElementById('warning-count'),
      savingsRate: document.getElementById('savings-rate'),
      spendingRate: document.getElementById('spending-rate'),
      budgetRate: document.getElementById('budget-rate'),
      savingsBar: document.getElementById('savings-bar'),
      spendingBar: document.getElementById('spending-bar'),
      budgetBar: document.getElementById('budget-bar'),
      statTotalTransactions: document.getElementById('stat-total-transactions'),
      statTotalCategories: document.getElementById('stat-total-categories'),
      statTotalGoals: document.getElementById('stat-total-goals')
    };

    // Professional category icons mapping
    this.categoryIcons = {
      food: '',
      transport: '',
      shopping: '',
      entertainment: '',
      utilities: '',
      health: '',
      education: '',
      other: '',
      income: '',
      expense: '',
      savings: '',
      salary: '',
      lucky_money: '',
      scholarship: '',
      allowance: '',
      other_income: '',
      transfer: ''
    };

    // Initialize the application
    this.init();
  }

  init() {
    // Set today's date as default for new transactions
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;

    // Check and apply saved theme
    this.applySavedTheme();

    // Bind event listeners
    this.bindEvents();

    // Render initial view
    this.render();
    
    // Update currency rates
    this.updateCurrencyRates();
    
    // Ensure summary cards are visible after animation
    setTimeout(() => {
      const summaryCards = document.querySelectorAll('.summary-card');
      summaryCards.forEach(card => {
        // Make sure the cards are visible after animation
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    }, 1000); // Wait for animations to complete

    // Render goals
    this.renderSavings();
    
    // Render advanced metrics
    this.calculateTrends();
    this.renderPerformanceMetrics();
    this.renderQuickStats();
  }

  bindEvents() {
    // Add transaction button
    this.elements.addTransactionBtn.addEventListener('click', () => {
      this.openModal();
    });

    // Form submission
    this.elements.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTransaction();
    });

    // Cancel button
    this.elements.cancelBtn.addEventListener('click', () => {
      this.closeModal();
    });

    // Search and filter
    this.elements.searchInput.addEventListener('input', () => {
      this.renderTransactions();
    });

    this.elements.categoryFilter.addEventListener('change', () => {
      this.renderTransactions();
    });

    // Budget controls
    this.elements.setBudgetBtn.addEventListener('click', () => {
      this.setMonthlyBudget();
    });

    // Export buttons
    this.elements.exportCsvBtn.addEventListener('click', () => {
      this.exportToCSV();
    });

    this.elements.exportExcelBtn.addEventListener('click', () => {
      this.exportToExcel();
    });

    // Tab navigation
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchView(tab.dataset.view);
      });
    });

    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Chart type buttons
    this.elements.chartTypeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chartType = e.currentTarget.dataset.chart;
        this.switchChartType(chartType);
      });
    });

    // Close modal when clicking outside
    this.elements.modal.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.closeModal();
      }
    });
    
    // Close modal with close button
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      this.closeModal();
    });
    
    // Export buttons
    this.elements.exportCsvBtn?.addEventListener('click', () => {
      this.exportToCSV();
    });
    
    this.elements.exportJsonBtn?.addEventListener('click', () => {
      this.exportToJSON();
    });
    
    // Import buttons
    this.elements.importCsvBtn?.addEventListener('click', () => {
      this.importFromCSV();
    });
    
    this.elements.importJsonBtn?.addEventListener('click', () => {
      this.importFromJSON();
    });
    
    // Add event listeners for currency formatting
    const amountInput = document.getElementById('transaction-amount');
    if (amountInput) {
      amountInput.addEventListener('input', (e) => {
        this.formatCurrencyInput(e.target);
      });
    }
    
    const budgetInput = document.getElementById('budget-input');
    if (budgetInput) {
      budgetInput.addEventListener('input', (e) => {
        this.formatCurrencyInput(e.target);
      });
    }

    // Savings inputs formatting
    ['savings-target', 'savings-current'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', (e) => this.formatCurrencyInput(e.target));
    });

    // Pagination
    this.elements.prevPageBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTransactions();
      }
    });

    this.elements.nextPageBtn?.addEventListener('click', () => {
      this.currentPage++;
      this.renderTransactions();
    });

    // Goals
    this.elements.addSavingsBtn?.addEventListener('click', () => this.openSavingsModal());
    
    this.elements.savingsForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSavings();
    });

    this.elements.cancelSavingsBtn?.addEventListener('click', () => this.closeSavingsModal());
    this.elements.closeSavingsModalBtn?.addEventListener('click', () => this.closeSavingsModal());
    
    // Close savings modal when clicking outside
    this.elements.savingsModal?.addEventListener('click', (e) => {
        if (e.target === this.elements.savingsModal) this.closeSavingsModal();
    });

    // Backup
    this.elements.backupBtn?.addEventListener('click', () => this.exportToJSON());
    document.getElementById('sync-data-btn')?.addEventListener('click', () => alert('Tính năng đồng bộ đám mây đang được phát triển!'));

    // Transaction type change
    const typeSelect = document.getElementById('transaction-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            this.updateCategoryOptions(e.target.value);
        });
    }
  }

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLightTheme = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
  }
  
  formatCurrencyInput(inputElement) {
    // Store the current cursor position
    let cursorPosition = inputElement.selectionStart;
    const oldLength = inputElement.value.length;
    
    // Remove any non-digit characters
    let value = inputElement.value.replace(/[^\d]/g, '');
    
    // Format with dots as thousand separators
    if (value) {
      const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      inputElement.value = formattedValue;
      
      // Calculate new cursor position after formatting
      const newLength = formattedValue.length;
      const diff = newLength - oldLength;
      const newCursorPos = cursorPosition + diff;
      
      // Restore cursor position
      setTimeout(() => {
        if (inputElement) {
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      // If value is empty, just clear the input
      inputElement.value = '';
    }
  }
  
  // Method to remove dots for processing
  removeCurrencyFormatting(value) {
    return value.replace(/\./g, '');
  }

  applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  }

  switchChartType(type) {
    this.currentChartType = type;
    
    // Update active button
    this.elements.chartTypeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.chart === type) {
        btn.classList.add('active');
      }
    });
    
    this.renderChart();
  }

  switchView(view) {
    this.currentView = view;
    
    // Update active tab
    this.elements.tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.view === view) {
        tab.classList.add('active');
      }
    });
    
    this.render();
  }

  openModal(transaction = null) {
    // Open Modal
    const modalTitle = document.getElementById('modal-title');
    const amountInput = document.getElementById('transaction-amount');
    const categorySelect = document.getElementById('transaction-category');
    const dateInput = document.getElementById('transaction-date');
    const noteTextarea = document.getElementById('transaction-note');
    const typeSelect = document.getElementById('transaction-type'); // Added transaction type

    if (transaction) {
      // Editing existing transaction
      modalTitle.textContent = 'Sửa giao dịch';
      // Format the amount with dots when loading into the input
      amountInput.value = this.formatCurrency(transaction.amount);
      dateInput.value = transaction.date;
      noteTextarea.value = transaction.note || '';
      typeSelect.value = transaction.type || 'expense'; // Set transaction type
      this.updateCategoryOptions(typeSelect.value, transaction.category);
      
      // Store transaction ID for update
      this.editingTransactionId = transaction.id;
    } else {
      // Adding new transaction
      modalTitle.textContent = 'Thêm giao dịch mới';
      this.elements.transactionForm.reset();
      dateInput.value = new Date().toISOString().split('T')[0];
      typeSelect.value = 'expense'; // Default to expense
      this.updateCategoryOptions('expense');
      this.editingTransactionId = null;
    }

    this.elements.modal.classList.add('active');
  }

  updateCategoryOptions(type, selectedCategory = null) {
    const categorySelect = document.getElementById('transaction-category');
    if (!categorySelect) return;

    categorySelect.innerHTML = '';

    if (type === 'savings') {
        if (this.goals.length === 0) {
             const option = document.createElement('option');
             option.value = "";
             option.textContent = "Chưa có mục tiêu (Hãy tạo mới)";
             categorySelect.appendChild(option);
        } else {
            this.goals.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal.id;
                option.textContent = goal.name;
                if (selectedCategory && (goal.id == selectedCategory)) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });
        }
    } else if (type === 'income') {
        const categories = [
            { value: '', text: 'Chọn danh mục' },
            { value: 'salary', text: 'Lương' },
            { value: 'lucky_money', text: 'Lì xì' },
            { value: 'scholarship', text: 'Học bổng' },
            { value: 'allowance', text: 'Trợ cấp' },
            { value: 'other_income', text: 'Khác' }
        ];

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.text;
            if (selectedCategory && (cat.value == selectedCategory)) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    } else {
        const categories = [
            { value: '', text: 'Chọn danh mục' },
            { value: 'food', text: 'Ăn uống' },
            { value: 'transport', text: 'Di chuyển' },
            { value: 'shopping', text: 'Mua sắm' },
            { value: 'entertainment', text: 'Giải trí' },
            { value: 'utilities', text: 'Tiện ích' },
            { value: 'health', text: 'Sức khỏe' },
            { value: 'education', text: 'Giáo dục' },
            { value: 'other', text: 'Khác' },
            { value: 'transfer', text: 'Gửi tiền' }
        ];

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.text;
            if (selectedCategory && (cat.value == selectedCategory)) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    }
  }

  closeModal() {
    this.elements.modal.classList.remove('active');
    this.editingTransactionId = null;
  }

  openSavingsModal() {
    this.elements.savingsModal.classList.add('active');
  }

  closeSavingsModal() {
    this.elements.savingsModal.classList.remove('active');
    this.elements.savingsForm.reset();
  }

  saveSavings() {
    const name = document.getElementById('savings-name').value;
    const target = parseFloat(this.removeCurrencyFormatting(document.getElementById('savings-target').value));
    const current = parseFloat(this.removeCurrencyFormatting(document.getElementById('savings-current').value));

    if (!name || isNaN(target) || target <= 0) {
        alert('Vui lòng nhập thông tin hợp lệ!');
        return;
    }

    const newGoal = {
        id: Date.now(),
        name,
        target,
        current: isNaN(current) ? 0 : current
    };

    this.goals.push(newGoal);
    this.saveGoals();
    this.closeSavingsModal();
    this.renderQuickStats();
  }

  saveTransaction() {
    // Get the raw amount value and clean it
    const rawAmount = document.getElementById('transaction-amount').value;
    // Remove dots and any non-digit characters except decimal point
    const cleanAmountStr = rawAmount.replace(/[^\d]/g, '');
    const amount = parseFloat(cleanAmountStr);
    
    const category = document.getElementById('transaction-category').value;
    const date = document.getElementById('transaction-date').value;
    const note = document.getElementById('transaction-note').value.trim();
    const type = document.getElementById('transaction-type').value; // Added transaction type

    if (isNaN(amount) || amount < 0 || !category || !date) {
      alert('Vui lòng điền đầy đủ thông tin hợp lệ!');
      return;
    }

    if (this.editingTransactionId) {
      // Update existing transaction
      const index = this.transactions.findIndex(t => t.id === this.editingTransactionId);
      if (index !== -1) {
        this.transactions[index] = {
          ...this.transactions[index],
          amount,
          category,
          date,
          note,
          type
        };
      }
    } else {
      // Add new transaction
      const newTransaction = {
        id: Date.now(),
        amount,
        category,
        date,
        note,
        type
      };
      this.transactions.push(newTransaction);

      if (type === 'savings') {
          const goal = this.goals.find(g => g.id == category);
          if (goal) {
              goal.current += amount;
              this.saveGoals();
          }
      }
    }

    // Save to localStorage
    this.saveToStorage();

    // Close modal and refresh UI
    this.closeModal();
    this.render();
    this.calculateTrends();
    this.renderPerformanceMetrics();
    this.renderQuickStats();
  }

  deleteTransaction(id) {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.saveToStorage();
      this.render();
      this.calculateTrends();
      this.renderPerformanceMetrics();
      this.renderQuickStats();
    }
  }

  setMonthlyBudget() {
    // Get the raw budget value and clean it
    const rawBudget = this.elements.budgetInput.value;
    // Remove dots and any non-digit characters
    const cleanBudgetStr = rawBudget.replace(/[^\d]/g, '');
    const budgetValue = parseFloat(cleanBudgetStr);
    
    if (isNaN(budgetValue) || budgetValue <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    this.budget = budgetValue;
    localStorage.setItem('monthlyBudget', this.budget);
    this.updateBudgetDisplay();
    this.renderPerformanceMetrics();
  }
  
  saveGoals() {
    localStorage.setItem('goals', JSON.stringify(this.goals));
    this.renderSavings();
  }

  updateBudgetDisplay() {
    if (this.budget <= 0) {
      this.elements.budgetStatusText.textContent = 'Chưa đặt hạn mức';
      this.elements.budgetProgress.style.width = '0%';
      this.elements.budgetPercentage.textContent = '0%';
      return;
    }

    const monthlyExpenses = this.getExpensesForCurrentMonth();
    const percentage = Math.min((monthlyExpenses / this.budget) * 100, 100);

    this.elements.budgetProgress.style.width = `${percentage}%`;
    this.elements.budgetPercentage.textContent = `${Math.round(percentage)}%`;
    
    if (percentage >= 90) {
      this.elements.budgetProgress.style.background = 'var(--danger-color)';
      this.elements.budgetStatusText.textContent = `Cảnh báo: Đã sử dụng ${percentage.toFixed(1)}% hạn mức`;
    } else if (percentage >= 70) {
      this.elements.budgetProgress.style.background = 'var(--warning-color)';
      this.elements.budgetStatusText.textContent = `Đã sử dụng ${percentage.toFixed(1)}% hạn mức`;
    } else {
      this.elements.budgetProgress.style.background = 'var(--primary-color)';
      this.elements.budgetStatusText.textContent = `Còn ${((this.budget - monthlyExpenses) / 1000).toFixed(1)}k để chi tiêu`;
    }
    
    if (this.elements.budgetUsageText) {
        this.elements.budgetUsageText.textContent = `${Math.round(percentage)}%`;
    }
  }

  getExpensesForCurrentMonth() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return this.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear &&
          t.type === 'expense' &&
          t.category !== 'transfer'
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  render() {
    this.renderBalance();
    this.renderSummaryCards();
    this.renderTransactions();
    this.renderChart();
    this.updateBudgetDisplay();
    this.checkBudgetWarnings();
  }

  calculateTrends() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Previous month logic
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = currentYear - 1;
    }

    const getMonthTotal = (month, year, type) => {
        return this.transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year && t.type === type;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    };

    const currIncome = getMonthTotal(currentMonth, currentYear, 'income');
    const prevIncome = getMonthTotal(prevMonth, prevYear, 'income');
    const currExpense = getMonthTotal(currentMonth, currentYear, 'expense');
    const prevExpense = getMonthTotal(prevMonth, prevYear, 'expense');

    const calcTrend = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    const incomeTrendVal = calcTrend(currIncome, prevIncome);
    const expenseTrendVal = calcTrend(currExpense, prevExpense);
    
    // Update UI
    const updateTrendUI = (element, value, isInverse = false) => {
        if (!element) return;
        const isPositive = value >= 0;
        // For expense, positive increase is usually "bad" (red), so we might want to inverse color logic
        // But standard UI: Green = Up, Red = Down. Let's stick to standard but use colors semantically.
        // Actually, for expense: Red if Up, Green if Down is better UX.
        
        let colorClass = isPositive ? 'positive' : 'negative';
        if (isInverse) colorClass = isPositive ? 'negative' : 'positive'; // Expense: Up is bad (negative class usually red)

        element.className = `trend ${colorClass}`;
        element.innerHTML = `${Math.abs(value).toFixed(1)}%`;
    };

    updateTrendUI(this.elements.incomeTrend, incomeTrendVal);
    updateTrendUI(this.elements.expenseTrend, expenseTrendVal, true);
    
    // Balance Trend (Total Balance change)
    // Simplified: Just comparing (Income - Expense) of this month vs last month
    const currBalance = currIncome - currExpense;
    const prevBalance = prevIncome - prevExpense;
    const balanceTrendVal = calcTrend(currBalance, prevBalance);
    
    if (this.elements.balanceTrend) {
        const isPos = balanceTrendVal >= 0;
        this.elements.balanceTrend.className = `trend-indicator ${isPos ? 'positive' : 'negative'}`;
        this.elements.balanceTrend.innerHTML = `${Math.abs(balanceTrendVal).toFixed(1)}%`;
    }
  }

  renderPerformanceMetrics() {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyIncome = this.transactions
          .filter(t => {
              const d = new Date(t.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'income';
          })
          .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpense = this.transactions
          .filter(t => {
              const d = new Date(t.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Savings Rate
      let savingsRate = 0;
      if (monthlyIncome > 0) {
          savingsRate = ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100;
      }
      // Cap at 0-100 for bar, but allow negative for text
      const savingsBarWidth = Math.max(0, Math.min(100, savingsRate));
      
      if (this.elements.savingsRate) this.elements.savingsRate.textContent = `${savingsRate.toFixed(1)}%`;
      if (this.elements.savingsBar) this.elements.savingsBar.style.width = `${savingsBarWidth}%`;

      // Spending Rate (vs Income)
      let spendingRate = 0;
      if (monthlyIncome > 0) {
          spendingRate = (monthlyExpense / monthlyIncome) * 100;
      }
      if (this.elements.spendingRate) this.elements.spendingRate.textContent = `${spendingRate.toFixed(1)}%`;
      if (this.elements.spendingBar) this.elements.spendingBar.style.width = `${Math.min(100, spendingRate)}%`;

      // Budget Usage Rate
      let budgetRate = 0;
      if (this.budget > 0) {
          budgetRate = (monthlyExpense / this.budget) * 100;
      }
      if (this.elements.budgetRate) this.elements.budgetRate.textContent = `${budgetRate.toFixed(1)}%`;
      if (this.elements.budgetBar) this.elements.budgetBar.style.width = `${Math.min(100, budgetRate)}%`;
  }

  checkBudgetWarnings() {
      // Simple logic: Count categories where expense > 0. 
      // In a real app, you'd have per-category budgets.
      // Here we'll just count categories that take up > 30% of total expenses as a "Warning" or "High Spending"
      const expenses = this.getExpensesByCategory();
      const totalExpense = Object.values(expenses).reduce((a, b) => a + b, 0);
      
      let warnings = 0;
      if (totalExpense > 0) {
          Object.values(expenses).forEach(amount => {
              if ((amount / totalExpense) > 0.3) warnings++;
          });
      }
      
      if (this.elements.warningCount) this.elements.warningCount.textContent = warnings;
  }
  
  getExpensesByCategory() {
      const expenses = {};
      this.transactions.forEach(t => {
          if (t.type === 'expense') {
              expenses[t.category] = (expenses[t.category] || 0) + Math.abs(t.amount);
          }
           
          if (t.type === 'savings') {
              // For savings, also track the amount (already positive, not expense)
              expenses[t.category] = (expenses[t.category] || 0) + Math.abs(t.amount);
          }

      });
      return expenses;
  }

  renderQuickStats() {
      if (this.elements.statTotalTransactions) {
          this.elements.statTotalTransactions.textContent = this.transactions.length;
      }
      if (this.elements.statTotalCategories) {
          const uniqueCategories = new Set(this.transactions.map(t => t.category));
          this.elements.statTotalCategories.textContent = uniqueCategories.size;
      }
      if (this.elements.statTotalGoals) {
          this.elements.statTotalGoals.textContent = this.goals.length;
      }
  }

  renderBalance() {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense' || t.type === 'savings')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = totalIncome - totalExpenses;
    this.elements.balance.textContent = this.formatCurrency(balance);
    
    // Calculate today's income and expenses
    const today = new Date().toISOString().split('T')[0];
    const todayIncome = this.transactions
      .filter(t => t.type === 'income' && t.date === today)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const todayExpenses = this.transactions
      .filter(t => (t.type === 'expense' || t.type === 'savings') && t.date === today)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    if (this.elements.todayIncome) {
      this.elements.todayIncome.textContent = this.formatCurrency(todayIncome);
    }
    
    if (this.elements.todayExpense) {
      this.elements.todayExpense.textContent = this.formatCurrency(todayExpenses);
    }
  }

  renderSummaryCards() {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense' || t.type === 'savings')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate monthly summary
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyIncome = this.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear &&
          t.type === 'income'
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = this.transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear &&
          (t.type === 'expense' || t.type === 'savings')
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlySummary = monthlyIncome - monthlyExpenses;

    // Update summary cards
    this.elements.totalIncome.textContent = this.formatCurrency(totalIncome);
    this.elements.totalExpenses.textContent = this.formatCurrency(totalExpenses);
    this.elements.monthlySummary.textContent = this.formatCurrency(monthlySummary);
  }

  renderTransactions() {
    // Get filtered transactions based on search and category filters
    let filteredTransactions = [...this.transactions];

    // Sort by date (newest first) BEFORE filtering by view to ensure correct order
    // Note: The original code sorted after filtering, but sorting first is usually safer for consistency
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Apply search filter
    const searchTerm = this.elements.searchInput.value.toLowerCase();
    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.note.toLowerCase().includes(searchTerm) ||
        this.formatCurrency(Math.abs(t.amount)).includes(searchTerm)
      );
    }

    // Apply category filter
    const selectedCategory = this.elements.categoryFilter.value;
    if (selectedCategory) {
      filteredTransactions = filteredTransactions.filter(t => t.category === selectedCategory);
    }

    // Filter by current view
    const now = new Date();
    switch (this.currentView) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filteredTransactions = filteredTransactions.filter(t => t.date === today);
        break;
      case 'week':
        // Calculate start of current week (Monday)
        const day = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(now.setDate(diff));
        monday.setHours(0,0,0,0);
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= monday);
        break;
      case 'month':
        const month = now.getMonth();
        const yearForMonth = now.getFullYear();
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === month &&
                 transactionDate.getFullYear() === yearForMonth;
        });
        break;
      case 'year':
        const year = now.getFullYear();
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getFullYear() === year;
        });
        break;
      case 'all':
        // Show all transactions, no additional filtering needed
        break;
    }

    // Pagination Logic
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
    
    // Ensure current page is valid
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Update Page Info
    if (this.elements.pageInfo) this.elements.pageInfo.textContent = `${this.currentPage} / ${totalPages}`;

    // Show message if no transactions
    if (paginatedTransactions.length === 0) {
      this.elements.transactionsList.innerHTML = '<p>Không có giao dịch nào phù hợp</p>';
    } else {
      // Render transactions
      this.elements.transactionsList.innerHTML = paginatedTransactions.map(transaction => {
        const formattedAmount = this.formatCurrency(Math.abs(transaction.amount));
        const typeClass = transaction.type === 'income' ? 'income' : 'expense';

        return `
          <div class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-details">
                <div>
                  <div>${transaction.note || 'Không có ghi chú'}</div>
                  <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
              </div>
            </div>
            <div class="transaction-amount ${typeClass}">
              ${transaction.type === 'income' ? '+' : '-'}${formattedAmount}
            </div>
            <div class="transaction-actions">
              <button onclick="expenseTracker.openModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" class="btn-secondary" aria-label="Sửa giao dịch">
                Sửa
              </button>
              <button onclick="expenseTracker.deleteTransaction(${transaction.id})" class="btn-secondary" style="background: var(--danger-color);" aria-label="Xóa giao dịch">
                Xóa
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderChart() {
    // Calculate expenses by category
    const expensesByCategory = {};
    
    this.transactions.forEach(t => {
      if (t.type === 'expense' || t.type === 'savings') {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      }
    });

    const categories = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    
    // Destroy existing chart if it exists
    if (window.expenseChart instanceof Chart) {
      window.expenseChart.destroy();
    }

    // Create the chart
    const ctx = document.getElementById('expense-chart').getContext('2d');
    window.expenseChart = new Chart(ctx, {
      type: this.currentChartType,
      data: {
        labels: categories.map(cat => this.getCategoryName(cat)),
        datasets: [{
          label: 'Chi tiêu',
          data: data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: (this.currentChartType === 'bar' || this.currentChartType === 'line') ? {
            y: { beginAtZero: true }
        } : {},
        plugins: {
          legend: {
            position: 'bottom',
            display: this.currentChartType === 'doughnut' || this.currentChartType === 'pie'
          }
        }
      }
    });
  }

  renderSavings() {
    if (!this.elements.goalsContainer) return;
    
    if (this.goals.length === 0) {
        this.elements.goalsContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding: 20px;">Chưa có mục tiêu nào</p>';
        return;
    }

    this.elements.goalsContainer.innerHTML = this.goals.map((goal, index) => {
        const percentage = Math.min((goal.current / goal.target) * 100, 100);
        return `
            <div class="goal-item">
                <div class="goal-header" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="goal-name" style="font-weight: 600;">${goal.name}</span>
                    <button onclick="expenseTracker.deleteGoal(${index})" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;" aria-label="Xóa">Xóa</button>
                </div>
                <div class="goal-info" style="display: flex; justify-content: space-between; font-size: 0.9em; color: var(--text-secondary); margin-bottom: 5px;">
                    <p class="goal-amount">${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}</p>
                    <span class="goal-percent">${Math.round(percentage)}%</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar" style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                        <div class="progress-fill" style="width: ${percentage}%; height: 100%; background: var(--success-color); transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
  }

  deleteGoal(index) {
      if (confirm('Xóa mục tiêu này?')) {
          this.goals.splice(index, 1);
          this.saveGoals();
          this.renderQuickStats();
      }
  }

  getCategoryName(category) {
    const goal = this.goals.find(g => g.id == category);
    if (goal) return `Tiết kiệm: ${goal.name}`;

    const names = {
      food: 'Ăn uống',
      transport: 'Di chuyển',
      shopping: 'Mua sắm',
      entertainment: 'Giải trí',
      utilities: 'Tiện ích',
      health: 'Sức khỏe',
      education: 'Giáo dục',
      other: 'Khác',
      salary: 'Lương',
      lucky_money: 'Lì xì',
      scholarship: 'Học bổng',
      allowance: 'Trợ cấp',
      other_income: 'Thu nhập khác',
      transfer: 'Gửi tiền'
    };
    return names[category] || category;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  saveToStorage() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  exportToCSV() {
    if (this.transactions.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    let csvContent = '\ufeffID,Số tiền,Danh mục,Ngày,Ghi chú,Loại\n';
    this.transactions.forEach(t => {
      const row = [
        t.id,
        t.amount,
        this.getCategoryName(t.category),
        t.date,
        `"${t.note || ''}"`,
        t.type
      ].join(',');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qlchitieu_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToExcel() {
    if (this.transactions.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    // Simple HTML Table export which Excel can open
    let tableContent = '<table><thead><tr><th>ID</th><th>Số tiền</th><th>Danh mục</th><th>Ngày</th><th>Ghi chú</th><th>Loại</th></tr></thead><tbody>';
    
    this.transactions.forEach(t => {
        tableContent += `<tr><td>${t.id}</td><td>${t.amount}</td><td>${this.getCategoryName(t.category)}</td><td>${t.date}</td><td>${t.note}</td><td>${t.type}</td></tr>`;
    });
    tableContent += '</tbody></table>';

    const blob = new Blob(['\ufeff', tableContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qlchitieu_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToJSON() {
      const dataStr = JSON.stringify(this.transactions, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_qlchitieu_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  importFromJSON() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = event => {
              try {
                  const data = JSON.parse(event.target.result);
                  if (Array.isArray(data)) {
                      if(confirm(`Tìm thấy ${data.length} giao dịch. Bạn có muốn thay thế dữ liệu hiện tại không?`)) {
                          this.transactions = data;
                          this.saveToStorage();
                          this.render();
                          alert('Nhập dữ liệu thành công!');
                      }
                  } else {
                      alert('File JSON không hợp lệ!');
                  }
              } catch (err) {
                  alert('Lỗi đọc file JSON!');
              }
          };
          reader.readAsText(file);
      };
      input.click();
  }

  importFromCSV() {
      alert('Tính năng nhập CSV đang được hoàn thiện. Vui lòng sử dụng JSON để sao lưu và phục hồi.');
  }

  async updateCurrencyRates() {
    try {
        // Use a free API to get real rates. Base is usually USD.
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data && data.rates) {
            const vndRate = data.rates.VND;
            const eurRate = data.rates.EUR;
            const jpyRate = data.rates.JPY;

            // Calculate rates relative to VND
            // 1 USD = vndRate VND
            // 1 EUR = (vndRate / eurRate) VND
            // 1 JPY = (vndRate / jpyRate) VND

            document.getElementById('usd-rate').textContent = this.formatCurrency(vndRate).replace('₫', '').trim();
            document.getElementById('eur-rate').textContent = this.formatCurrency(vndRate / eurRate).replace('₫', '').trim();
            document.getElementById('jpy-rate').textContent = this.formatCurrency(vndRate / jpyRate).replace('₫', '').trim();
        }
    } catch (error) {
        console.error('Failed to fetch currency rates:', error);
        // Fallback to static if offline
        document.getElementById('usd-rate').textContent = '25.450';
        document.getElementById('eur-rate').textContent = '27.100';
        document.getElementById('jpy-rate').textContent = '165';
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.expenseTracker = new ExpenseTracker();
});
