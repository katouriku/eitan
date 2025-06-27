import { type SchemaTypeDefinition } from 'sanity'
import homepage from './homepage'

const navigation: SchemaTypeDefinition = {
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    {
      name: 'items',
      title: 'Navigation Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'href', title: 'Href', type: 'string' },
          ],
        },
      ],
    },
  ],
}

const about: SchemaTypeDefinition = {
  name: 'about',
  title: 'About Me',
  type: 'document',
  fields: [
    { name: 'bio', title: 'Bio', type: 'array', of: [{ type: 'block' }] },
    { name: 'headshot', title: 'Headshot', type: 'image', options: { hotspot: true } },
  ],
}

const pricing: SchemaTypeDefinition = {
  name: 'pricing',
  title: 'Pricing',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'price', title: 'Price', type: 'string' },
    { name: 'unit', title: 'Unit', type: 'string' },
    { name: 'details', title: 'Details', type: 'array', of: [{ type: 'string' }] },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
  ],
}

const availability: SchemaTypeDefinition = {
  name: 'availability',
  title: 'Availability',
  type: 'document',
  fields: [
    {
      name: 'weeklyAvailability',
      title: 'Weekly Availability',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'day',
              title: 'Day of Week',
              type: 'string',
              options: {
                list: [
                  { title: 'Monday', value: 'monday' },
                  { title: 'Tuesday', value: 'tuesday' },
                  { title: 'Wednesday', value: 'wednesday' },
                  { title: 'Thursday', value: 'thursday' },
                  { title: 'Friday', value: 'friday' },
                  { title: 'Saturday', value: 'saturday' },
                  { title: 'Sunday', value: 'sunday' },
                ],
              },
            },
            {
              name: 'ranges',
              title: 'Time Ranges',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'start',
                      title: 'Start Time',
                      type: 'string',
                      description: 'Format: HH:mm (24h)',
                    },
                    {
                      name: 'end',
                      title: 'End Time',
                      type: 'string',
                      description: 'Format: HH:mm (24h)',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const method: SchemaTypeDefinition = {
  name: 'method',
  title: 'Method',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'content', title: 'Content', type: 'array', of: [{ type: 'block' }] },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
  ],
}

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [navigation, about, pricing, availability, method, homepage],
}
