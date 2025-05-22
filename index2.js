const BookStore = {
    getCart() {
        return JSON.parse(localStorage.getItem('bookstore-cart') || '[]');
    },
    saveCart(cart) {
        localStorage.setItem('bookstore-cart', JSON.stringify(cart));
    }
};

const app = Vue.createApp({
    data() {
        return {
            currentView: 'books',
            selectedBook: null,
            books: [],
            searchParams: {
                title: '',
                author: '',
                category: '',
                priceRange: ''
            },
            cart: BookStore.getCart(),
            checkoutInfo: {
                name: '',
                email: '',
                address: '',
                cardNumber: '',
                expiryDate: '',
                cvc: ''
            }
        };
    },

    computed: {
        categories() {
            return [...new Set(this.books.map(b => b.category))];
        },

        filteredBooks() {
            return this.books.filter(book => {
                const titleMatch = book.title.toLowerCase().includes(
                    this.searchParams.title.toLowerCase()
                );
                const authorMatch = book.author.toLowerCase().includes(
                    this.searchParams.author.toLowerCase()
                );
                const categoryMatch = !this.searchParams.category ||
                    book.category === this.searchParams.category;
                const priceMatch = this.checkPrice(book.price);

                return titleMatch && authorMatch && categoryMatch && priceMatch;
            });
        },

        cartItems() {
            return this.cart.map(cartItem => {
                const book = this.books.find(b => b.id === cartItem.id);
                return book ? { ...book, quantity: cartItem.quantity } : null;
            }).filter(Boolean);
        },

        cartTotalCount() {
            return this.cart.reduce((sum, item) => sum + item.quantity, 0);
        },

        cartTotalPrice() {
            return this.cartItems.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0);
        }
    },

    methods: {
        async loadBooks() {
            try {
                const response = await axios.get('./books.json');
                this.books = response.data.map(book => ({
                    ...book,
                    image: book.image || './images/default-book.jpg',
                    description: book.description || '暂无详细描述',
                    publishDate: book.publishDate || '未知日期'
                }));
            } catch (error) {
                console.error('加载书籍出错:', error);
                this.books = [];
            }
        },
        showBookDetail(book) {
            this.selectedBook = { ...book };
            this.currentView = 'detail';
        },
        checkPrice(price) {
            switch (this.searchParams.priceRange) {
                case 'low': return price < 30;
                case 'mid': return price >= 30 && price <= 80;
                case 'high': return price > 80;
                default: return true;
            }
        },
        toggleView(view) {
            this.currentView = view;
        },
        handleImageError(e) {
            e.target.src = './images/default-book.jpg';
        },
        addToCart(bookId) {
            const existing = this.cart.find(item => item.id === bookId);
            if (existing) {
                existing.quantity++;
            } else {
                this.cart.push({ id: bookId, quantity: 1 });
            }
            BookStore.saveCart(this.cart);
        },
        updateQuantity(bookId, delta) {
            const item = this.cart.find(item => item.id === bookId);
            if (item) {
                item.quantity = Math.max(0, item.quantity + delta);
                if (item.quantity === 0) {
                    this.cart = this.cart.filter(i => i.id !== bookId);
                }
                BookStore.saveCart(this.cart);
            }
        },
        removeFromCart(bookId) {
            this.cart = this.cart.filter(item => item.id !== bookId);
            BookStore.saveCart(this.cart);
        },
        clearCart() {
            this.cart = [];
            BookStore.saveCart(this.cart);
        },
        resetSearch() {
            this.searchParams = {
                title: '',
                author: '',
                category: '',
                priceRange: ''
            };
        },
        searchBooks() {
            // 搜索逻辑由计算属性自动处理
        },
        submitOrder() {
            if (this.cartItems.length === 0) {
                alert('购物车为空，无法结账');
                return;
            }
            if (!/^\d{16}$/.test(this.checkoutInfo.cardNumber)) {
                alert('请输入有效的16位信用卡号');
                return;
            }
            if (!/^\d{3}$/.test(this.checkoutInfo.cvc)) {
                alert('请输入有效的3位CVC码');
                return;
            }

            alert('订单提交成功！感谢您的购买！');
            this.clearCart();
            this.currentView = 'books';
        }
    },

    mounted() {
        this.loadBooks();
    }
});

app.mount('#app');