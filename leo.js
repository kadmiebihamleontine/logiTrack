
// Données étendues
const stockData = [
    { 
        id: 1,
        name: "Boîtes de Transport", 
        quantity: 150, 
        threshold: 100,
        category: "Emballage",
        lastDelivery: "2023-05-15",
        supplier: "LogiBox Inc."
    },
    { 
        id: 2,
        name: "Palettes Européennes", 
        quantity: 10, 
        threshold: 20,
        category: "Transport",
        lastDelivery: "2023-06-01",
        supplier: "EuroPalettes"
    },
    { 
        id: 3,
        name: "Roues pour Chariots", 
        quantity: 0, 
        threshold: 30,
        category: "Équipement",
        lastDelivery: "2023-04-10",
        supplier: "MobilityParts"
    },
    { 
        id: 4,
        name: "Sangles de Sécurité", 
        quantity: 45, 
        threshold: 50,
        category: "Sécurité",
        lastDelivery: "2023-05-28",
        supplier: "SafeTransit"
    },
    { 
        id: 5,
        name: "Film Étirable", 
        quantity: 80, 
        threshold: 60,
        category: "Emballage",
        lastDelivery: "2023-06-10",
        supplier: "PackMaster"
    },
    { 
        id: 6,
        name: "Gants de Manutention", 
        quantity: 5, 
        threshold: 40,
        category: "Sécurité",
        lastDelivery: "2023-05-05",
        supplier: "SafeHands"
    }
];

// Afficher les produits
function displayStocks(filter = 'all') {
    const stockTable = document.getElementById('stockTable');
    stockTable.innerHTML = '';
    
    let filteredData = stockData;
    
    if (filter === 'green') {
        filteredData = stockData.filter(p => p.quantity >= p.threshold);
    } else if (filter === 'orange') {
        filteredData = stockData.filter(p => p.quantity < p.threshold && p.quantity > 0);
    } else if (filter === 'red') {
        filteredData = stockData.filter(p => p.quantity === 0);
    }
    
    filteredData.forEach(product => {
        const status = getStatus(product);
        const progressPercent = Math.min((product.quantity / product.threshold) * 100, 100);
        
        const productCard = document.createElement('div');
        productCard.className = `product-card ${status.class}`;
        productCard.style.setProperty('--status-color', status.color);
        if (status.class === 'red') productCard.classList.add('critical');
        
        productCard.innerHTML = `
            <div class="product-header">
                <div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-category">${product.category} • ${product.supplier}</div>
                </div>
                <div style="color: ${status.color}">
                    <i class="fas ${status.icon} fa-2x"></i>
                </div>
            </div>
            
            <div class="stock-info">
                <div>
                    <span style="font-size: 1.5rem; font-weight: bold;">${product.quantity}</span>
                    <span style="opacity: 0.7;">/ ${product.threshold} unités</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progressPercent}%; background: ${status.color}"></div>
                </div>
            </div>
            
            <div class="product-footer">
                <div class="last-delivery">
                    <i class="fas fa-truck"></i> Livré le ${product.lastDelivery}
                </div>
                <div class="product-actions">
                    <button class="action-btn" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="showProductDetails(${product.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `;
        
        stockTable.appendChild(productCard);
    });
    
    updateStats();
}

// Obtenir le statut
function getStatus(product) {
    if (product.quantity === 0) {
        return {
            class: 'red',
            color: 'var(--red)',
            icon: 'fa-times-circle'
        };
    }
    if (product.quantity < product.threshold) {
        return {
            class: 'orange',
            color: 'var(--orange)',
            icon: 'fa-exclamation-triangle'
        };
    }
    return {
        class: 'green',
        color: 'var(--green)',
        icon: 'fa-check-circle'
    };
}

// Mettre à jour les statistiques
function updateStats() {
    document.getElementById('totalProducts').textContent = stockData.length;
    document.getElementById('inStockCount').textContent = 
        stockData.filter(p => p.quantity >= p.threshold).length;
    document.getElementById('lowStockCount').textContent = 
        stockData.filter(p => p.quantity < p.threshold && p.quantity > 0).length;
    document.getElementById('outOfStockCount').textContent = 
        stockData.filter(p => p.quantity === 0).length;
}

// Filtrer les stocks
function filterStocks(status) {
    // Mettre à jour les onglets actifs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (status === 'all') document.getElementById('allTab').classList.add('active');
    if (status === 'green') document.getElementById('inStockTab').classList.add('active');
    if (status === 'orange') document.getElementById('lowStockTab').classList.add('active');
    if (status === 'red') document.getElementById('outOfStockTab').classList.add('active');
    
    displayStocks(status);
}

// Animation au scroll
function handleScroll() {
    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            el.classList.add('visible');
        }
    });
}

// Événements
window.addEventListener('load', () => {
    displayStocks();
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Pour les éléments déjà visibles
});

// Fonctions à implémenter
function editProduct(id) {
    console.log(`Éditer produit ${id}`);
    // À compléter
}

function showProductDetails(id) {
    console.log(`Détails produit ${id}`);
    // À compléter
}

// Fonction pour la newsletter (à compléter)
function showNewsletterForm() {
    alert("Fonctionnalité newsletter à implémenter !");
    // Idée : Afficher un modal avec un formulaire
}
