# Visual ERP Frontend

A mobile-first React frontend for the ERP system, designed to connect to the production ERP backend.

## Features

- **Mobile-First Design**: Optimized for mobile devices with responsive card-based interface
- **Real-Time Data**: Connects directly to production ERP backend APIs
- **Visual Cards**: Interactive card interface for inventory, customers, and other ERP modules
- **Modular Architecture**: Separate frontend that can be developed independently

## Setup

1. **Install Dependencies**
   ```bash
   cd visual-erp-frontend
   pnpm install
   ```

2. **Configure Backend Connection**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your production ERP backend URL:
   ```
   REACT_APP_API_URL=https://your-production-erp-backend.com
   ```

3. **Start Development Server**
   ```bash
   pnpm run dev
   ```

## Backend Integration

This frontend expects the following API endpoints from your production ERP backend:

### Inventory
- `GET /api/inventory/products` - List all products
- Expected response format:
  ```json
  {
    "success": true,
    "products": [
      {
        "id": "string",
        "name": "string",
        "sku": "string",
        "status": "Active|Inactive",
        "stockOnHand": number,
        "batches": number
      }
    ]
  }
  ```

### Customers
- `GET /api/customers` - List all customers
- Expected response format:
  ```json
  {
    "success": true,
    "customers": [
      {
        "id": "string",
        "companyName": "string",
        "contactName": "string",
        "email": "string"
      }
    ]
  }
  ```

## Deployment

### Development
```bash
pnpm run dev --host
```

### Production Build
```bash
pnpm run build
```

### Deploy to Vercel
1. Connect this repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL`: Your production ERP backend URL
3. Deploy

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Connects to existing ERP production APIs
- **Deployment**: Static frontend that can be deployed anywhere
- **Data Flow**: Frontend → Production ERP APIs → Database

## Development Workflow

1. **Frontend Development**: Work on this repository independently
2. **Backend Integration**: Ensure production ERP exposes required APIs
3. **Testing**: Test against production backend or staging environment
4. **Deployment**: Deploy frontend separately from backend

## Repository Structure

```
visual-erp-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   └── App.jsx        # Main application component
├── public/            # Static assets
├── .env.example       # Environment configuration template
└── README.md          # This file
```

## Contributing

1. Clone this repository
2. Create a feature branch
3. Make changes and test against production backend
4. Submit pull request

## License

Private - ERP System Frontend
