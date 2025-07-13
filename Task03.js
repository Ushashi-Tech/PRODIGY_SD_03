
        class ContactManager {
            constructor() {
                this.contacts = this.loadContacts();
                this.currentEditId = null;
                this.currentDeleteId = null;
                this.init();
            }

            init() {
                this.bindEvents();
                this.renderContacts();
                this.updateStats();
            }

            bindEvents() {
                document.getElementById('contactForm').addEventListener('submit', (e) => this.handleAddContact(e));
                document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
                document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
                document.getElementById('editForm').addEventListener('submit', (e) => this.handleEditContact(e));
                document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
                document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
                document.getElementById('confirmDelete').addEventListener('click', () => this.deleteContact());
            }

            loadContacts() {
                return JSON.parse(localStorage.getItem('contacts') || '[]');
            }

            saveContacts() {
                localStorage.setItem('contacts', JSON.stringify(this.contacts));
            }

            generateId() {
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            }

            validateForm(name, phone, email) {
                const errors = {};
                
                if (!name.trim()) {
                    errors.name = 'Name is required';
                } else if (name.trim().length < 2) {
                    errors.name = 'Name must be at least 2 characters';
                }

                if (!phone.trim()) {
                    errors.phone = 'Phone number is required';
                } else if (!/^\+?[\d\s\-\(\)]+$/.test(phone.trim())) {
                    errors.phone = 'Invalid phone number format';
                }

                if (!email.trim()) {
                    errors.email = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                    errors.email = 'Invalid email format';
                }

                return errors;
            }

            showErrors(errors, prefix = '') {
                ['name', 'phone', 'email'].forEach(field => {
                    const input = document.getElementById(prefix + field);
                    const errorElement = document.getElementById(prefix + field + 'Error');
                    const formGroup = input.parentElement;

                    if (errors[field]) {
                        formGroup.classList.add('error');
                        errorElement.textContent = errors[field];
                        errorElement.classList.add('show');
                    } else {
                        formGroup.classList.remove('error');
                        errorElement.classList.remove('show');
                    }
                });
            }

            clearErrors(prefix = '') {
                ['name', 'phone', 'email'].forEach(field => {
                    const input = document.getElementById(prefix + field);
                    const errorElement = document.getElementById(prefix + field + 'Error');
                    const formGroup = input.parentElement;

                    formGroup.classList.remove('error');
                    errorElement.classList.remove('show');
                });
            }

            handleAddContact(e) {
                e.preventDefault();
                
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                const email = document.getElementById('email').value;

                const errors = this.validateForm(name, phone, email);
                
                if (Object.keys(errors).length > 0) {
                    this.showErrors(errors);
                    return;
                }

                // Check for duplicate email
                if (this.contacts.some(contact => contact.email.toLowerCase() === email.toLowerCase())) {
                    this.showErrors({ email: 'Email already exists' });
                    return;
                }

                const newContact = {
                    id: this.generateId(),
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim(),
                    createdAt: new Date().toISOString()
                };

                this.contacts.push(newContact);
                this.saveContacts();
                this.renderContacts();
                this.updateStats();
                this.clearForm();
                this.clearErrors();
                
                this.showNotification('Contact added successfully!', 'success');
            }

            handleEditContact(e) {
                e.preventDefault();
                
                const name = document.getElementById('editName').value;
                const phone = document.getElementById('editPhone').value;
                const email = document.getElementById('editEmail').value;

                const errors = this.validateForm(name, phone, email);
                
                if (Object.keys(errors).length > 0) {
                    this.showErrors(errors, 'edit');
                    return;
                }

                // Check for duplicate email (excluding current contact)
                if (this.contacts.some(contact => 
                    contact.email.toLowerCase() === email.toLowerCase() && 
                    contact.id !== this.currentEditId)) {
                    this.showErrors({ email: 'Email already exists' }, 'edit');
                    return;
                }

                const contactIndex = this.contacts.findIndex(c => c.id === this.currentEditId);
                if (contactIndex !== -1) {
                    this.contacts[contactIndex] = {
                        ...this.contacts[contactIndex],
                        name: name.trim(),
                        phone: phone.trim(),
                        email: email.trim()
                    };
                    
                    this.saveContacts();
                    this.renderContacts();
                    this.closeEditModal();
                    this.showNotification('Contact updated successfully!', 'success');
                }
            }

            clearForm() {
                document.getElementById('contactForm').reset();
                this.clearErrors();
            }

            handleSearch(e) {
                const searchTerm = e.target.value.toLowerCase();
                this.renderContacts(searchTerm);
            }

            renderContacts(searchTerm = '') {
                const container = document.getElementById('contactsContainer');
                
                let filteredContacts = this.contacts;
                if (searchTerm) {
                    filteredContacts = this.contacts.filter(contact =>
                        contact.name.toLowerCase().includes(searchTerm) ||
                        contact.phone.includes(searchTerm) ||
                        contact.email.toLowerCase().includes(searchTerm)
                    );
                }

                if (filteredContacts.length === 0) {
                    const emptyMessage = searchTerm ? 
                        '<div class="empty-state"><h3>No contacts found</h3><p>Try adjusting your search terms.</p></div>' :
                        '<div class="empty-state"><h3>No contacts yet</h3><p>Add your first contact above to get started!</p></div>';
                    container.innerHTML = emptyMessage;
                    return;
                }

                const contactsGrid = document.createElement('div');
                contactsGrid.className = 'contacts-grid';

                filteredContacts.forEach(contact => {
                    const contactCard = document.createElement('div');
                    contactCard.className = 'contact-card';
                    contactCard.innerHTML = `
                        <div class="contact-info">
                            <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                            <div class="contact-detail">${this.escapeHtml(contact.phone)}</div>
                            <div class="contact-detail">${this.escapeHtml(contact.email)}</div>
                        </div>
                        <div class="contact-actions">
                            <button class="btn btn-secondary btn-small" onclick="contactManager.openEditModal('${contact.id}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="contactManager.openDeleteModal('${contact.id}')">Delete</button>
                        </div>
                    `;
                    contactsGrid.appendChild(contactCard);
                });

                container.innerHTML = '';
                container.appendChild(contactsGrid);
            }

            openEditModal(contactId) {
                const contact = this.contacts.find(c => c.id === contactId);
                if (!contact) return;

                this.currentEditId = contactId;
                document.getElementById('editName').value = contact.name;
                document.getElementById('editPhone').value = contact.phone;
                document.getElementById('editEmail').value = contact.email;
                
                this.clearErrors('edit');
                document.getElementById('editModal').style.display = 'block';
            }

            closeEditModal() {
                document.getElementById('editModal').style.display = 'none';
                this.currentEditId = null;
                this.clearErrors('edit');
            }

            openDeleteModal(contactId) {
                this.currentDeleteId = contactId;
                document.getElementById('deleteModal').style.display = 'block';
            }

            closeDeleteModal() {
                document.getElementById('deleteModal').style.display = 'none';
                this.currentDeleteId = null;
            }

            deleteContact() {
                if (!this.currentDeleteId) return;

                this.contacts = this.contacts.filter(c => c.id !== this.currentDeleteId);
                this.saveContacts();
                this.renderContacts();
                this.updateStats();
                this.closeDeleteModal();
                this.showNotification('Contact deleted successfully!', 'success');
            }

            updateStats() {
                const today = new Date().toDateString();
                const recentContacts = this.contacts.filter(contact => 
                    new Date(contact.createdAt).toDateString() === today
                ).length;

                document.getElementById('totalContacts').textContent = this.contacts.length;
                document.getElementById('recentContacts').textContent = recentContacts;
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            showNotification(message, type = 'success') {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${type === 'success' ? 'linear-gradient(45deg, #10b981, #059669)' : 'linear-gradient(45deg, #ef4444, #dc2626)'};
                    color: white;
                    padding: 15px 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    animation: slideInRight 0.3s ease-out;
                    font-weight: 500;
                `;
                
                notification.textContent = message;
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.animation = 'slideOutRight 0.3s ease-out';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }
        }

        // Add notification animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(300px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(300px);
                }
            }
        `;
        document.head.appendChild(style);

        // Initialize the Contact Manager
        const contactManager = new ContactManager();

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'editModal') {
                    contactManager.closeEditModal();
                } else if (e.target.id === 'deleteModal') {
                    contactManager.closeDeleteModal();
                }
            }
        });