const express = require('express')
const User = require('../models/User.model')
const Order = require('../models/Order.model')
const Book = require('../models/Book.model')
const Cart = require('../models/Cart.model')
const Promotion = require('../models/Promotion.model')
const auth = require('../../auth')
const mailer = require('../../email')

const router = express.Router()

const createOrderSummary = async (orders) => {
    let summary = []
    for(var order of orders) {
        const books = await findBooks(order.bookOrderList)
        var promotion
        if(order.promotion) {
            promotion = await Promotion.findById(order.promotion)
        }
        summary.push({
            _id: order._id,
            subtotal: order.subtotal,
            tax: order.tax,
            delivery: order.delivery,
            total: order.total,
            promotion,
            bookOrderList: books
        })
    }

    return summary
}

const findBooks = async (cartItemSchema) => {
    const books = []
    for(var book of cartItemSchema) {
        books.push({book: await Book.findById(book.book), bookQuantity: book.bookQuantity})
    }

    return books
}

// Admin view to view all orders
router.get('/all-orders', auth.verifyAdmin, async (req, res, next) => {
    try {
        const orders = await Order.find({}, '_id subtotal tax delivery total promotion bookOrderList')

        const orderSummary = await createOrderSummary(orders)

        res.json(orderSummary)
    } catch(error) {
        next(error)
    }
})

// Customer view to view all of their own orders
router.get('/', auth.verifyCustomer, async (req, res, next) => {
    try {
        const id = auth.getId(req.cookies.jwt)

        const orders = await Order.find({ customer: id }, '_id subtotal tax delivery total promotion bookOrderList')

        const orderSummary = await createOrderSummary(orders)

        res.json(orderSummary)
    } catch(error) {
        next(error)
    }
})

// Customer view to view a single order
router.get('/:orderid', auth.verifyCustomer, async (req, res, next) => {
    try {
        const id = auth.getId(req.cookies.jwt)

        const orders = await Order.findOne({ customer: id,  _id: req.params.orderid }, '_id, subtotal, tax, delivery, total, promotion, bookOrderList')

        const orderSummary = await createOrderSummary([orders])

        res.json(orderSummary)
    } catch(error) {
        next(error)
    }
})

// Creates a new order from the customers cart and empties their cart
router.post('/', auth.verifyCustomer, async (req, res, next) => {
    try {

        const id = auth.getId(req.cookies.jwt)
        const { paymentId, promotionTitle } = req.body

        const cart = await Cart.findOne({ user: id })
        const cartBooks = await findBooks(cart.books)

        if(cartBooks.length == 0) {
            throw Error('Cannot create an order with no books')
        }

        let promotionAmount = 0
        var promotion
        if(promotionTitle) {
            promotion = await Promotion.findOne(promotionTitle)

            if(!promotion) {
                throw Error('Invalid promotion title')
            } else if(promotion.startDate < Date.now()) {
                throw Error('Promotion cannot be used. Promotion hasn\'t started yet')
            } else if(promotion.endDate > Date.now()) {
                throw Error('Promotion cannot be used. Promotion has already ended')
            }

            promotionAmount = promotion.discount
        }

        const reducer = (acc, cartBook) => {
            return acc + cartBook.bookQuantity * cartBook.book.sellPrice
        }

        const subtotal = (1 - promotionAmount) * cartBooks.reduce(reducer, 0)
        const delivery = 12.00
        const tax = 0.08 * subtotal
        const total = subtotal + delivery + tax

        const order = await Order.create({ 
            subtotal, 
            tax, 
            delivery, 
            total,
            promotionId: promotion ? promotion._id : null,
            customer: id,
            paymentId,
            bookOrderList: cart.books
        })

        await Cart.findByIdAndUpdate(cart._id, { books: [] })

        const user = await User.findById(id)

        mailer.sendMail(user.email, 'Thank you for your purchase', `${user.firstName} your order will be delivered shortly`)

        res.json(order)
    } catch(error) {
        next(error)
    }
})

module.exports = router