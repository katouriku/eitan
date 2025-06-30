import { type SchemaTypeDefinition } from 'sanity'

const booking: SchemaTypeDefinition = {
  name: 'booking',
  title: 'Booking',
  type: 'document',
  fields: [
    { name: 'date', title: 'Date', type: 'string', description: 'YYYY-MM-DD' },
    { name: 'time', title: 'Time', type: 'string', description: 'HH:mm - HH:mm' },
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'kana', title: 'Kana', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'lessonType', title: 'Lesson Type', type: 'string' },
    { name: 'participants', title: 'Participants', type: 'number' },
    { name: 'coupon', title: 'Coupon', type: 'string' },
    { name: 'regularPrice', title: 'Regular Price', type: 'number' },
    { name: 'discountAmount', title: 'Discount Amount', type: 'number' },
    { name: 'finalPrice', title: 'Final Price', type: 'number' },
  ],
}

export default booking;
