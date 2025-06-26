import { type SchemaTypeDefinition } from 'sanity'

const homepage: SchemaTypeDefinition = {
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    {
      name: 'mainTitle',
      title: 'Main Title',
      type: 'string',
      description: 'The main title text (e.g. エイタン)',
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'A short welcoming subtitle',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A short description for the homepage',
    },
  ],
}

export default homepage;
