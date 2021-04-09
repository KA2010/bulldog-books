const { Schema, model } = require('mongoose')
    
const promoSchema = Schema({
    startDate: { type: Date, required : true },
    endDate: { type: Date, required: true },
    title: { type: String, required: true },
    discount: { type: Number, required: true },
})
    
module.exports = model('Promotion', promoSchema)