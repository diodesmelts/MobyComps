# Prize Competition Platform

A dynamic online prize competition platform that offers an engaging and interactive user experience for exploring and participating in various competitions.

## Features

- User registration and authentication
- Browse and search competitions
- Purchase tickets for competitions
- Cart functionality
- Secure checkout with Stripe
- Admin dashboard for managing competitions
- Cloudinary integration for image uploads
- Responsive design for all devices

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js
- **Payment Processing**: Stripe
- **Image Storage**: Cloudinary
- **Deployment**: Render

## Deployment on Render

### Prerequisites

1. A Render account
2. A PostgreSQL database on Render
3. Cloudinary account for image hosting
4. Stripe account for payment processing

### Deployment Steps

1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Render
3. Create a new Web Service in Render
4. Set the following configuration:
   - **Build Command**: `./build.sh`
   - **Start Command**: `npm run start`
   - **Environment**: Node.js
   - **Environment Variables**: Copy from `.env.example` and set appropriate values

5. Link your PostgreSQL database to the web service
6. Deploy!

### Environment Variables

The following environment variables need to be set in Render:

- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: A random string for session encryption
- `PORT`: 8080 (set by Render automatically)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

## Local Development

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file based on `.env.example` and fill in the values
4. Run `npm run dev` to start the development server

## Database Management

- Schema is defined in `shared/schema.ts`
- Run migrations with `npm run db:push`