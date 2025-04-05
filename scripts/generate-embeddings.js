const { exec } = require("child_process")
const { promisify } = require("util")
const path = require("path")
const fs = require("fs")
const dotenv = require("dotenv")

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`)
  dotenv.config({ path: envPath })
}

const execAsync = promisify(exec)

// Define paths
const DATASET_PATH = process.env.DATASET_PATH || "./data/fashion-dataset"
const EMBEDDINGS_PATH = path.join(DATASET_PATH, "embeddings")
const SCRIPT_PATH = path.join(process.cwd(), "lib", "generate_embeddings.py")

// Get the path to the virtual environment's Python interpreter
const VENV_PATH = path.join(process.cwd(), ".venv")
const PYTHON_EXECUTABLE = path.join(VENV_PATH, "Scripts", "python.exe")

async function generateEmbeddings() {
  try {
    console.log("Checking if dataset exists...")
    console.log(`Dataset path: ${DATASET_PATH}`)

    if (!fs.existsSync(DATASET_PATH)) {
      console.error(`Dataset directory not found at ${DATASET_PATH}`)
      return false
    }

    // Check for images directory and metadata file
    const imagesPath = path.join(DATASET_PATH, "images")
    const metadataPath = path.join(DATASET_PATH, "styles.csv")

    if (!fs.existsSync(imagesPath) || !fs.existsSync(metadataPath)) {
      console.error("Dataset files not found. Please download the dataset manually.")
      return false
    }

    // Create embeddings directory if it doesn't exist
    if (!fs.existsSync(EMBEDDINGS_PATH)) {
      console.log("Creating embeddings directory...")
      fs.mkdirSync(EMBEDDINGS_PATH, { recursive: true })
    }

    // Check if embeddings already exist
    const imageEmbeddingsPath = path.join(EMBEDDINGS_PATH, "image_embeddings.npy")
    const textEmbeddingsPath = path.join(EMBEDDINGS_PATH, "text_embeddings.npy")
    const faissIndexPath = path.join(EMBEDDINGS_PATH, "fashion_faiss.index")

    if (fs.existsSync(imageEmbeddingsPath) && fs.existsSync(textEmbeddingsPath) && fs.existsSync(faissIndexPath)) {
      console.log("Embeddings already exist. Skipping generation.")
      return true
    }

    console.log("Generating embeddings. This may take a while...")
    console.log(`Using Python interpreter: ${PYTHON_EXECUTABLE}`)

    // Create a temporary .env file for the Python script
    const tempEnvPath = path.join(process.cwd(), "temp_env.py")
    fs.writeFileSync(
      tempEnvPath,
      `
DATASET_PATH = "${DATASET_PATH.replace(/\\/g, "\\\\")}"
EMBEDDINGS_PATH = "${EMBEDDINGS_PATH.replace(/\\/g, "\\\\")}"
    `,
    )

    // Execute Python script with environment variables
    const command = `"${PYTHON_EXECUTABLE}" "${SCRIPT_PATH}" --dataset-path "${DATASET_PATH}" --embeddings-path "${EMBEDDINGS_PATH}" --env-file "${tempEnvPath}"`
    console.log(`Running command: ${command}`)

    const { stdout, stderr } = await execAsync(command)

    // Clean up temp file
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath)
    }

    if (stderr) {
      console.error(`Python Error: ${stderr}`)
    }

    console.log(stdout)
    console.log("Embeddings generated successfully.")
    return true
  } catch (error) {
    console.error("Error generating embeddings:", error)
    return false
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  generateEmbeddings().then((success) => {
    if (success) {
      console.log("Embeddings generation completed successfully.")
    } else {
      console.error("Embeddings generation failed.")
    }
  })
}

module.exports = generateEmbeddings

