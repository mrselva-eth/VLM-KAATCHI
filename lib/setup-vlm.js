const { exec } = require("child_process")
const { promisify } = require("util")
const fs = require("fs")
const path = require("path")

const execAsync = promisify(exec)

// Define paths
const DATASET_PATH = process.env.DATASET_PATH || "./data/fashion-dataset"
const EMBEDDINGS_PATH = path.join(DATASET_PATH, "embeddings")
const REQUIREMENTS_PATH = path.join(process.cwd(), "lib", "requirements.txt")

// Function to install Python dependencies
async function installDependencies() {
  try {
    console.log("Installing Python dependencies...")
    await execAsync(`pip install -r ${REQUIREMENTS_PATH}`)
    console.log("Dependencies installed successfully.")
    return true
  } catch (error) {
    console.error("Error installing dependencies:", error)
    return false
  }
}

// Function to check if dataset is downloaded
async function checkDataset() {
  try {
    if (!fs.existsSync(DATASET_PATH)) {
      console.log("Dataset directory not found. Creating...")
      fs.mkdirSync(DATASET_PATH, { recursive: true })
    }

    // Check for images directory and metadata file
    const imagesPath = path.join(DATASET_PATH, "images")
    const metadataPath = path.join(DATASET_PATH, "styles.csv")

    if (!fs.existsSync(imagesPath) || !fs.existsSync(metadataPath)) {
      console.log("Dataset files not found. Please download the dataset manually.")
      return false
    }

    console.log("Dataset found.")
    return true
  } catch (error) {
    console.error("Error checking dataset:", error)
    return false
  }
}

// Function to create embeddings directory
async function setupEmbeddingsDirectory() {
  try {
    if (!fs.existsSync(EMBEDDINGS_PATH)) {
      console.log("Creating embeddings directory...")
      fs.mkdirSync(EMBEDDINGS_PATH, { recursive: true })
    }
    return true
  } catch (error) {
    console.error("Error setting up embeddings directory:", error)
    return false
  }
}

// Main setup function
async function setupVLM() {
  console.log("Setting up VLM environment...")

  const dependenciesInstalled = await installDependencies()
  if (!dependenciesInstalled) {
    console.error("Failed to install dependencies. VLM setup aborted.")
    return false
  }

  const datasetAvailable = await checkDataset()
  if (!datasetAvailable) {
    console.warn("Dataset not available. VLM will use mock data.")
  }

  const embeddingsDirSetup = await setupEmbeddingsDirectory()
  if (!embeddingsDirSetup) {
    console.error("Failed to set up embeddings directory. VLM setup aborted.")
    return false
  }

  console.log("VLM setup completed successfully.")
  return true
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupVLM().then((success) => {
    if (success) {
      console.log("VLM setup completed successfully.")
    } else {
      console.error("VLM setup failed.")
    }
  })
}

module.exports = { setupVLM, installDependencies, checkDataset, setupEmbeddingsDirectory }

