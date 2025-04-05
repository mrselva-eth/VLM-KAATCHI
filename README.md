# KAATCHI - AI Fashion Search Platform

KAATCHI (meaning "Vision" in Tamil) is an advanced fashion search platform powered by vision-language models. It bridges the gap between visual inspiration and product discovery, making fashion search intuitive and natural.

## 🌟 Features

- **Multiple Search Methods**:
  - **Text Search**: Find products by describing what you're looking for in natural language
  - **Image Search**: Upload an image to find similar products in our extensive catalog
  - **Multimodal Search**: Combine text and images for the most precise results

- **AI-Powered Chat Interface**: Interact with our fashion assistant to get personalized recommendations
- **User Accounts**: Create an account to save your favorite items, track your search history, and manage your cart
- **Analytics Dashboard**: View your search patterns and engagement metrics
- **Admin Dashboard**: For administrators to monitor platform usage and performance

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI/ML**: CLIP (Contrastive Language-Image Pre-training), OpenAI API
- **Database**: MongoDB
- **Authentication**: JWT, Magic Link
- **Styling**: shadcn/ui components, Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+ with pip
- MongoDB instance (local or cloud)
- Kaggle account (for dataset download)
- OpenAI API key

## 🚀 Installation

### 1. Clone the repository

```shellscript
git clone https://github.com/yourusername/kaatchi-fashion-vlm.git
cd kaatchi-fashion-vlm
```

### 2. Install JavaScript dependencies

```shellscript
npm install
```

### 3. Set up Python environment

```shellscript
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate

# Install Python dependencies
pip install -r lib/requirements.txt
```

### 4. Download the dataset

The fashion dataset is approximately 15GB and is not included in the repository. You need to download it from Kaggle:

1. Visit [Fashion Product Images Dataset on Kaggle](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset)
2. Download the dataset (you may need to create a Kaggle account)
3. Extract the dataset to a directory of your choice
4. Create a `data` directory in the project root if it doesn't exist
5. Move the extracted dataset to `data/fashion-dataset` so that the structure looks like:

```plaintext
data/
  fashion-dataset/
    images/         # Contains all product images
    styles.csv      # Contains metadata for all products
```

### 5. Set up environment variables

Create a `.env.local` file in the project root with the following variables:

```plaintext
# Dataset path (update this to your actual path)
DATASET_PATH="./data/fashion-dataset"

# MongoDB connection
MONGODB_URI="mongodb://localhost:27017/kaatchi"
MONGODB_DB="kaatchi"

# Authentication
JWT_SECRET="your-jwt-secret-key"
MAGIC_SECRET_KEY="your-magic-secret-key"
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY="your-magic-publishable-key"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key"

# Admin user
ADMIN_USERNAME="admin-username"
```

## 🔧 Setup

### 1. Generate embeddings

Before using the application, you need to generate embeddings for the fashion dataset:

```shellscript
# Activate the Python virtual environment if not already activated
# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate

# Run the embedding generation script
npm run generate-embeddings
```

This process may take several hours depending on your hardware, as it processes all images in the dataset.

### 2. Start the development server

```shellscript
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📊 Project Structure

```plaintext
kaatchi-fashion-vlm/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── about/              # About page
│   ├── chat/               # Chat interface
│   ├── login/              # Login page
│   ├── product/            # Product details page
│   ├── profile/            # User profile page
│   ├── search/             # Search page
│   ├── settings/           # User settings page
│   ├── signup/             # Signup page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # UI components (shadcn/ui)
│   ├── chat-interface.tsx  # Chat interface component
│   ├── filter-section.tsx  # Search filters component
│   ├── navbar.tsx          # Navigation bar
│   └── ...                 # Other components
├── lib/                    # Utility functions and libraries
│   ├── clip_search.py      # Python script for CLIP search
│   ├── generate_embeddings.py # Python script for generating embeddings
│   ├── vlm-service.ts      # TypeScript service for VLM functionality
│   └── ...                 # Other utility files
├── public/                 # Static assets
│   ├── images/             # Image assets
│   ├── fonts/              # Font files
│   └── ...                 # Other static assets
├── scripts/                # Build and setup scripts
├── data/                   # Data directory (not in repo)
│   └── fashion-dataset/    # Fashion dataset (to be downloaded)
├── .env.local              # Environment variables
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## 🔍 Usage

### Home Page

The home page provides an overview of KAATCHI's features and capabilities. From here, you can navigate to the search page, chat interface, or learn more about the platform.

### Search Page

The search page allows you to search for fashion items using three methods:

1. **Text Search**: Enter a description of what you're looking for
2. **Image Search**: Upload an image of a fashion item
3. **Multimodal Search**: Combine text and image for more precise results

You can also filter search results by category, color, price range, and more.

### Chat Interface

The chat interface allows you to interact with our AI fashion assistant. You can:

- Ask questions about fashion items
- Get personalized recommendations
- Upload images for visual search
- Combine text and images for multimodal search

### User Profile

After creating an account, you can access your profile to:

- View your search history
- See your saved items
- Manage your cart
- View your analytics dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Fashion Product Images Dataset](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset) by Param Aggarwal on Kaggle
- [CLIP (Contrastive Language-Image Pre-training)](https://github.com/openai/CLIP) by OpenAI
- [Next.js](https://nextjs.org/) by Vercel
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling

Made with ❤️ by the KAATCHI team